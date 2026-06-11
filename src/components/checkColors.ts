import type { CheckState } from '@/domain/types';

/** One source of truth for MECE check-state colours (node badge + inspector). */
export const CHECK_STATE_COLOR: Record<CheckState, string> = {
  pass: '#3f7d54',
  warn: '#bd842c',
  unknown: '#c4c0b6',
};
