import type { CheckState } from '@/domain/types';

/** One source of truth for MECE check-state colours (node badge + inspector). */
export const CHECK_STATE_COLOR: Record<CheckState, string> = {
  pass: '#3f7d54',
  warn: '#bd842c',
  unknown: '#c4c0b6',
};

/**
 * A state-carrying glyph so MECE status reads without relying on colour alone
 * (colour-blind + greyscale + screen-reader safe). Pairs with CHECK_STATE_COLOR.
 */
export const CHECK_STATE_GLYPH: Record<CheckState, string> = {
  pass: '✓',
  warn: '!',
  unknown: '–',
};

/** Human words for each state — used in title / aria-label text. */
export const CHECK_STATE_LABEL: Record<CheckState, string> = {
  pass: 'looks good',
  warn: 'needs review',
  unknown: 'not checked',
};
