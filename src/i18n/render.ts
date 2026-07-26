/**
 * Rendering `{ code, params }` refs from the pure domain into prose.
 *
 * This is the edge the domain seam exists for: the rule engine says *what it
 * found*, and exactly here that becomes a sentence in the reader's language.
 * Everything upstream is language-free.
 */
import type { AdvisoryMessageRef, MeceMessageRef } from '@/domain/messages';
import type { EditorMessages } from './types';

/**
 * Look a ref up in a catalogue namespace and render it.
 *
 * The cast is the one place types are loosened, and it's contained to this
 * function: the catalogue's value for a given code is `string | ((p) => string)`
 * where the param type varies per code, which no amount of generics will narrow
 * from a union. Both sides are proven consistent elsewhere — the catalogue is a
 * `MessagesOf<Params>` mapped type and the ref is a discriminated union over the
 * same keys — so the only thing that could break here is the pairing, and that
 * is exactly what the catalogue's mapped type already guarantees.
 */
function render(
  namespace: Record<string, unknown>,
  ref: { code: string; params?: unknown }
): string {
  const entry = namespace[ref.code];
  if (typeof entry === 'function') return (entry as (p: unknown) => string)(ref.params);
  return typeof entry === 'string' ? entry : ref.code;
}

/** Render a MECE rule-engine finding. */
export function renderMece(messages: EditorMessages, ref: MeceMessageRef): string {
  return render(messages.mece, ref);
}

/** Render a coaching advisory. */
export function renderAdvisory(messages: EditorMessages, ref: AdvisoryMessageRef): string {
  return render(messages.advisories, ref);
}
