/**
 * Plural selection via `Intl.PluralRules`.
 *
 * English needs two forms, so a hand-rolled `n === 1 ? a : b` would do today —
 * but it would have to be found and rewritten the first time a locale with more
 * forms lands (Polish has four, Arabic six). Building on the CLDR categories
 * from the start costs one small module and makes that a non-event: a locale
 * supplies the forms its grammar has, and `Intl` picks the right one.
 */
import type { LocaleCode } from '@/domain/types';

/** The CLDR plural categories. A locale supplies only the ones its grammar uses. */
type PluralCategory = Intl.LDMLPluralRule;

/**
 * Plural forms for a message. `other` is required — it is the only category
 * every locale has, and the fallback when a locale lacks the selected one.
 */
export type PluralForms = { other: string } & Partial<Record<PluralCategory, string>>;

const rules = new Map<string, Intl.PluralRules>();

function rulesFor(locale: LocaleCode, type: Intl.PluralRuleType): Intl.PluralRules {
  const key = `${locale} ${type}`;
  const hit = rules.get(key);
  if (hit) return hit;
  const made = new Intl.PluralRules(locale, { type });
  rules.set(key, made);
  return made;
}

/**
 * Pick the plural form for `count` in `locale`. Falls back to `other` when the
 * locale selects a category this message doesn't define — so a partially
 * translated message degrades to a readable string rather than `undefined`.
 */
export function plural(
  locale: LocaleCode,
  count: number,
  forms: PluralForms,
  type: Intl.PluralRuleType = 'cardinal'
): string {
  return forms[rulesFor(locale, type).select(count)] ?? forms.other;
}
