import type { DecompositionType, IssueTreeDoc, NodeId, Split } from './types';

/** Default messages shown when the engine flags a split but leaves no message. */
const DEFAULT_EXCLUSIVE_WARNING = 'Siblings may overlap.';
const DEFAULT_EXHAUSTIVE_WARNING = 'Children may not cover the parent.';

/**
 * The MECE warnings on a single split — a `warn` on mutual-exclusivity and/or
 * collective-exhaustiveness — using the engine's own message, or a default.
 * Pure; reads the cached `split.mece`. The single source of truth both the
 * review dock and the print / presentation surfaces draw their wording from.
 */
export function splitWarnings(split: Split): string[] {
  const out: string[] = [];
  if (split.mece.exclusive.state === 'warn')
    out.push(split.mece.exclusive.message ?? DEFAULT_EXCLUSIVE_WARNING);
  if (split.mece.exhaustive.state === 'warn')
    out.push(split.mece.exhaustive.message ?? DEFAULT_EXHAUSTIVE_WARNING);
  return out;
}

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

export interface FlaggedSplit {
  nodeId: NodeId;
  /** The parent node's label. */
  label: string;
  decomposition: DecompositionType;
  /** Warning message when mutual-exclusivity is flagged, else null. */
  exclusive: string | null;
  /** Warning message when collective-exhaustiveness is flagged, else null. */
  exhaustive: string | null;
}

/**
 * Every split flagged for a MECE review — a `warn` on ME and/or CE — with the
 * engine's own messages. Powers the tree-level review dock. Pure; reads the same
 * cached `split.mece` the canvas + inspector use, so it can't drift.
 */
export function flaggedSplits(doc: IssueTreeDoc): FlaggedSplit[] {
  const out: FlaggedSplit[] = [];
  for (const split of Object.values(doc.splits)) {
    const exWarn = split.mece.exclusive.state === 'warn';
    const ceWarn = split.mece.exhaustive.state === 'warn';
    if (!exWarn && !ceWarn) continue;
    const node = doc.nodes[split.parentId];
    if (!node) continue;
    out.push({
      nodeId: split.parentId,
      label: node.label,
      decomposition: split.decomposition,
      exclusive: exWarn ? (split.mece.exclusive.message ?? DEFAULT_EXCLUSIVE_WARNING) : null,
      exhaustive: ceWarn ? (split.mece.exhaustive.message ?? DEFAULT_EXHAUSTIVE_WARNING) : null,
    });
  }
  return out;
}
