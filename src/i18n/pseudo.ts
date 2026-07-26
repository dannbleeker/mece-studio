/**
 * The `en-XA` pseudo-locale — the test that proves the extraction is complete.
 *
 * Every string in the catalogue comes back accented and wrapped in ⟦…⟧. Render a
 * screen under it and anything still readable as plain English is a string that
 * never made it into the catalogue. That is a semantic check no lint can make:
 * the literal-string scanner can be fooled by a string built in a helper or
 * pulled from a constant, but nothing escapes "is this text bracketed?".
 *
 * Generated from `en` by walking it, never hand-maintained — a hand-written
 * pseudo catalogue would drift and would need updating with every new key.
 *
 * DEV/TEST ONLY. Nothing in `src/` imports this outside tests, so it is tree-shaken
 * out of the production bundle; the size-budget step in `pnpm verify` is what
 * keeps that honest.
 */
import { en } from './locales/en';
import type { Messages } from './types';

/**
 * Latin letters mapped to accented look-alikes. Still legible to a reader
 * checking a screenshot, but never equal to the original ASCII — which is what
 * lets a test assert "no raw English here".
 */
const ACCENTS: Record<string, string> = {
  a: 'á',
  b: 'ƀ',
  c: 'ç',
  d: 'ð',
  e: 'é',
  f: 'ƒ',
  g: 'ǧ',
  h: 'ĥ',
  i: 'í',
  j: 'ĵ',
  k: 'ķ',
  l: 'ł',
  m: 'ɱ',
  n: 'ñ',
  o: 'ó',
  p: 'ƥ',
  q: 'ǫ',
  r: 'ř',
  s: 'š',
  t: 'ť',
  u: 'ú',
  v: 'ṽ',
  w: 'ŵ',
  x: 'ẋ',
  y: 'ý',
  z: 'ž',
  A: 'Á',
  B: 'Ɓ',
  C: 'Ç',
  D: 'Ð',
  E: 'É',
  F: 'Ƒ',
  G: 'Ǧ',
  H: 'Ĥ',
  I: 'Í',
  J: 'Ĵ',
  K: 'Ķ',
  L: 'Ł',
  M: 'Ṁ',
  N: 'Ñ',
  O: 'Ó',
  P: 'Ƥ',
  Q: 'Ǫ',
  R: 'Ř',
  S: 'Š',
  T: 'Ť',
  U: 'Ú',
  V: 'Ṽ',
  W: 'Ŵ',
  X: 'Ẋ',
  Y: 'Ý',
  Z: 'Ž',
};

/** Marks the start / end of a pseudo-localised string. */
export const PSEUDO_OPEN = '⟦';
export const PSEUDO_CLOSE = '⟧';

/**
 * Accent a rendered string and bracket it.
 *
 * Interpolated user content is accented too, which is fine: the assertion is
 * about the *frame* being localised, and the brackets prove that on their own.
 */
function pseudoText(text: string): string {
  const accented = [...text].map((ch) => ACCENTS[ch] ?? ch).join('');
  return `${PSEUDO_OPEN}${accented}${PSEUDO_CLOSE}`;
}

/**
 * Deep-map a catalogue: strings are pseudo-localised in place, render functions
 * are wrapped so their *result* is, and the object shape is preserved exactly —
 * so the result is still a valid `Messages`.
 */
function pseudoValue(value: unknown): unknown {
  if (typeof value === 'string') return pseudoText(value);
  if (typeof value === 'function') {
    return (...args: unknown[]) =>
      pseudoText(String((value as (...a: unknown[]) => string)(...args)));
  }
  if (Array.isArray(value)) return value.map(pseudoValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, pseudoValue(v)])
    );
  }
  return value;
}

/** The pseudo-locale catalogue, generated from English. */
export function pseudoMessages(): Messages {
  return pseudoValue(en) as Messages;
}
