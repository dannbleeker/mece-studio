import { describe, expect, it } from 'vitest';
import { createDoc } from '@/domain/factory';
import { addChild, setDecomposition } from '@/domain/tree';
import { en } from '@/i18n/locales/en';
import { relativeTime, treeKind } from './format';

describe('treeKind', () => {
  it('falls back to the generic kind for an undecomposed root', () => {
    expect(treeKind(createDoc('Q', 0), en)).toBe(en.enums.treeKind.freeform);
  });

  it('reflects the root split type', () => {
    let doc = createDoc('Q', 0);
    doc = addChild(doc, doc.rootId, 'A').doc;
    doc = addChild(doc, doc.rootId, 'B').doc;
    doc = setDecomposition(doc, doc.rootId, 'formula');
    expect(treeKind(doc, en)).toBe(en.enums.treeKind.formula);
    // ...and that is a different word from the undecomposed fallback.
    expect(en.enums.treeKind.formula).not.toBe(en.enums.treeKind.freeform);
  });
});

describe('relativeTime', () => {
  const now = 1_000_000_000_000;

  // The wording (and the plural rules) belong to Intl.RelativeTimeFormat — this
  // pins that we delegate, not the hand-rolled "2h ago" ladder it replaced.
  it("formats the gap in the locale's own words", () => {
    expect(relativeTime('en', now, now)).toBe('now');
    expect(relativeTime('en', now - 5 * 60_000, now)).toBe('5 minutes ago');
    expect(relativeTime('en', now - 3 * 3_600_000, now)).toBe('3 hours ago');
    expect(relativeTime('en', now - 2 * 86_400_000, now)).toBe('2 days ago');
  });
});
