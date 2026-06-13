import type { IssueTreeDoc } from './types';

/**
 * How many of a document's splits are flagged for a MECE review — i.e. have a
 * `warn` on either axis (not mutually exclusive, or not collectively exhaustive).
 * Reads the cached `split.mece` the rule engine already computed, so it can never
 * diverge from what the canvas + inspector show. Pure.
 */
export function reviewCount(doc: IssueTreeDoc): number {
  let count = 0;
  for (const split of Object.values(doc.splits)) {
    if (split.mece.exclusive.state === 'warn' || split.mece.exhaustive.state === 'warn') count++;
  }
  return count;
}

type MeceSummaryKind = 'empty' | 'clean' | 'review';

export interface MeceSummary {
  /** `empty` = not decomposed yet; `clean` = has splits, none flagged; `review` = ≥1 flagged. */
  kind: MeceSummaryKind;
  /** Splits flagged for review (a `warn` on ME or CE). */
  warns: number;
  /** Total splits in the tree. */
  splits: number;
}

/**
 * One-glance MECE status for a whole tree. `review` when any split is flagged,
 * `clean` when it has splits and none are flagged, `empty` when it has no splits
 * yet (so we never show a misleading "0 to check"). Pure — same source of truth
 * as the canvas, so a card's pill always matches the inspector.
 */
export function meceSummary(doc: IssueTreeDoc): MeceSummary {
  const splits = Object.keys(doc.splits).length;
  const warns = reviewCount(doc);
  const kind: MeceSummaryKind = splits === 0 ? 'empty' : warns > 0 ? 'review' : 'clean';
  return { kind, warns, splits };
}
