/**
 * The locales the app can render in. A data concept, not a view concept: it is
 * persisted in app settings and stamped on documents, so it lives in `domain/`
 * and the i18n layer imports it (never the other way round).
 *
 * Adding a locale = add its code here, then add the matching catalogue in
 * `src/i18n/locales/`. The catalogue registry is typed against this union, so a
 * code with no catalogue (or a catalogue with no code) fails typecheck.
 */
export type LocaleCode = 'en';

/** The locale used when nothing is persisted yet, and the fallback for unknown codes. */
export const DEFAULT_LOCALE: LocaleCode = 'en';

/** Every known locale code, for iteration (the per-locale manifest build, checks). */
export const LOCALE_CODES: readonly LocaleCode[] = ['en'];

/** Narrow an untrusted string (persisted setting, imported doc) to a known locale. */
export function asLocaleCode(value: unknown): LocaleCode | undefined {
  return typeof value === 'string' && (LOCALE_CODES as readonly string[]).includes(value)
    ? (value as LocaleCode)
    : undefined;
}
