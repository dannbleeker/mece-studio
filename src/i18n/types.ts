/**
 * The catalogue's type — derived from English, not hand-written.
 *
 * This is the completeness gate: every other locale is declared `Messages`, so
 * `tsc` rejects a locale that is missing a key, has one English doesn't, or
 * renders a message with different params. There is deliberately no runtime
 * test for that — the compiler already proves it, and a test would only be able
 * to prove it later and less precisely.
 */
import type { en } from './locales/en';

export type Messages = typeof en;
