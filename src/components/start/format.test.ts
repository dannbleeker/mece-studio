import { describe, expect, it } from 'vitest';
import { createDoc } from '@/domain/factory';
import { addChild, setDecomposition } from '@/domain/tree';
import { relativeTime, treeKind } from './format';

describe('treeKind', () => {
  it("is 'Issue tree' for an undecomposed root", () => {
    expect(treeKind(createDoc('Q', 0))).toBe('Issue tree');
  });

  it('reflects the root split type, dropping the parenthetical', () => {
    let doc = createDoc('Q', 0);
    doc = addChild(doc, doc.rootId, 'A').doc;
    doc = addChild(doc, doc.rootId, 'B').doc;
    doc = setDecomposition(doc, doc.rootId, 'formula');
    expect(treeKind(doc)).toBe('Formula'); // "Formula (A = B + C)" → "Formula"
  });
});

describe('relativeTime', () => {
  const now = 1_000_000_000_000;
  it('formats coarse buckets', () => {
    expect(relativeTime(now, now)).toBe('just now');
    expect(relativeTime(now - 5 * 60_000, now)).toBe('5m ago');
    expect(relativeTime(now - 3 * 3_600_000, now)).toBe('3h ago');
    expect(relativeTime(now - 2 * 86_400_000, now)).toBe('2d ago');
  });
});
