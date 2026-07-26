/**
 * The React binding: the active catalogue and the active locale code.
 *
 * Two hooks, because the catalogue has two halves (see `types.ts`):
 * - `useMessages()` returns `CoreMessages` and works anywhere.
 * - `useEditorMessages()` returns core **plus** the editor namespaces, and is
 *   only callable under the provider `Workspace` mounts.
 *
 * That split is a type boundary, not a convention: a Start-page component holds
 * `CoreMessages`, so `m.inspector` there is a compile error rather than a
 * runtime crash — and the editor wording stays out of the eager chunk.
 *
 * `MessagesProvider` sits at the app root and feeds the catalogue for the
 * persisted locale, so switching language re-renders everything below it. Both
 * hooks fall back to reading the store directly when no provider is present,
 * which is what lets a component test render one component in isolation.
 */
import { createContext, type ReactNode, useContext, useMemo } from 'react';
import { DEFAULT_LOCALE, type LocaleCode } from '@/domain/types';
import { useStore } from '@/store';
import { catalogueFor } from './registry';
import type { CoreMessages } from './types';

interface LocaleContextValue {
  locale: LocaleCode;
  messages: CoreMessages;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * Provide the core catalogue to everything below. With no `messages` override it
 * follows the app's locale setting — the production path. Tests pass an override
 * to render a subtree in another catalogue (see the pseudo-locale smoke test)
 * without touching global state.
 */
export function MessagesProvider({
  children,
  messages,
  locale,
}: {
  children: ReactNode;
  messages?: CoreMessages;
  locale?: LocaleCode;
}) {
  const settingsLocale = useStore((s) => s.settings.locale);
  const active = locale ?? settingsLocale ?? DEFAULT_LOCALE;
  const value = useMemo(
    () => ({ locale: active, messages: messages ?? catalogueFor(active) }),
    [active, messages]
  );
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/** The active core catalogue. Safe anywhere. */
export function useMessages(): CoreMessages {
  return useLocaleContext().messages;
}

/** The active locale code — for the `Intl` helpers, which format by locale. */
export function useLocale(): LocaleCode {
  return useLocaleContext().locale;
}

/** Shared by both hooks; exported so the editor module can build on it. */
export function useLocaleContext(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  // Fallback for components rendered outside the provider (isolated unit tests).
  const settingsLocale = useStore((s) => s.settings.locale);
  const fallbackLocale = settingsLocale ?? DEFAULT_LOCALE;
  const fallback = useMemo(
    () => ({ locale: fallbackLocale, messages: catalogueFor(fallbackLocale) }),
    [fallbackLocale]
  );
  return ctx ?? fallback;
}
