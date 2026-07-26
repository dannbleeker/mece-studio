import { DEFAULT_MECE_OPTIONS, type MeceOptions } from './mece';
import { DEFAULT_LOCALE, type LocaleCode } from './types';

/** App-level preferences — persisted globally, not per-document. */
export interface Settings {
  /** The language the app renders in. One setting, one source of truth. */
  locale: LocaleCode;
  /** Lay siblings out by priority (highest first) instead of creation order. */
  sortSiblingsByPriority: boolean;
  /** Use the stricter sibling-overlap heuristic (also flags shorter shared words). */
  strictOverlap: boolean;
  /** Relative tolerance for formula reconciliation (e.g. 0.005 = 0.5%). */
  formulaTolerance: number;
}

export const DEFAULT_SETTINGS: Settings = {
  locale: DEFAULT_LOCALE,
  sortSiblingsByPriority: false,
  strictOverlap: false,
  formulaTolerance: DEFAULT_MECE_OPTIONS.formulaTolerance,
};

/** The MECE-engine knobs derived from the current settings. */
export function meceOptions(s: Settings): MeceOptions {
  return { formulaTolerance: s.formulaTolerance, strictOverlap: s.strictOverlap };
}
