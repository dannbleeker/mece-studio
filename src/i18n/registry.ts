/**
 * The locale registry — the single seam every catalogue read goes through.
 *
 * Catalogues are imported statically today: with one locale that costs nothing,
 * and it keeps the whole i18n layer synchronous (no loading state, no flash of
 * untranslated content, no async setup in tests). Because *every* read comes
 * through `catalogueFor`, switching to `await import('./locales/da')` when the
 * locale count justifies it is a change to this file alone — no call site moves.
 */
import { DEFAULT_LOCALE, type LocaleCode } from '@/domain/types';
import { en } from './locales/en';
import type { Messages } from './types';

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
 * Every shipped locale, in picker order. Typed `Record<LocaleCode, …>`, so
 * adding a code in `domain/types/locale.ts` without a catalogue — or the other
 * way round — fails typecheck.
 */
const CATALOGUES: Record<LocaleCode, Messages> = { en };

export const LOCALES: readonly LocaleDescriptor[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', dir: 'ltr' },
];

/** The catalogue for a locale, falling back to the default for an unknown code. */
export function catalogueFor(locale: LocaleCode): Messages {
  return CATALOGUES[locale] ?? CATALOGUES[DEFAULT_LOCALE];
}

/** A locale's descriptor, falling back to the default for an unknown code. */
export function localeDescriptor(locale: LocaleCode): LocaleDescriptor {
  return (
    LOCALES.find((l) => l.code === locale) ??
    (LOCALES.find((l) => l.code === DEFAULT_LOCALE) as LocaleDescriptor)
  );
}
