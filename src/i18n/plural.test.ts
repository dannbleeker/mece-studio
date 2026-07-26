import { describe, expect, it } from 'vitest';
import { plural } from './plural';

describe('plural', () => {
  const forms = { one: 'sub-issue', other: 'sub-issues' };

  it('picks the singular for one and the plural for the rest', () => {
    expect(plural('en', 1, forms)).toBe('sub-issue');
    expect(plural('en', 0, forms)).toBe('sub-issues');
    expect(plural('en', 7, forms)).toBe('sub-issues');
  });

  it('falls back to `other` when the locale selects a category the message lacks', () => {
    // English never selects `few`, but a partially-written message must still
    // render something readable rather than `undefined`.
    expect(plural('en', 3, { other: 'branches', few: 'branch-few' })).toBe('branches');
  });

  it('supports ordinals, which some locales need for step labels', () => {
    const ordinals = { one: 'st', two: 'nd', few: 'rd', other: 'th' };
    expect(plural('en', 1, ordinals, 'ordinal')).toBe('st');
    expect(plural('en', 2, ordinals, 'ordinal')).toBe('nd');
    expect(plural('en', 3, ordinals, 'ordinal')).toBe('rd');
    expect(plural('en', 11, ordinals, 'ordinal')).toBe('th');
  });
});
