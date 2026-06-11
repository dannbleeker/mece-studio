import { FORMULA_TOLERANCE, MIN_SPLIT_CHILDREN } from '../constants';
import type { CheckResult, IssueNode, IssueTreeDoc, MeceStatus, Split, SplitId } from '../types';

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

function formulaStatus(split: Split, children: IssueNode[], doc: IssueTreeDoc): MeceStatus {
  const exclusive: CheckResult = {
    state: 'pass',
    message: 'Formula terms are mutually exclusive.',
  };
  const parentValue = doc.nodes[split.parentId]?.value?.amount;
  const childValues = children.map((c) => c.value?.amount);

  if (parentValue === undefined || childValues.some((v) => v === undefined)) {
    return {
      exclusive,
      exhaustive: {
        state: 'unknown',
        message: 'Add a number to the parent and each child to check the totals reconcile.',
      },
    };
  }

  const combined = combine(childValues as number[], split.operator);
  const denom = Math.abs(parentValue) > 1e-9 ? Math.abs(parentValue) : 1;
  const rel = Math.abs(combined - parentValue) / denom;
  if (rel <= FORMULA_TOLERANCE) {
    return {
      exclusive,
      exhaustive: { state: 'pass', message: `Children reconcile to the parent (${combined}).` },
    };
  }
  return {
    exclusive,
    exhaustive: {
      state: 'warn',
      message: `Children combine to ${combined} vs parent ${parentValue} — off by ${(rel * 100).toFixed(1)}%.`,
    },
  };
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

  switch (split.decomposition) {
    case 'binary':
      if (children.length === 2) {
        return {
          exclusive: { state: 'pass', message: 'A / not-A cannot overlap.' },
          exhaustive: { state: 'pass', message: 'A / not-A covers every case.' },
        };
      }
      return {
        exclusive: {
          state: 'warn',
          message: 'A binary split should have exactly two branches (A / not-A).',
        },
        exhaustive: {
          state: 'warn',
          message: 'A binary split should have exactly two branches (A / not-A).',
        },
      };
    case 'formula':
      return formulaStatus(split, children, doc);
    default:
      return { exclusive: { state: 'unknown' }, exhaustive: { state: 'unknown' } };
  }
}

/** Recompute MECE status for every split in the doc. Pure — returns a new doc. */
export function recomputeMece(doc: IssueTreeDoc): IssueTreeDoc {
  const splits: Record<SplitId, Split> = {};
  for (const [id, split] of Object.entries(doc.splits)) {
    splits[id as SplitId] = { ...split, mece: evaluateSplit(split, doc) };
  }
  return { ...doc, splits };
}
