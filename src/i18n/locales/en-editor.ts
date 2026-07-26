/**
 * The **editor** half of the English catalogue: the canvas, the inspector, the
 * review dock, the synthesis and brief panels, the exports — and the rule
 * engine's own wording, which only those surfaces render.
 *
 * Nothing outside `Workspace`'s import graph may import this module, or the
 * whole point is lost: it exists so this wording ships in the lazy editor chunk
 * rather than on the cold-start path. `useEditorMessages()` is the only way in,
 * and it is only callable under the provider `Workspace` mounts.
 */
import { advisories } from './en/advisories';
import { brief } from './en/brief';
import { canvas } from './en/canvas';
import { exports } from './en/exports';
import { inspector } from './en/inspector';
import { mece } from './en/mece';
import { review } from './en/review';
import { settings } from './en/settings';
import { synthesis } from './en/synthesis';

export const enEditor = {
  advisories,
  brief,
  canvas,
  exports,
  inspector,
  mece,
  review,
  settings,
  synthesis,
};
