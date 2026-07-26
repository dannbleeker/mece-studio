/**
 * The locale registry for the **editor** catalogue.
 *
 * Separate from `registry.ts` for one reason: this module must stay outside the
 * eager import graph so its wording ships in the lazy `Workspace` chunk. Only
 * `useEditorMessages` imports it, and only editor surfaces call that.
 */
import { DEFAULT_LOCALE, type LocaleCode } from '@/domain/types';
import { enEditor } from './locales/en-editor';
import type { EditorOnlyMessages } from './types';

const EDITOR_CATALOGUES: Record<LocaleCode, EditorOnlyMessages> = { en: enEditor };

/** The editor catalogue for a locale, falling back to the default for an unknown code. */
export function editorCatalogueFor(locale: LocaleCode): EditorOnlyMessages {
  return EDITOR_CATALOGUES[locale] ?? EDITOR_CATALOGUES[DEFAULT_LOCALE];
}
