/**
 * Keep the document shell in step with the active locale.
 *
 * `<html lang>` is not decoration: screen readers pick their voice from it,
 * browsers hyphenate and spell-check by it — and this app has contenteditable
 * node labels, so a wrong `lang` means the user's own text gets red-underlined
 * in the wrong language. `dir` is set from the same place so an RTL locale needs
 * no new wiring, only a registry entry.
 */
import { useEffect } from 'react';
import { localeDescriptor } from './registry';
import { useLocale, useMessages } from './useMessages';

export function useDocumentLanguage(): void {
  const locale = useLocale();
  const m = useMessages();

  useEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.dir = localeDescriptor(locale).dir;
    document.title = m.documentMeta.documentTitle;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', m.documentMeta.documentDescription);
  }, [locale, m]);
}
