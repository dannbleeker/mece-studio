import { FORMULA_TOLERANCE, MIN_SPLIT_CHILDREN } from '../constants';
import type { CheckResult, IssueNode, IssueTreeDoc, MeceStatus, Split, SplitId } from '../types';

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

function contentTokens(label: string): string[] {
  return label
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 4 && !OVERLAP_STOPWORDS.has(t));
}

/** ME heuristic for split types we can't prove exclusive: flag siblings that share a content word. */
function siblingOverlap(children: IssueNode[]): CheckResult {
  const seen = new Map<string, string>();
  for (const child of children) {
    for (const token of new Set(contentTokens(child.label))) {
      const prev = seen.get(token);
      if (prev !== undefined && prev !== child.label) {
        return {
          state: 'warn',
          message: `"${prev}" and "${child.label}" may overlap (both mention "${token}").`,
        };
      }
      if (prev === undefined) seen.set(token, child.label);
    }
  }
  return {
    state: 'unknown',
    message: "No obvious overlap — but exclusivity isn't auto-checked for this split type.",
  };
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

function combine(values: number[], operator: Split['operator']): number {
  switch (operator) {
    case 'product':
      return values.reduce((a, b) => a * b, 1);
    case 'difference':
      return values.slice(1).reduce((a, b) => a - b, values[0] ?? 0);
    default:
      return values.reduce((a, b) => a + b, 0);
  }
}

function formulaExhaustive(split: Split, children: IssueNode[], doc: IssueTreeDoc): CheckResult {
  const parentValue = doc.nodes[split.parentId]?.value?.amount;
  const childValues = children.map((c) => c.value?.amount);
  if (parentValue === undefined || childValues.some((v) => v === undefined)) {
    return {
      state: 'unknown',
      message: 'Add a number to the parent and each child to check the totals reconcile.',
    };
  }
  const combined = combine(childValues as number[], split.operator);
  const denom = Math.abs(parentValue) > 1e-9 ? Math.abs(parentValue) : 1;
  const rel = Math.abs(combined - parentValue) / denom;
  return rel <= FORMULA_TOLERANCE
    ? { state: 'pass', message: `Children reconcile to the parent (${combined}).` }
    : {
        state: 'warn',
        message: `Children combine to ${combined} vs parent ${parentValue} — off by ${(rel * 100).toFixed(1)}%.`,
      };
}

function exclusiveStatus(split: Split, children: IssueNode[]): CheckResult {
  switch (split.decomposition) {
    case 'binary':
      return children.length === 2
        ? { state: 'pass', message: 'A / not-A cannot overlap.' }
        : {
            state: 'warn',
            message: 'A binary split should have exactly two branches (A / not-A).',
          };
    case 'formula':
      return { state: 'pass', message: 'Formula terms are mutually exclusive.' };
    default:
      return siblingOverlap(children);
  }
}

function exhaustiveStatus(split: Split, children: IssueNode[], doc: IssueTreeDoc): CheckResult {
  switch (split.decomposition) {
    case 'binary':
      return children.length === 2
        ? { state: 'pass', message: 'A / not-A covers every case.' }
        : {
            state: 'warn',
            message: 'A binary split should have exactly two branches (A / not-A).',
          };
    case 'formula':
      return formulaExhaustive(split, children, doc);
    case 'segment':
      return segmentExhaustive(children);
    default:
      return { state: 'unknown' };
  }
}

/**
 * Evaluate one split's MECE status — mutually exclusive (no overlap) and
 * collectively exhaustive (no gaps). Pure; the heart of the "MECE brain".
 */
export function evaluateSplit(split: Split, doc: IssueTreeDoc): MeceStatus {
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
    exclusive: exclusiveStatus(split, children),
    exhaustive: exhaustiveStatus(split, children, doc),
  };
}

/** Recompute MECE status for every split in the doc. Pure — returns a new doc. */
export function recomputeMece(doc: IssueTreeDoc): IssueTreeDoc {
  const splits: Record<SplitId, Split> = {};
  for (const [id, split] of Object.entries(doc.splits)) {
    splits[id as SplitId] = { ...split, mece: evaluateSplit(split, doc) };
  }
  return { ...doc, splits };
}
