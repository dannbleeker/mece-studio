/**
 * The locale registry for the **core** catalogue — the seam every eager
 * catalogue read goes through.
 *
 * Catalogues are imported statically: that keeps the whole i18n layer
 * synchronous (no loading state, no flash of untranslated content, no async
 * setup in tests). What used to be a bundling problem — one composed object
 * dragging the editor wording onto the cold-start path — is now solved by the
 * core/editor split rather than by making reads async.
 *
 * Because *every* core read comes through `catalogueFor`, switching to
 * `await import('./locales/da-core')` when the locale count justifies it is a
 * change to this file and its editor twin, not to any call site.
 */
import { DEFAULT_LOCALE, type LocaleCode } from '@/domain/types';
import { enCore } from './locales/en-core';
import type { CoreMessages } from './types';

/** How a locale presents itself in the language picker, and how it reads. */
export interface LocaleDescriptor {
  code: LocaleCode;
  /** The language's name in the *current* UI language. */
  label: string;
  /** The language's name in its own language — what a speaker looks for. */
  nativeLabel: string;
  /** Writing direction, applied to `<html dir>`. An RTL locale needs no other wiring. */
  dir: 'ltr' | 'rtl';
}

/**
 * Every shipped locale's core catalogue. Typed `Record<LocaleCode, …>`, so
 * adding a code in `domain/types/locale.ts` without a catalogue — or the other
 * way round — fails typecheck.
 */
const CORE_CATALOGUES: Record<LocaleCode, CoreMessages> = { en: enCore };

export const LOCALES: readonly LocaleDescriptor[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', dir: 'ltr' },
];

/** The core catalogue for a locale, falling back to the default for an unknown code. */
export function catalogueFor(locale: LocaleCode): CoreMessages {
  return CORE_CATALOGUES[locale] ?? CORE_CATALOGUES[DEFAULT_LOCALE];
}

/** A locale's descriptor, falling back to the default for an unknown code. */
export function localeDescriptor(locale: LocaleCode): LocaleDescriptor {
  return (
    LOCALES.find((l) => l.code === locale) ??
    (LOCALES.find((l) => l.code === DEFAULT_LOCALE) as LocaleDescriptor)
  );
}
