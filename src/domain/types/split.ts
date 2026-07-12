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

/**
 * How a split's branches relate horizontally (Minto). `inductive` = a grouping /
 * MECE partition (the default); `deductive` = an argument chain (premise →
 * premise → conclusion), which isn't a partition and so isn't overlap-checked.
 */
export type SplitLogic = 'inductive' | 'deductive';

/**
 * The logical order siblings sit in (Minto's three orders). `importance` sorts by
 * priority; `time` (a sequence) and `structure` (a fixed partition) keep the
 * authored order, immune to the global priority sort.
 */
export type SplitOrder = 'importance' | 'time' | 'structure';

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
  /** The single axis this split is cut on (e.g. "geography"). Optional; coaches "one dimension per level". */
  dimension?: string;
  /** Inductive grouping (a MECE partition, the default) vs a deductive argument chain. Undefined ⇒ inductive. */
  logic?: SplitLogic;
  /** The logical order the siblings sit in (Minto: importance / time / structure). Optional. */
  order?: SplitOrder;
  /** The "so-what": the one-line insight these children collectively support (Minto's synthesis / action title). */
  summary?: string;
  mece: MeceStatus;
}

/** A fresh, unevaluated MECE status (before the rule engine has run). */
export function freshMece(): MeceStatus {
  return {
    exclusive: { state: 'unknown' },
    exhaustive: { state: 'unknown' },
  };
}
