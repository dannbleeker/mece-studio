/**
 * English wording for the domain's enum members.
 *
 * These words show up in three places — the inspector's pickers, the coaching
 * messages, and the exports — so they live once, here. Before this, several of
 * them were rendered by printing the raw enum value with a CSS `capitalize`,
 * which is invisible English: it looks like data but reads as prose.
 *
 * Entries stay lowercase because the call sites style them with `capitalize`;
 * a locale where that's wrong overrides the casing in its own catalogue.
 */
import type {
  CheckState,
  DecompositionType,
  EvidenceStrength,
  FormulaOperator,
  Level,
  NodeStatus,
  SplitLogic,
  SplitOrder,
  TreeMode,
} from '@/domain/types';

/** Hypothesis-tracking states. */
const status: Record<NodeStatus, string> = {
  open: 'open',
  supported: 'supported',
  refuted: 'refuted',
  parked: 'parked',
};

/** Impact / ease levels, and the priority band they combine into. */
const level: Record<Level, string> = {
  low: 'low',
  medium: 'medium',
  high: 'high',
};

/** How strongly a piece of evidence counts. */
const evidenceStrength: Record<EvidenceStrength, string> = {
  anecdote: 'anecdote',
  indicative: 'indicative',
  strong: 'strong',
};

/** Minto's horizontal relationship between branches. */
const splitLogic: Record<SplitLogic, string> = {
  inductive: 'inductive',
  deductive: 'deductive',
};

/** Minto's three logical orders for siblings. */
const splitOrder: Record<SplitOrder, string> = {
  importance: 'importance',
  time: 'time',
  structure: 'structure',
};

/** Whether the tree asks "why?" or "how?". */
const treeMode: Record<TreeMode, string> = {
  why: 'why',
  how: 'how',
};

/** How a formula split's children combine. */
const formulaOperator: Record<FormulaOperator, string> = {
  sum: 'Sum (A + B + C)',
  product: 'Product (A × B × C)',
  difference: 'Difference (A − B − …)',
};

/** Short words for a MECE check state — used in title / aria-label text. */
const checkState: Record<CheckState, string> = {
  pass: 'looks good',
  warn: 'needs review',
  unknown: 'not checked',
};

/** Human-readable label for each decomposition type. */
const decomposition: Record<DecompositionType, string> = {
  formula: 'Formula (A = B + C)',
  segment: 'Segments',
  process: 'Process / stages',
  binary: 'Binary (A / not-A)',
  framework: 'Framework',
  freeform: 'Freeform',
};

/** Short hint shown under each decomposition type in the picker. */
const decompositionHint: Record<DecompositionType, string> = {
  formula: 'Numbers that combine to the parent — provably MECE.',
  segment: 'Partition a set (customers, regions, products).',
  process: 'Sequential, non-overlapping stages of a flow.',
  binary: 'A vs not-A — exhaustive by construction.',
  framework: 'A named framework (4Ps, value chain, …).',
  freeform: 'Unconstrained — no automatic MECE guarantee.',
};

/**
 * Short tree-type label for the editor header badge, keyed by the root split's
 * decomposition. A formula root is the classic consulting "value-driver tree";
 * an undecomposed root falls back to the generic "Issue tree".
 */
const treeKind: Record<DecompositionType, string> = {
  formula: 'Value-driver tree',
  segment: 'Segmentation tree',
  process: 'Process tree',
  binary: 'Binary tree',
  framework: 'Framework tree',
  freeform: 'Issue tree',
};

export const enums = {
  status,
  level,
  evidenceStrength,
  splitLogic,
  splitOrder,
  treeMode,
  formulaOperator,
  checkState,
  decomposition,
  decompositionHint,
  treeKind,
};
