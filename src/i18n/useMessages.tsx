/**
 * The React binding: the active catalogue and the active locale code.
 *
 * `MessagesProvider` sits at the app root and feeds the catalogue for the
 * persisted locale setting, so switching language re-renders everything below
 * it. `useMessages` prefers that context but falls back to reading the store
 * directly — which is what lets a component test render a single component in
 * isolation (no provider) *and* lets the pseudo-locale test wrap a subtree in a
 * provider carrying a different catalogue.
 */
import { createContext, type ReactNode, useContext, useMemo } from 'react';
import { DEFAULT_LOCALE, type LocaleCode } from '@/domain/types';
import { useStore } from '@/store';
import { catalogueFor } from './registry';
import type { Messages } from './types';

interface LocaleContextValue {
  locale: LocaleCode;
  messages: Messages;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * Provide a catalogue to everything below. With no `messages` override it
 * follows the app's locale setting — the production path. Tests pass an
 * override to render a subtree in another catalogue (see the pseudo-locale
 * smoke test) without touching global state.
 */
export function MessagesProvider({
  children,
  messages,
  locale,
}: {
  children: ReactNode;
  messages?: Messages;
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

/** The active catalogue. */
export function useMessages(): Messages {
  return useLocaleContext().messages;
}

/** The active locale code — for the `Intl` helpers, which format by locale. */
export function useLocale(): LocaleCode {
  return useLocaleContext().locale;
}

function useLocaleContext(): LocaleContextValue {
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
