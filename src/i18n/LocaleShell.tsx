/**
 * The app's single i18n entry point: provides the catalogue for the persisted
 * locale to the whole tree, and keeps `<html lang>` / `<title>` / the meta
 * description in step with it.
 *
 * One wrapper rather than two so `main.tsx` can't wire up the catalogue and
 * forget the document shell (or vice versa).
 */
import type { ReactNode } from 'react';
import { useDocumentLanguage } from './useDocumentLanguage';
import { MessagesProvider } from './useMessages';

/** Renders nothing — it exists so the effect runs inside the provider. */
function DocumentLanguage() {
  useDocumentLanguage();
  return null;
}

export function LocaleShell({ children }: { children: ReactNode }) {
  return (
    <MessagesProvider>
      <DocumentLanguage />
      {children}
    </MessagesProvider>
  );
}
