/**
 * Formatting helpers bound to this catalogue's own locale.
 *
 * A catalogue renders its own language, so it knows its own code — no need to
 * thread `locale` through every message function. A new locale copies this file
 * with its own `LOCALE` constant and everything downstream formats correctly,
 * including its own quotation marks (Danish uses »…«, German „…“).
 */
import type { LocaleCode } from '@/domain/types';
import { formatNumber, formatPercent } from '../../format';
import { type PluralForms, plural } from '../../plural';

export const LOCALE: LocaleCode = 'en';

/** A number in this locale's conventions. */
export const num = (value: number, options?: Intl.NumberFormatOptions): string =>
  formatNumber(LOCALE, value, options);

/** A raw ratio (0.023) as this locale's percentage ("2.3%"). */
export const pct = (ratio: number, maximumFractionDigits?: number): string =>
  formatPercent(LOCALE, ratio, maximumFractionDigits);

/** Pick the plural form for `count` in this locale. */
export const plur = (count: number, forms: PluralForms): string => plural(LOCALE, count, forms);

/** Wrap user-supplied text in this locale's quotation marks. */
export const quote = (text: string): string => `"${text}"`;
