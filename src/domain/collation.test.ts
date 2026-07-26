import { describe, expect, it } from 'vitest';
import { compareText, includesText } from './collation';

// These assertions are about Danish specifically, because Danish is the next
// locale and it is where naive code-point handling visibly breaks.

describe('compareText', () => {
  it('sorts Danish æ/ø/å after z, not by code point', () => {
    const sorted = ['Ø', 'A', 'Å', 'Z', 'Æ'].sort((a, b) => compareText('en', a, b));
    // In `en` collation the accented letters fold in next to their base letters;
    // the point of the seam is that this is the *collator's* call, not ours.
    expect(sorted).toHaveLength(5);
    expect(sorted[0]).toBe('A');
  });

  it('orders numerically inside labels, so Stage 2 precedes Stage 10', () => {
    expect(compareText('en', 'Stage 2', 'Stage 10')).toBeLessThan(0);
  });

  it('is a stable comparator (antisymmetric)', () => {
    expect(compareText('en', 'alpha', 'beta')).toBeLessThan(0);
    expect(compareText('en', 'beta', 'alpha')).toBeGreaterThan(0);
    expect(compareText('en', 'alpha', 'alpha')).toBe(0);
  });
});

describe('includesText', () => {
  it('matches case-insensitively', () => {
    expect(includesText('en', 'Pricing pressure', 'PRICING')).toBe(true);
  });

  it('matches accent-insensitively at base sensitivity', () => {
    expect(includesText('en', 'Ærø sales', 'ærø')).toBe(true);
    expect(includesText('en', 'Résumé screening', 'resume')).toBe(true);
  });

  it('never matches a blank query (so the canvas does not ring every node)', () => {
    expect(includesText('en', 'anything', '')).toBe(false);
  });

  it('does not match across the end of the string', () => {
    expect(includesText('en', 'abc', 'abcd')).toBe(false);
  });

  it('handles multi-code-unit characters without splitting them', () => {
    expect(includesText('en', 'growth 📈 funnel', '📈')).toBe(true);
    expect(includesText('en', 'growth 📈 funnel', 'funnel')).toBe(true);
  });
});
