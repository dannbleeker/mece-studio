/**
 * The editor half of the React binding, in its own module **on purpose**.
 *
 * If this lived alongside `useMessages`, every eager component that imports the
 * core hook would pull `editorRegistry` — and with it the whole editor
 * catalogue — onto the cold-start path, quietly undoing the code split. Keeping
 * it separate is what makes the split real: nothing outside `Workspace`'s import
 * graph imports this file, so the wording ships in the lazy editor chunk.
 *
 * If the eager bundle ever grows by roughly the size of the editor catalogue,
 * this is the first place to look — something eager started importing it.
 */
import { createContext, type ReactNode, useContext, useMemo } from 'react';
import { editorCatalogueFor } from './editorRegistry';
import type { EditorMessages } from './types';
import { useLocaleContext } from './useMessages';

const EditorMessagesContext = createContext<EditorMessages | null>(null);

/**
 * Provide the editor catalogue. Mounted by `Workspace`, which is the lazy
 * boundary — so importing the editor wording happens as part of loading the
 * editor, not before it.
 */
export function EditorMessagesProvider({
  children,
  messages,
}: {
  children: ReactNode;
  messages?: EditorMessages;
}) {
  const { locale, messages: core } = useLocaleContext();
  // An outer provider wins over composing a fresh catalogue, so nesting is
  // idempotent: `Workspace` mounts one of these unconditionally, and a test that
  // wraps it to supply a different catalogue would otherwise have its override
  // silently replaced by the real English one.
  const outer = useContext(EditorMessagesContext);
  const value = useMemo(
    () => messages ?? outer ?? { ...core, ...editorCatalogueFor(locale) },
    [core, locale, messages, outer]
  );
  return <EditorMessagesContext.Provider value={value}>{children}</EditorMessagesContext.Provider>;
}

/**
 * The active catalogue including the editor namespaces.
 *
 * Falls back to composing it directly when no provider is present, so an
 * isolated component test still renders — the provider is about *when* the
 * chunk loads, not about correctness.
 */
export function useEditorMessages(): EditorMessages {
  const provided = useContext(EditorMessagesContext);
  const { locale, messages: core } = useLocaleContext();
  const fallback = useMemo(() => ({ ...core, ...editorCatalogueFor(locale) }), [core, locale]);
  return provided ?? fallback;
}
