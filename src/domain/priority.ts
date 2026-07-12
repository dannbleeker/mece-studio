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
  if (!byPriorityDefault) return doc;
  const score = (id: NodeId): number => {
    const p = doc.nodes[id]?.priority;
    return p ? priorityScore(p) : -1;
  };
  const splits: Record<SplitId, Split> = {};
  for (const [id, split] of Object.entries(doc.splits)) {
    const childIds = [...split.childIds].sort((a, b) => score(b) - score(a));
    splits[id as SplitId] = { ...split, childIds };
  }
  return { ...doc, splits };
}
