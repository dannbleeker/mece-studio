import { describe, expect, it } from 'vitest';
import { createDoc } from '@/domain/factory';
import { NODE_GAP, NODE_HEIGHT, NODE_WIDTH, RANK_GAP } from '@/domain/constants';
import { layoutTree, nodeHeight } from '@/domain/layout';
import { addChild, splitOf } from '@/domain/tree';

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

  it('keeps a plain leaf at NODE_HEIGHT and adds a row per extra block', () => {
    const doc0 = createDoc('Root', 1000);
    const { doc, childId } = addChild(doc0, doc0.rootId, 'Child');
    const leaf = doc.nodes[childId];
    const root = doc.nodes[doc.rootId];
    if (!leaf || !root) throw new Error('missing node');
    expect(nodeHeight(leaf, undefined)).toBe(NODE_HEIGHT);
    // The root has a split → the ME / CE row adds 16px.
    expect(nodeHeight(root, splitOf(doc, doc.rootId))).toBe(NODE_HEIGHT + 16);
  });

  it('separates ranks by at least RANK_GAP and siblings by NODE_GAP', () => {
    let doc = createDoc('Root', 1000);
    const a = addChild(doc, doc.rootId, 'A');
    const b = addChild(a.doc, doc.rootId, 'B');
    doc = b.doc;
    const pos = layoutTree(doc, 'LR');
    const root = pos[doc.rootId];
    const pa = pos[a.childId];
    const pb = pos[b.childId];
    if (!root || !pa || !pb) throw new Error('missing position');
    expect(pa.x - (root.x + NODE_WIDTH)).toBeGreaterThanOrEqual(RANK_GAP);
    expect(Math.abs(pa.y - pb.y)).toBeGreaterThanOrEqual(NODE_HEIGHT + NODE_GAP);
  });
});
