import { FORMULA_TOLERANCE, MIN_SPLIT_CHILDREN } from '../constants';
import { combineValues } from '../rollup';
import type {
  CheckResult,
  DecompositionType,
  IssueNode,
  IssueTreeDoc,
  MeceStatus,
  Split,
  SplitId,
} from '../types';

/** Tunable knobs for the MECE checks (surfaced in app Settings). */
export interface MeceOptions {
  /** Relative tolerance for formula reconciliation (children combined vs parent). */
  formulaTolerance: number;
  /** Stricter sibling-overlap heuristic — also flags shorter shared words. */
  strictOverlap: boolean;
}

export const DEFAULT_MECE_OPTIONS: MeceOptions = {
  formulaTolerance: FORMULA_TOLERANCE,
  strictOverlap: false,
};

// Words too generic to signal a real overlap, plus the placeholder nouns the
// scaffolds seed (so a fresh "Segment 1 / Segment 2" doesn't flag itself).
const OVERLAP_STOPWORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'from',
  'into',
  'per',
  'of',
  'to',
  'in',
  'on',
  'or',
  'by',
  'vs',
  'versus',
  'not',
  'new',
  'issue',
  'issues',
  'sub',
  'item',
  'items',
  'area',
  'areas',
  'segment',
  'segments',
  'stage',
  'stages',
  'term',
  'terms',
  'component',
  'components',
  'part',
  'parts',
  'group',
  'groups',
  'branch',
  'branches',
  'option',
  'options',
  'other',
  'others',
]);

const OTHER_BUCKET =
  /\b(other|others|remaining|remainder|rest|misc|miscellaneous|everything\s+else)\b/i;

function contentTokens(label: string, minLength: number): string[] {
  return label
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= minLength && !OVERLAP_STOPWORDS.has(t));
}

/**
 * ME heuristic for split types we can't prove exclusive: flag siblings that
 * share a content word. A word shared by *every* sibling (when there are ≥3) is
 * the dimension they're split on — not an overlap — so it's ignored; the check
 * then collects every overlapping pair and reports the first, naming the pair.
 */
function siblingOverlap(children: IssueNode[], strict: boolean): CheckResult {
  const minLength = strict ? 3 : 4;
  const n = children.length;
  // token → indexes of the children whose label contains it.
  const tokenChildren = new Map<string, number[]>();
  children.forEach((child, i) => {
    for (const token of new Set(contentTokens(child.label, minLength))) {
      const idxs = tokenChildren.get(token);
      if (idxs) idxs.push(i);
      else tokenChildren.set(token, [i]);
    }
  });

  const pairs: { a: string; b: string; token: string }[] = [];
  const seenPair = new Set<string>();
  for (const [token, idxs] of tokenChildren) {
    if (idxs.length < 2) continue;
    // A word every sibling shares is the split's dimension, not an overlap.
    if (n >= 3 && idxs.length === n) continue;
    for (let i = 0; i < idxs.length; i++) {
      for (let j = i + 1; j < idxs.length; j++) {
        const key = `${idxs[i]}-${idxs[j]}`;
        if (seenPair.has(key)) continue;
        seenPair.add(key);
        const a = children[idxs[i] as number];
        const b = children[idxs[j] as number];
        if (a && b) pairs.push({ a: a.label, b: b.label, token });
      }
    }
  }

  const first = pairs[0];
  if (!first) {
    return {
      state: 'unknown',
      message: "No obvious overlap — but exclusivity isn't auto-checked for this split type.",
    };
  }
  const more = pairs.length > 1 ? ` (+${pairs.length - 1} more)` : '';
  return {
    state: 'warn',
    message: `"${first.a}" and "${first.b}" may overlap (both mention "${first.token}")${more}.`,
  };
}

// A branch whose *whole* label states an axis to cut on ("By region", "Per
// quarter") rather than a category. Anchored to the start so it catches the
// real mistake — listing cut-methods as branches — without firing on ordinary
// labels that merely contain "by"/"per" (e.g. "Grow revenue by expansion").
const AXIS_PHRASE = /^(?:by|per)\s+([a-z][a-z-]{2,})/i;

function axisMarker(label: string): string | null {
  const m = AXIS_PHRASE.exec(label.trim());
  return m?.[1] ? m[1].toLowerCase() : null;
}

/**
 * Conservative lexical mixed-axis check: fires only when ≥2 siblings each *name*
 * a decomposition axis up front ("By X" / "Per X") and those axes differ — the
 * classic non-ME slip of listing several ways to cut instead of one cut's
 * categories. High-precision by design (you're flagged only if you wrote the
 * axes out), and it runs only after `siblingOverlap` finds nothing, so it adds
 * signal without masking a concrete overlap.
 */
function mixedAxis(children: IssueNode[]): CheckResult {
  const markers = children.map((c) => axisMarker(c.label)).filter((m): m is string => m !== null);
  const distinct = [...new Set(markers)];
  if (markers.length >= 2 && distinct.length >= 2) {
    const named = distinct
      .slice(0, 3)
      .map((m) => `"${m}"`)
      .join(', ');
    return {
      state: 'warn',
      message: `These branches mix decomposition axes (${named}) — cut the level on one axis so the branches don't overlap.`,
    };
  }
  return { state: 'unknown' };
}

/** CE check for segments: they're only exhaustive with an explicit "Other" bucket. */
function segmentExhaustive(children: IssueNode[]): CheckResult {
  const hasOther = children.some((c) => OTHER_BUCKET.test(c.label));
  return hasOther
    ? { state: 'pass', message: 'The "Other" bucket makes the segments collectively exhaustive.' }
    : {
        state: 'warn',
        message: 'Segments rarely cover everything — add an "Other / remaining" bucket.',
      };
}

function formulaExhaustive(
  split: Split,
  children: IssueNode[],
  doc: IssueTreeDoc,
  tolerance: number
): CheckResult {
  const parentValue = doc.nodes[split.parentId]?.value?.amount;
  const childValues = children.map((c) => c.value?.amount);
  if (parentValue === undefined || childValues.some((v) => v === undefined)) {
    return {
      state: 'unknown',
      message: 'Add a number to the parent and each child to check the totals reconcile.',
    };
  }
  const combined = combineValues(childValues as number[], split.operator);
  const denom = Math.abs(parentValue) > 1e-9 ? Math.abs(parentValue) : 1;
  const rel = Math.abs(combined - parentValue) / denom;
  return rel <= tolerance
    ? { state: 'pass', message: `Children reconcile to the parent (${combined}).` }
    : {
        state: 'warn',
        message: `Children combine to ${combined} vs parent ${parentValue} — off by ${(rel * 100).toFixed(1)}%.`,
      };
}

// A term that reads like a running total — summing it double-counts the rest.
const TOTAL_TERM = /\b(total|overall|aggregate|combined)\b/i;

/**
 * ME for a formula split. Product / difference terms are exclusive dimensions by
 * construction. Additive (sum) terms *can* double-count, so flag the classic
 * smells: a term named like a running total, or two terms with the same label.
 * (Semantic double-counts with no lexical tell are the AI judge's job.)
 */
function formulaExclusive(split: Split, children: IssueNode[]): CheckResult {
  const clean: CheckResult = { state: 'pass', message: 'Formula terms are mutually exclusive.' };
  if (split.operator && split.operator !== 'sum') return clean;
  const total = children.find((c) => TOTAL_TERM.test(c.label));
  if (total) {
    return {
      state: 'warn',
      message: `"${total.label}" reads like a running total — summing it double-counts the other terms.`,
    };
  }
  const labels = children.map((c) => c.label.trim().toLowerCase());
  const dupIndex = labels.findIndex((l, i) => l.length > 0 && labels.indexOf(l) !== i);
  if (dupIndex !== -1) {
    return {
      state: 'warn',
      message: `Two terms share the label "${children[dupIndex]?.label}" — a summed term looks double-counted.`,
    };
  }
  return clean;
}

/**
 * CE guidance for split types we can't prove exhaustive. The state stays
 * `unknown` (so it never enters the review dock or count — only `warn` does),
 * but a type-specific prompt in the inspector coaches the check the user makes.
 */
function exhaustiveHint(decomposition: DecompositionType): CheckResult {
  switch (decomposition) {
    case 'process':
      return {
        state: 'unknown',
        message:
          'Do the stages run end to end — nothing before the first or after the last, no steps skipped?',
      };
    case 'framework':
      return {
        state: 'unknown',
        message:
          "A framework organises thinking but isn't a provable partition — confirm nothing important sits outside these categories.",
      };
    default:
      return {
        state: 'unknown',
        message:
          "Freeform splits aren't auto-checked for gaps — confirm these branches cover the whole question.",
      };
  }
}

function exclusiveStatus(split: Split, children: IssueNode[], options: MeceOptions): CheckResult {
  switch (split.decomposition) {
    case 'binary':
      return children.length === 2
        ? { state: 'pass', message: 'A / not-A cannot overlap.' }
        : {
            state: 'warn',
            message: 'A binary split should have exactly two branches (A / not-A).',
          };
    case 'formula':
      return formulaExclusive(split, children);
    default: {
      // A concrete word-overlap is the stronger, more specific finding — keep it
      // first. Only when nothing overlaps do we look for a mixed-axis slip.
      const overlap = siblingOverlap(children, options.strictOverlap);
      if (overlap.state === 'warn') return overlap;
      const mixed = mixedAxis(children);
      return mixed.state === 'warn' ? mixed : overlap;
    }
  }
}

function exhaustiveStatus(
  split: Split,
  children: IssueNode[],
  doc: IssueTreeDoc,
  options: MeceOptions
): CheckResult {
  switch (split.decomposition) {
    case 'binary':
      return children.length === 2
        ? { state: 'pass', message: 'A / not-A covers every case.' }
        : {
            state: 'warn',
            message: 'A binary split should have exactly two branches (A / not-A).',
          };
    case 'formula':
      return formulaExhaustive(split, children, doc, options.formulaTolerance);
    case 'segment':
      return segmentExhaustive(children);
    default:
      return exhaustiveHint(split.decomposition);
  }
}

/**
 * Evaluate one split's MECE status — mutually exclusive (no overlap) and
 * collectively exhaustive (no gaps). Pure; the heart of the "MECE brain".
 */
export function evaluateSplit(
  split: Split,
  doc: IssueTreeDoc,
  options: MeceOptions = DEFAULT_MECE_OPTIONS
): MeceStatus {
  const children = split.childIds
    .map((id) => doc.nodes[id])
    .filter((n): n is IssueNode => n !== undefined);

  if (children.length < MIN_SPLIT_CHILDREN) {
    return {
      exclusive: { state: 'pass' },
      exhaustive: {
        state: 'warn',
        message: `A decomposition needs at least ${MIN_SPLIT_CHILDREN} sub-issues.`,
      },
    };
  }

  return {
    exclusive: exclusiveStatus(split, children, options),
    exhaustive: exhaustiveStatus(split, children, doc, options),
  };
}

/** Recompute MECE status for every split in the doc. Pure — returns a new doc. */
export function recomputeMece(
  doc: IssueTreeDoc,
  options: MeceOptions = DEFAULT_MECE_OPTIONS
): IssueTreeDoc {
  const splits: Record<SplitId, Split> = {};
  for (const [id, split] of Object.entries(doc.splits)) {
    splits[id as SplitId] = { ...split, mece: evaluateSplit(split, doc, options) };
  }
  return { ...doc, splits };
}
