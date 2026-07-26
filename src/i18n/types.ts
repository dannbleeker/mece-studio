/**
 * The catalogue's types — derived from English, not hand-written.
 *
 * This is the completeness gate: every other locale is declared against these,
 * so `tsc` rejects a locale that is missing a key, has one English doesn't, or
 * renders a message with different params. There is deliberately no runtime test
 * for that — the compiler already proves it, earlier and more precisely.
 *
 * The core/editor split is a *type* boundary as well as a bundling one, and that
 * is the point: a Start-page component holds `CoreMessages`, so reaching for
 * `m.inspector` there doesn't compile. The mistake is caught by the same
 * mechanism that keeps the wording out of the eager chunk, rather than by
 * remembering a convention.
 */
import type { enCore } from './locales/en-core';
import type { enEditor } from './locales/en-editor';

/** What every surface can rely on — available before a tree is open. */
export type CoreMessages = typeof enCore;

/** The editor-only namespaces, shipped in the lazy `Workspace` chunk. */
export type EditorOnlyMessages = typeof enEditor;

/** What editor surfaces see: the core half plus their own. */
export type EditorMessages = CoreMessages & EditorOnlyMessages;

/**
 * The complete catalogue. A locale must satisfy this in full — the split is
 * about *when* wording loads, never about which locales have to provide it.
 */
export type Messages = EditorMessages;
