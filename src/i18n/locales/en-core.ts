/**
 * The **core** half of the English catalogue: everything the eagerly-loaded app
 * needs — the Start landing, the toasts, the shared dialog chrome, the document
 * metadata, and the seeded content the store writes into new trees.
 *
 * Split from the editor half because the editor (`Workspace`) is `React.lazy`,
 * and a single composed catalogue object dragged the inspector, canvas and
 * export wording onto the cold-start path with it. Everything here is reachable
 * before a tree is open; everything in `en-editor.ts` is not.
 *
 * Adding a namespace: put it here only if something outside `Workspace`'s import
 * graph reads it. When in doubt, editor — the bundle budget will tell you if you
 * got it wrong.
 */
import { app } from './en/app';
import { content } from './en/content';
import { documentMeta } from './en/documentMeta';
import { enums } from './en/enums';
import { start } from './en/start';

export const enCore = {
  app,
  content,
  documentMeta,
  enums,
  start,
};
