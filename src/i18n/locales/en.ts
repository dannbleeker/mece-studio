/**
 * The English catalogue — the source of truth for every user-facing string.
 *
 * `Messages` is `typeof en` (see `../types`), so this file *defines* the shape
 * every other locale must match: a missing key, an extra key, or a render
 * function with the wrong params is a typecheck failure, not a runtime surprise.
 *
 * Namespaces live in `./en/` one file per area, and are composed here. That
 * keeps a 700-line catalogue reviewable and lets two people add strings to
 * different areas without colliding in one enormous object literal.
 */
import { advisories } from './en/advisories';
import { app } from './en/app';
import { brief } from './en/brief';
import { canvas } from './en/canvas';
import { content } from './en/content';
import { documentMeta } from './en/documentMeta';
import { enums } from './en/enums';
import { exports } from './en/exports';
import { inspector } from './en/inspector';
import { mece } from './en/mece';
import { review } from './en/review';
import { settings } from './en/settings';
import { start } from './en/start';
import { synthesis } from './en/synthesis';

export const en = {
  advisories,
  app,
  brief,
  canvas,
  content,
  enums,
  exports,
  inspector,
  mece,
  documentMeta,
  review,
  settings,
  start,
  synthesis,
};
