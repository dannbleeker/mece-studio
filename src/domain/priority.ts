import type { IssueTreeDoc, Level, NodeId, Priority, Split, SplitId } from './types';

const LEVEL_WEIGHT: Record<Level, number> = { low: 1, medium: 2, high: 3 };

export type PriorityBand = 'low' | 'medium' | 'high';

/** Impact × ease, 1–9. Higher = chase this branch sooner (the 80/20 signal). */
export function priorityScore(p: Priority): number {
  return LEVEL_WEIGHT[p.impact] * LEVEL_WEIGHT[p.ease];
}

/** Bucket the 1–9 score into a band for display. */
export function priorityBand(p: Priority): PriorityBand {
  const score = priorityScore(p);
  if (score >= 6) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}

/**
 * Return a copy of `doc` with each split's children laid out in reading order — a
 * **view-only** transform that never mutates the stored order. `byPriorityDefault`
 * is the global "sort siblings by priority" setting: when off, the authored order
 * is kept as-is (same reference). Per-split `order` overrides this default (added
 * with the ordering-principle feature).
 */
export function orderSiblings(doc: IssueTreeDoc, byPriorityDefault: boolean): IssueTreeDoc {
  const score = (id: NodeId): number => {
    const p = doc.nodes[id]?.priority;
    return p ? priorityScore(p) : -1;
  };
  let changed = false;
  const splits: Record<SplitId, Split> = {};
  for (const [id, split] of Object.entries(doc.splits)) {
    // `importance` always sorts; `time`/`structure` always keep the authored
    // order; unset follows the global default. So a sequence or a fixed partition
    // stays put even with the global priority-sort on.
    const byPriority =
      split.order === 'importance' || (split.order === undefined && byPriorityDefault);
    if (byPriority) {
      const childIds = [...split.childIds].sort((a, b) => score(b) - score(a));
      splits[id as SplitId] = { ...split, childIds };
      changed = true;
    } else {
      splits[id as SplitId] = split;
    }
  }
  return changed ? { ...doc, splits } : doc;
}
