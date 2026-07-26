/**
 * The whole English catalogue, both halves merged.
 *
 * **Tests and tooling only.** Importing this from application code pulls the
 * editor wording onto the cold-start path and silently undoes the code split
 * (`en-core.ts` explains why the halves exist). Application code goes through
 * `useMessages()` for the core half and `useEditorMessages()` for both.
 *
 * `Messages` is `typeof en`, so this still *defines* the shape every locale must
 * match: a missing key, an extra key, or a render function with the wrong params
 * is a typecheck failure, not a runtime surprise.
 */
import { enCore } from './en-core';
import { enEditor } from './en-editor';

export const en = { ...enCore, ...enEditor };
