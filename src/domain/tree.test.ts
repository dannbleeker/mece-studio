import { describe, expect, it } from 'vitest';
import { createDoc } from './factory';
import {
  addChild,
  childrenOf,
  duplicateNode,
  moveNode,
  moveSibling,
  parentOf,
  removeNode,
} from './tree';

// Build: root → A → {A1, A2} ; root → B
function build() {
  let doc = createDoc('root', 0);
  const a = addChild(doc, doc.rootId, 'A');
  doc = a.doc;
  const b = addChild(doc, doc.rootId, 'B');
  doc = b.doc;
  const a1 = addChild(doc, a.childId, 'A1');
  doc = a1.doc;
  const a2 = addChild(doc, a.childId, 'A2');
  doc = a2.doc;
  return { doc, rootId: doc.rootId, A: a.childId, B: b.childId, A1: a1.childId, A2: a2.childId };
}

describe('moveNode', () => {
  it('re-parents a node, detaching it from its old split', () => {
    const t = build();
    const next = moveNode(t.doc, t.A1, t.B);
    expect(parentOf(next, t.A1)).toBe(t.B);
    expect(childrenOf(next, t.A).map((n) => n.id)).toEqual([t.A2]);
    expect(childrenOf(next, t.B).map((n) => n.id)).toEqual([t.A1]);
  });

  it('refuses to move a node into its own subtree (cycle guard)', () => {
    const t = build();
    expect(moveNode(t.doc, t.A, t.A1)).toBe(t.doc);
  });

  it('is a no-op for the root or the current parent', () => {
    const t = build();
    expect(moveNode(t.doc, t.rootId, t.B)).toBe(t.doc);
    expect(moveNode(t.doc, t.A1, t.A)).toBe(t.doc);
  });
});

describe('duplicateNode', () => {
  it('clones a subtree as a sibling with fresh ids', () => {
    const t = build();
    const { doc, newId } = duplicateNode(t.doc, t.A);
    expect(newId).not.toBe(t.A);
    expect(parentOf(doc, newId)).toBe(t.rootId);
    expect(doc.nodes[newId]?.label).toBe('A');
    const cloneKids = childrenOf(doc, newId).map((n) => n.id);
    expect(cloneKids).toHaveLength(2);
    expect(cloneKids).not.toContain(t.A1); // fresh ids, not the originals
  });

  it('is a no-op for the root', () => {
    const t = build();
    expect(duplicateNode(t.doc, t.rootId).doc).toBe(t.doc);
  });
});

describe('removeNode', () => {
  it('removes a node and its whole subtree', () => {
    const t = build();
    const next = removeNode(t.doc, t.A);
    expect(next.nodes[t.A]).toBeUndefined();
    expect(next.nodes[t.A1]).toBeUndefined();
    expect(childrenOf(next, t.rootId).map((n) => n.id)).toEqual([t.B]);
  });

  it('is a no-op for the root', () => {
    const t = build();
    expect(removeNode(t.doc, t.rootId)).toBe(t.doc);
  });
});

describe('moveSibling', () => {
  it('reorders within the parent and is a no-op at the ends', () => {
    const t = build();
    expect(childrenOf(t.doc, t.A).map((n) => n.id)).toEqual([t.A1, t.A2]);
    const up = moveSibling(t.doc, t.A2, 'up');
    expect(childrenOf(up, t.A).map((n) => n.id)).toEqual([t.A2, t.A1]);
    expect(moveSibling(t.doc, t.A1, 'up')).toBe(t.doc); // already first
  });
});
