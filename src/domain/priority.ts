import type { Level, Priority } from './types';

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
