import { describe, expect, it } from 'vitest';
import { createDoc } from '@/domain/factory';
import { layoutTree } from '@/domain/layout';
import { addChild } from '@/domain/tree';

describe('layoutTree', () => {
  it('returns a finite position for every node', () => {
    let doc = createDoc('Root', 1000);
    doc = addChild(doc, doc.rootId, 'A').doc;
    doc = addChild(doc, doc.rootId, 'B').doc;
    const pos = layoutTree(doc);
    expect(Object.keys(pos)).toHaveLength(Object.keys(doc.nodes).length);
    for (const p of Object.values(pos)) {
      expect(Number.isFinite(p.x)).toBe(true);
      expect(Number.isFinite(p.y)).toBe(true);
    }
  });

  it('places a child to the right of its parent in LR layout', () => {
    const doc0 = createDoc('Root', 1000);
    const { doc, childId } = addChild(doc0, doc0.rootId, 'Child');
    const pos = layoutTree(doc, 'LR');
    expect(pos[childId]?.x ?? 0).toBeGreaterThan(pos[doc.rootId]?.x ?? 0);
  });
});
