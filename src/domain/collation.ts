/**
 * Locale-aware text comparison — sorting and matching user content.
 *
 * Lives in `domain/` rather than `i18n/` because it is logic, not presentation:
 * whether "Ærø" sorts before or after "Aarhus", and whether searching "aero"
 * should match "Ærø", are answers about the data. `Intl` is a language built-in,
 * so this stays framework-free and unit-testable.
 */
import type { LocaleCode } from './types';

const collators = new Map<string, Intl.Collator>();

function collatorFor(locale: LocaleCode, options: Intl.CollatorOptions): Intl.Collator {
  const key = `${locale} ${options.sensitivity ?? ''} ${options.numeric ?? ''}`;
  const hit = collators.get(key);
  if (hit) return hit;
  const made = new Intl.Collator(locale, options);
  collators.set(key, made);
  return made;
}

/**
 * Comparator for sorting user text in the locale's alphabet. Raw code-point
 * order gets Danish wrong in both directions — it puts æ/ø/å after z *and*
 * fails to fold "aa" onto "å" — where `Intl.Collator` knows the rules.
 * `numeric` so "Stage 2" sorts before "Stage 10".
 */
export function compareText(locale: LocaleCode, a: string, b: string): number {
  return collatorFor(locale, { sensitivity: 'variant', numeric: true }).compare(a, b);
}

/**
 * Locale-aware "does `haystack` contain `needle`", case- and accent-insensitive
 * at the collator's `base` sensitivity.
 *
 * `Intl` has no substring search, so this slides a window and compares. The
 * cheap lowercase check runs first and short-circuits the common exact match, so
 * per-keystroke search across a whole tree stays fast; the window only runs when
 * that misses. Grapheme-aware (`[...str]`) so a surrogate pair or combining mark
 * can't be split down the middle.
 */
export function includesText(locale: LocaleCode, haystack: string, needle: string): boolean {
  if (needle === '') return false;
  if (haystack.toLocaleLowerCase(locale).includes(needle.toLocaleLowerCase(locale))) return true;

  const collator = collatorFor(locale, { sensitivity: 'base' });
  const chars = [...haystack];
  const span = [...needle].length;
  for (let i = 0; i + span <= chars.length; i++) {
    if (collator.compare(chars.slice(i, i + span).join(''), needle) === 0) return true;
  }
  return false;
}
