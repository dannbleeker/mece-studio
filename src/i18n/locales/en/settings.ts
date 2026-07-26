/**
 * English wording for the app-wide preferences dialog.
 *
 * One key group per preference, named after the `Settings` field it controls
 * (`domain/settings.ts`), so a row and its stored value are obviously the same
 * thing — `label` is the row's heading and the control's accessible name,
 * `hint` the line underneath that says what turning it on actually does.
 */
import { pct } from './_locale';

export const settings = {
  /** The dialog shell. */
  title: 'Settings',
  subtitle: 'Preferences apply across all your trees and are saved on this device.',

  /** The language the whole app renders in. */
  locale: {
    label: 'Language',
    hint: 'The language MECE Studio is shown in.',
  },

  /** Sibling layout order: priority-ranked vs creation order. */
  sortSiblingsByPriority: {
    label: 'Sort siblings by priority',
    hint: 'Lay branches out highest-impact first, instead of the order you created them.',
  },

  /** Sensitivity of the sibling-overlap heuristic. */
  strictOverlap: {
    label: 'Stricter overlap detection',
    hint: 'Flag shorter shared words between siblings — catches more possible overlaps (and more false positives).',
  },

  /** How near a value-driver split must reconcile to count as exhaustive. */
  formulaTolerance: {
    label: 'Formula tolerance',
    hint: 'How closely a value-driver split must reconcile to count as collectively exhaustive.',
  },

  /** One choice in the tolerance picker; `ratio` is the raw ratio (0.005 = 0.5%). */
  toleranceOption: ({ ratio }: { ratio: number }) => pct(ratio),
  toleranceDefaultOption: ({ ratio }: { ratio: number }) => `${pct(ratio)} (default)`,
};
