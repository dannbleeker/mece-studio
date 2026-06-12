// Validate the feature catalogue (docs/features.json) and warn when the
// CHANGELOG has advanced past the catalogue's reviewed-through watermark.
//
// Hard-fails (exit 1) on any schema/integrity error so the catalogue stays a
// trustworthy denominator for documentation-coverage metrics. The watermark
// check only warns (a GitHub ::warning:: annotation) — drift is a nudge, not a
// build break. Node-form, zero deps; runs under the local AppLocker policy and
// identically on CI.
import { readFileSync } from 'node:fs';

const CATALOGUE = 'docs/features.json';
const CHANGELOG = 'CHANGELOG.md';

function fail(errors) {
  process.stderr.write(`\n${CATALOGUE} failed validation:\n`);
  for (const e of errors) process.stderr.write(`  - ${e}\n`);
  process.exit(1);
}

let reg;
try {
  reg = JSON.parse(readFileSync(CATALOGUE, 'utf8'));
} catch (e) {
  fail([`not valid JSON: ${e.message}`]);
}

const areas = new Set(Array.isArray(reg.areas) ? reg.areas : []);
const feats = reg.features;
if (areas.size === 0) fail(['`areas` must be a non-empty array']);
if (!Array.isArray(feats) || feats.length === 0) fail(['`features` must be a non-empty array']);

const errors = [];
const seen = new Set();
for (let i = 0; i < feats.length; i++) {
  const f = feats[i];
  const where = `features[${i}]${f && f.id ? ` (${f.id})` : ''}`;
  if (typeof f.id !== 'string' || !f.id) errors.push(`${where}: missing string id`);
  else if (seen.has(f.id)) errors.push(`duplicate id: ${f.id}`);
  else seen.add(f.id);
  if (typeof f.name !== 'string' || !f.name) errors.push(`${where}: missing name`);
  if (!areas.has(f.area)) errors.push(`${where}: area "${f.area}" not in the declared areas`);
  if (typeof f.since !== 'number') errors.push(`${where}: since must be a number`);
  for (const k of ['manual', 'book', 'bookExample'])
    if (typeof f[k] !== 'boolean') errors.push(`${where}: ${k} must be a boolean`);
  if (f.bookExample === true && f.book !== true)
    errors.push(`${where}: bookExample is true but book is false`);
}
if (errors.length) fail(errors);

// --- integrity OK: report coverage + the watermark nudge ---
const total = feats.length;
const pct = (n) => (total ? Math.round((n / total) * 1000) / 10 : 0);
const manual = feats.filter((f) => f.manual).length;
const book = feats.filter((f) => f.book).length;
const example = feats.filter((f) => f.bookExample).length;

process.stdout.write(
  `feature catalogue OK — ${total} features across ${areas.size} areas\n` +
    `  manual ${manual}/${total} (${pct(manual)}%)  book ${book}/${total} (${pct(book)}%)  examples ${example}/${total} (${pct(example)}%)\n`
);

let changelog = '';
try {
  changelog = readFileSync(CHANGELOG, 'utf8');
} catch {
  // no CHANGELOG — nothing to reconcile against
}
const bullets = (changelog.match(/^- \*\*/gm) || []).length;
const reviewed =
  typeof reg.reviewedThroughChangelogEntries === 'number' ? reg.reviewedThroughChangelogEntries : 0;
if (bullets > reviewed) {
  process.stdout.write(
    `::warning::Feature catalogue reviewed through ${reviewed} CHANGELOG entries, but CHANGELOG now has ${bullets}. ` +
      `Reconcile new user-facing features into ${CATALOGUE} and bump reviewedThroughChangelogEntries to ${bullets}.\n`
  );
}
