import type { DecompositionType } from './types';

/** Node box size, in px — the single source of truth shared by layout and the canvas. */
export const NODE_WIDTH = 220;
export const NODE_HEIGHT = 64;

/** dagre spacing (px). */
export const RANK_GAP = 90;
export const NODE_GAP = 24;

/** A decomposition needs at least this many children to be a real split. */
export const MIN_SPLIT_CHILDREN = 2;

/** Relative tolerance for formula reconciliation (children combined vs parent value). */
export const FORMULA_TOLERANCE = 0.005;

/** Human-readable labels for each decomposition type (one source of truth). */
export const DECOMPOSITION_LABELS: Record<DecompositionType, string> = {
  formula: 'Formula (A = B + C)',
  segment: 'Segments',
  process: 'Process / stages',
  binary: 'Binary (A / not-A)',
  framework: 'Framework',
  freeform: 'Freeform',
};

/**
 * Short tree-type label for the editor header badge, keyed by the root split's
 * decomposition. A formula root is the classic consulting "value-driver tree";
 * an undecomposed root falls back to the generic "Issue tree".
 */
export const TREE_KIND_LABELS: Record<DecompositionType, string> = {
  formula: 'Value-driver tree',
  segment: 'Segmentation tree',
  process: 'Process tree',
  binary: 'Binary tree',
  framework: 'Framework tree',
  freeform: 'Issue tree',
};

/** Short hint shown under each decomposition type in the picker. */
export const DECOMPOSITION_HINTS: Record<DecompositionType, string> = {
  formula: 'Numbers that combine to the parent — provably MECE.',
  segment: 'Partition a set (customers, regions, products).',
  process: 'Sequential, non-overlapping stages of a flow.',
  binary: 'A vs not-A — exhaustive by construction.',
  framework: 'A named framework (4Ps, value chain, …).',
  freeform: 'Unconstrained — no automatic MECE guarantee.',
};
