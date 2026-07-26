// Guard the i18n catalogue: no hardcoded user-facing English in components, and
// no drift between the keys the catalogue defines and the keys the app uses.
//
// What this does NOT check: that every locale is complete. That is a *typecheck*
// — every locale is declared `Messages` (= typeof en), so a missing or extra key
// is a tsc error. A runtime test would only prove it later and less precisely.
//
// Node-form, zero deps, no shell — runs under the local AppLocker policy and
// identically on CI (see CLAUDE.md).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = process.cwd();
const CATALOGUE_DIR = 'src/i18n/locales/en';
/** Surfaces that must not contain literal user-facing text (JSX + attributes). */
const UI_ROOTS = ['src/components'];
const UI_FILES = ['src/App.tsx', 'src/Workspace.tsx'];
/**
 * Additionally scanned for prose-shaped **string literals**.
 *
 * Restricting the scan to components was a real hole: two user-facing strings
 * shipped from `src/services` — the "not a valid MECE Studio tree" alert and the
 * fallback root label for an OPML import with no title. Neither is JSX, so
 * neither scan above could see them, and the pseudo-locale test only renders
 * screens, not error paths. Prose can live anywhere a string can.
 */
const CODE_ROOTS = ['src/services', 'src/domain', 'src/store', 'src/pwa', 'src/i18n'];
/**
 * Namespaces whose entries are keyed by a domain message code rather than by a
 * plain name — see `src/domain/messages.ts`. They are checked differently: the
 * question is whether a rule still emits the code, not whether a component
 * reads the property.
 */
const CODE_KEYED_NAMESPACES = new Set(['mece', 'advisories']);

/** Everything that may legitimately reference catalogue keys. */
const USAGE_ROOTS = ['src', 'e2e'];

/**
 * Text allowed to stay hardcoded in a component, with the reason it is not
 * translatable. Keep this list short and every entry justified — an allowlist
 * that grows without reasons is just a disabled rule (CLAUDE.md: a documented
 * suppression is the right tool; an undocumented one is not).
 */
const ALLOWED_LITERALS = new Map([
  ['MECE Studio', 'Brand name — never translated.'],
  ['MECE', 'Initialism for mutually exclusive, collectively exhaustive; kept as-is.'],
  ['ME', 'Axis abbreviation rendered as a badge.'],
  ['CE', 'Axis abbreviation rendered as a badge.'],
  ['A', 'Binary-split placeholder branch, not prose.'],
  ['not-A', 'Binary-split placeholder branch, not prose.'],
  ['Segoe UI', 'CSS font-family name in the exported HTML stylesheet, not prose.'],
  // These are worded in the catalogue (shortcut hints the user reads) AND
  // compared against in code, where they are `KeyboardEvent.key` values — Web
  // API constants that must never be translated.
  ['Enter', 'KeyboardEvent.key value in a handler; the shortcut hint is worded separately.'],
  ['Escape', 'KeyboardEvent.key value in a handler; the shortcut hint is worded separately.'],
  ['Delete', 'KeyboardEvent.key value in a handler; the shortcut hint is worded separately.'],
  ['Backspace', 'KeyboardEvent.key value in a handler; the shortcut hint is worded separately.'],
]);

/** Characters that are symbols/punctuation rather than words. */
const SYMBOLS_ONLY = /^[^\p{L}]*$/u;
/** Two or more letters in a row reads as a word, not a glyph or an initial. */
const HAS_WORD = /\p{L}{2,}/u;

const errors = [];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function filesUnder(paths, match) {
  const out = [];
  for (const p of paths) {
    const full = join(ROOT, p);
    try {
      if (statSync(full).isDirectory()) out.push(...walk(full));
      else out.push(full);
    } catch {
      // A configured path that no longer exists is a config bug, not a lint hit.
      errors.push(`configured path does not exist: ${p}`);
    }
  }
  return out.filter(match);
}

/** Strip comments and template/quoted strings we do not want to scan into. */
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

// ---------------------------------------------------------------------------
// 1. Collect the catalogue's leaf key paths.
// ---------------------------------------------------------------------------
// The catalogue is machine-shaped (one `export const <ns> = {` per namespace,
// two-space indent), so a line-based scan is reliable here — and the
// `catalogue-keys.test.ts` unit test compares this scan against the real
// imported object, so if this parser ever drifts from reality a test fails
// rather than the check silently passing.

/** Namespace files, keyed by the const they export. */
function catalogueFiles() {
  const dir = join(ROOT, CATALOGUE_DIR);
  return readdirSync(dir)
    .filter((f) => f.endsWith('.ts') && !f.startsWith('_'))
    .map((f) => join(dir, f));
}

/**
 * Leaf key paths inside one namespace object, e.g. ['review.empty', 'mece.exclusive.default'].
 *
 * A character scanner rather than a line matcher, because a line matcher gets
 * two things wrong that this catalogue actually does: quoted keys
 * (`'mece.exclusive.default': …`) and object literals nested inside a render
 * function's body (the `{ one, other }` passed to `plur()`), which look exactly
 * like keys one indent level in. Tracking brace *and* paren depth separates
 * "a key of the catalogue object" from "an object inside an expression".
 */
function keysFromSource(src, rootName) {
  const text = stripComments(src);
  const start = new RegExp(`export const ${rootName}\\b[^=]*=\\s*\\{`).exec(text);
  if (!start) return [];

  const keys = [];
  const path = [rootName];
  let i = start.index + start[0].length;
  let braces = 1; // object nesting, relative to the namespace object
  let parens = 0; // >0 means we're inside an expression, not the object literal
  let brackets = 0;
  /** Key seen at `name:` that may still turn out to open a nested object. */
  let pending = null;

  while (i < text.length && braces > 0) {
    const ch = text[i];

    // Keys are recognised BEFORE strings are skipped: the rule-engine
    // namespaces key their entries by the domain's message codes, which are
    // quoted ('mece.exclusive.default':). Skipping strings first swallowed
    // those as literals and silently emitted no keys at all for the two most
    // important namespaces.
    if (parens === 0 && brackets === 0 && !/[\w$.]/.test(text[i - 1] ?? '')) {
      const rest = text.slice(i);
      const key = /^(?:([A-Za-z_$][\w$]*)|'([^']+)'|"([^"]+)")\s*:/.exec(rest);
      if (key) {
        const name = key[1] ?? key[2] ?? key[3];
        pending = name;
        keys.push([...path, name].join('.'));
        i += key[0].length;
        continue;
      }
      // A shorthand entry: `name,` — a const spread into the object.
      const short = /^([A-Za-z_$][\w$]*)\s*,/.exec(rest);
      if (short?.[1]) {
        keys.push([...path, short[1]].join('.'));
        i += short[0].length;
        continue;
      }
    }

    // Skip over string and template literals wholesale.
    if (ch === "'" || ch === '"' || ch === '`') {
      const quote = ch;
      i++;
      while (i < text.length) {
        if (text[i] === '\\') i += 2;
        else if (text[i] === quote) break;
        // A template literal can nest a full expression, including braces.
        else if (quote === '`' && text[i] === '$' && text[i + 1] === '{') {
          let nested = 1;
          i += 2;
          while (i < text.length && nested > 0) {
            if (text[i] === '{') nested++;
            else if (text[i] === '}') nested--;
            i++;
          }
        } else i++;
      }
      i++;
      continue;
    }

    if (ch === '(') parens++;
    else if (ch === ')') parens--;
    else if (ch === '[') brackets++;
    else if (ch === ']') brackets--;
    else if (ch === '{') {
      braces++;
      // `foo: {` at the object's own level opens a nested namespace.
      if (pending && parens === 0 && brackets === 0) {
        path.push(pending);
        pending = null;
      }
    } else if (ch === '}') {
      braces--;
      if (braces > 0 && path.length > 1) path.pop();
    }
    i++;
  }
  return keys;
}

const defined = new Set();
for (const file of catalogueFiles()) {
  const src = readFileSync(file, 'utf8');
  for (const match of src.matchAll(/^export const ([A-Za-z_$][\w$]*)\b/gm)) {
    const name = match[1];
    for (const key of keysFromSource(src, name)) defined.add(key);
  }
}

if (defined.size === 0) {
  errors.push(`no catalogue keys found under ${CATALOGUE_DIR} — the key scanner is broken`);
}

// `--print-keys` dumps what the scanner sees and stops. `catalogue-keys.test.ts`
// runs the real script this way and diffs the output against the imported
// catalogue — so if this text scanner ever drifts from the actual object, a test
// fails loudly rather than the orphan check quietly going blind.
if (process.argv.includes('--print-keys')) {
  process.stdout.write(`${[...defined].sort().join('\n')}\n`);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// 2. Collect the key paths the app actually references.
// ---------------------------------------------------------------------------
const usageFiles = filesUnder(
  USAGE_ROOTS,
  (f) => /\.(ts|tsx)$/.test(f) && !f.includes('/locales/')
);
const referenced = new Set();

// Match on the namespace name itself rather than on the variable holding the
// catalogue. Call sites spell that variable a dozen ways — `m.review.empty`,
// `en.review.empty`, `cat(get().settings).content.scaffold` — and anchoring to
// the receiver missed the ones that come out of a call. Anchoring to the
// namespace can over-count (an unrelated `canvas.width` reads as a use of the
// `canvas` namespace), which only ever makes orphan detection *less* eager —
// the safe direction for a gate.
const namespaces = new Set([...defined].map((key) => key.split('.')[0]));

/**
 * Accesses that unambiguously go through a catalogue: `m.review.empty`,
 * `en.enums.status[st]`. Used for the *missing-key* check, where a false
 * positive would be a build break over nothing.
 */
const referencedViaCatalogue = new Set();
/** Message codes a rule actually emits, as quoted literals in the source. */
const emittedCodes = new Set();
/** `m.review.empty`, `en.…`, `msgs.…`, `messages.…` */
const CATALOGUE_ACCESS = /\b(?:m|en|msgs|messages)\.([A-Za-z_$][\w$]*)\.([A-Za-z_$][\w$]*)/g;

for (const file of usageFiles) {
  const src = stripComments(readFileSync(file, 'utf8'));

  // Broad, namespace-anchored: catches `cat(get().settings).content.scaffold`
  // and other accesses that don't come off a variable we can name. It
  // over-matches (a local `brief.situation` counts as using the `brief`
  // namespace), which only ever makes the orphan check *less* eager — the safe
  // direction, since a wrong orphan report is a false build break.
  for (const ns of namespaces) {
    const access = new RegExp(`(?<![\\w$])${ns}\\.([A-Za-z_$][\\w$]*)`, 'g');
    for (const match of src.matchAll(access)) referenced.add(`${ns}.${match[1]}`);
  }

  // Narrow, receiver-anchored: the only accesses we trust enough to *fail* on.
  for (const match of src.matchAll(CATALOGUE_ACCESS)) {
    referencedViaCatalogue.add(`${match[1]}.${match[2]}`);
  }

  // Message codes appear as quoted literals where a rule emits them.
  for (const match of src.matchAll(/['"]([a-z]+(?:\.[A-Za-z][\w]*)+)['"]/g)) {
    emittedCodes.add(match[1]);
  }
}

// A namespace read as a whole (`m.enums.status[st]`, `m.content.scaffold[type]`)
// counts as using every key beneath it — the index is dynamic, so we cannot see
// which member was picked, and demanding a static reference would be wrong.
const dynamicParents = new Set(
  [...referenced].filter((key) => [...defined].some((d) => d.startsWith(`${key}.`)))
);
for (const key of defined) {
  for (const parent of dynamicParents) {
    if (key.startsWith(`${parent}.`)) referenced.add(key);
  }
}

for (const key of defined) {
  const segments = key.split('.');
  const [namespace] = segments;

  // These two namespaces are structurally unlike the rest: their entries are
  // keyed by the domain's message codes ('mece.exclusive.siblingOverlap'), and
  // nothing reads them through property access — `renderMece` indexes the
  // namespace with whatever code the engine emitted. So "is this used?" means
  // "does a rule still emit this code?", which is a quoted literal in domain/.
  if (CODE_KEYED_NAMESPACES.has(namespace)) {
    const code = segments.slice(1).join('.');
    if (!emittedCodes.has(code)) {
      errors.push(`orphan message code (worded, never emitted by a rule): ${key}`);
    }
    continue;
  }

  // Everything else: only the two-segment leaves. Deeper ones are nested
  // objects, covered by the dynamic-parent rule above.
  if (segments.length !== 2) continue;
  if (!referenced.has(key)) errors.push(`orphan catalogue key (defined, never used): ${key}`);
}

for (const key of referencedViaCatalogue) {
  const [ns] = key.split('.');
  // Only when the namespace is real — otherwise it is some unrelated object
  // that happens to be held in a variable called `m`.
  if (!defined.has(key) && namespaces.has(ns)) {
    errors.push(`missing catalogue key (used, never defined): ${key}`);
  }
}

// ---------------------------------------------------------------------------
// 3. No literal user-facing text in components.
// ---------------------------------------------------------------------------
const TEXT_ATTRS = /\b(?:title|aria-label|placeholder|alt)=(?:"([^"]*)"|'([^']*)'|\{'([^']*)'\})/g;
/** JSX text between tags: `>Some words<`. */
const JSX_TEXT = />([^<>{}]+)</g;
/**
 * Quoted string literals anywhere in a component — the case the two scans above
 * both miss, and the most natural way to write UI text: `{flagged ? 'Needs a
 * look' : 'All clear'}`. Caught a real regression the moment it was added.
 */
const STRING_LITERAL = /'([^'\\\n]{4,})'|"([^"\\\n]{4,})"/g;
/**
 * A string that is a class list, an id, a path, or a CSS value rather than
 * prose. Tailwind is the bulk of it: hyphenated tokens, `:` variants, `[]`
 * arbitrary values, `#` colours, `/` opacities.
 */
const NOT_PROSE = /[:#[\]/@]|--|\b\w+-\w+|^\W|\.(?:tsx?|json|png|svg|html|css)$/;
/** Prose reads as words separated by spaces, starting with a capital. */
const READS_AS_PROSE = /^[A-Z][^\n]*\s+\p{L}{2,}/u;

/**
 * Source that is code, not prose. Without a real JSX parser the `>…<` scan also
 * spans things like `(s) => s.setAnswer);  …  <div`, so anything carrying code
 * punctuation or a keyword is discarded. That biases this check toward
 * precision: it can miss a string, and the `en-XA` pseudo-locale test — which
 * renders the screen and asks whether every word came from the catalogue — is
 * what covers the misses. A noisy lint gets switched off; a quiet one gets kept.
 */
const LOOKS_LIKE_CODE =
  /[;{}=]|=>|'[A-Za-z_$][\w$-]*'|\b(?:const|let|return|case|import|export|function|typeof|in)\b/;

function flagLiteral(file, text, kind) {
  const value = text.trim();
  if (value === '' || SYMBOLS_ONLY.test(value) || !HAS_WORD.test(value)) return;
  if (LOOKS_LIKE_CODE.test(value)) return;
  if (ALLOWED_LITERALS.has(value)) return;
  errors.push(`${relative(ROOT, file)}: hardcoded ${kind}: ${JSON.stringify(value)}`);
}

for (const file of filesUnder([...UI_ROOTS, ...UI_FILES], (f) => /\.tsx$/.test(f))) {
  if (/\.test\.tsx$/.test(file)) continue;
  const src = stripComments(readFileSync(file, 'utf8'));
  for (const match of src.matchAll(TEXT_ATTRS)) {
    flagLiteral(file, match[1] ?? match[2] ?? match[3] ?? '', 'attribute text');
  }
  for (const match of src.matchAll(JSX_TEXT)) {
    flagLiteral(file, match[1] ?? '', 'JSX text');
  }
  for (const match of src.matchAll(STRING_LITERAL)) {
    const value = (match[1] ?? match[2] ?? '').trim();
    if (!READS_AS_PROSE.test(value) || NOT_PROSE.test(value)) continue;
    flagLiteral(file, value, 'string literal');
  }
}

// Prose can hide in a service or a store as easily as in a component. The
// catalogue itself is exempt — it is *supposed* to be full of English.
for (const file of filesUnder(CODE_ROOTS, (f) => /\.tsx?$/.test(f))) {
  if (/\.test\.tsx?$/.test(file) || file.includes(`${CATALOGUE_DIR.replace(/\//g, sep)}${sep}`)) {
    continue;
  }
  const src = stripComments(readFileSync(file, 'utf8'));
  for (const match of src.matchAll(STRING_LITERAL)) {
    const value = (match[1] ?? match[2] ?? '').trim();
    if (!READS_AS_PROSE.test(value) || NOT_PROSE.test(value)) continue;
    flagLiteral(file, value, 'string literal');
  }
}

// ---------------------------------------------------------------------------
// 4. No literal that the catalogue already words.
// ---------------------------------------------------------------------------
// The prose heuristics above need two words to fire, so a one-word label
// (`'Untitled'`, hardcoded in the OPML importer for an unnamed outline) slipped
// past every scan. This rule needs no heuristic: if a literal is character-for-
// character a string the English catalogue already words, it is translatable by
// construction and someone wrote it twice. Zero guessing, so zero false
// positives — the reason it can be strict where the prose scan must be lenient.
/**
 * A single-token string that reads as an identifier rather than as words: a
 * bare lowercase word or anything dotted. Both are things the catalogue holds
 * that code must legitimately spell the same way — the `enums` namespace words
 * each member with the member's own spelling (`'open'`, `'high'`), and the
 * rule-engine namespaces are *keyed* by dotted message codes, which this scan
 * sees as literals too. Multi-word strings are exempt from the test, so real
 * prose that merely ends in a period is unaffected.
 */
const CODE_SHAPED = (v) => !/\s/.test(v) && (/^[a-z]\w*$/.test(v) || v.includes('.'));

const CATALOGUE_VALUES = new Set();
for (const file of catalogueFiles()) {
  for (const match of stripComments(readFileSync(file, 'utf8')).matchAll(STRING_LITERAL)) {
    const value = (match[1] ?? match[2] ?? '').trim();
    if (!HAS_WORD.test(value) || NOT_PROSE.test(value) || ALLOWED_LITERALS.has(value)) continue;
    if (CODE_SHAPED(value)) continue;
    CATALOGUE_VALUES.add(value);
  }
}

for (const file of filesUnder([...UI_ROOTS, ...UI_FILES, ...CODE_ROOTS], (f) => /\.tsx?$/.test(f))) {
  if (/\.test\.tsx?$/.test(file) || file.includes(`${CATALOGUE_DIR.replace(/\//g, sep)}${sep}`)) {
    continue;
  }
  const src = stripComments(readFileSync(file, 'utf8'));
  for (const match of src.matchAll(STRING_LITERAL)) {
    const value = (match[1] ?? match[2] ?? '').trim();
    if (!CATALOGUE_VALUES.has(value)) continue;
    errors.push(
      `${relative(ROOT, file)}: literal duplicates a catalogue string: ${JSON.stringify(value)}`
    );
  }
}

// ---------------------------------------------------------------------------
if (errors.length > 0) {
  process.stderr.write(`\ni18n check failed (${errors.length}):\n`);
  for (const e of errors) process.stderr.write(`  - ${e}\n`);
  process.stderr.write(
    '\nMove the string into src/i18n/locales/en/<namespace>.ts and read it via useMessages(),\n' +
      'or — if it is genuinely not translatable — add it to ALLOWED_LITERALS with a reason.\n'
  );
  process.exit(1);
}

process.stdout.write(`i18n: ${defined.size} catalogue keys, no hardcoded UI text\n`);
