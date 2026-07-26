import type { DecompositionType } from './types';

/** Node box size, in px — the single source of truth shared by layout and the canvas. */
export const NODE_WIDTH = 220;
export const NODE_HEIGHT = 64;

/** dagre spacing (px). */
export const RANK_GAP = 90;
export const NODE_GAP = 24;

/** A decomposition needs at least this many children to be a real split. */
export const MIN_SPLIT_CHILDREN = 2;

/** Beyond this many children a split reads as a "laundry list" (over-weighting CE). */
export const MAX_SPLIT_CHILDREN = 7;

/** The comfortable upper end to coach toward (Minto: 3–5 branches is usually best). */
export const IDEAL_SPLIT_MAX = 5;

/** Relative tolerance for formula reconciliation (children combined vs parent value). */
export const FORMULA_TOLERANCE = 0.005;

/**
 * Every decomposition type, in the order the pickers offer them. The registry
 * the UI iterates: a screen that lists decompositions maps this, so adding a
 * type surfaces everywhere without touching a component.
 *
 * The *words* for each type live in each locale's `enums` catalogue — this file
 * holds the model, not the language.
 */
export const DECOMPOSITION_TYPES: readonly DecompositionType[] = [
  'freeform',
  'segment',
  'process',
  'binary',
  'formula',
  'framework',
];
