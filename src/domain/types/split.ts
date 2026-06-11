import type { NodeId, SplitId } from './ids';

/** How a node is decomposed into its children. */
export type DecompositionType =
  | 'formula'
  | 'segment'
  | 'process'
  | 'binary'
  | 'framework'
  | 'freeform';

/** For `formula` splits, how children combine into the parent's value. */
export type FormulaOperator = 'sum' | 'product' | 'difference';

export type CheckState = 'pass' | 'warn' | 'unknown';

export interface CheckResult {
  state: CheckState;
  message?: string;
}

/** Cached MECE assessment of a split, recomputed by the rule engine. */
export interface MeceStatus {
  /** Mutually exclusive — children don't overlap. */
  exclusive: CheckResult;
  /** Collectively exhaustive — children cover the whole parent. */
  exhaustive: CheckResult;
}

/**
 * A split = how ONE node decomposes into its children. This is the MECE unit:
 * MECE is a property of the split, not of any single node.
 */
export interface Split {
  id: SplitId;
  parentId: NodeId;
  /** Ordered children. */
  childIds: NodeId[];
  decomposition: DecompositionType;
  /** Only meaningful for `formula` decompositions. */
  operator?: FormulaOperator;
  mece: MeceStatus;
}

/** A fresh, unevaluated MECE status (before the rule engine has run). */
export function freshMece(): MeceStatus {
  return {
    exclusive: { state: 'unknown' },
    exhaustive: { state: 'unknown' },
  };
}
