import { describe, expect, it } from 'vitest';
import { createDoc } from '@/domain/factory';
import {
  addChild,
  childrenOf,
  descendantIds,
  duplicateNode,
  hiddenNodeIds,
  moveNode,
  moveSibling,
  nodeDepths,
  parentOf,
  removeNode,
  removeNodes,
  renameNode,
  setAllCollapsed,
  setAnswer,
  setDecomposition,
  setDetail,
  setDimension,
  setNodeValue,
  setOperator,
  setPriorityMany,
  setStatusMany,
  splitOf,
  toggleCollapse,
} from '@/domain/tree';

const seed = () => createDoc('Why is profit down?', 1000);

describe('tree ops', () => {
  it('addChild creates a split on the first child and appends on the next', () => {
    const doc0 = seed();
    const { doc: doc1 } = addChild(doc0, doc0.rootId, 'Revenue');
    expect(splitOf(doc1, doc0.rootId)).toBeDefined();
    expect(childrenOf(doc1, doc0.rootId).map((n) => n.label)).toEqual(['Revenue']);

    const { doc: doc2 } = addChild(doc1, doc0.rootId, 'Cost');
    expect(childrenOf(doc2, doc0.rootId).map((n) => n.label)).toEqual(['Revenue', 'Cost']);
    expect(Object.keys(doc2.splits)).toHaveLength(1);
  });

  it('nodeDepths assigns 0-based depth root-down', () => {
    const doc0 = seed();
    const { doc: doc1, childId: branch } = addChild(doc0, doc0.rootId, 'Branch');
    const { doc: doc2, childId: leaf } = addChild(doc1, branch, 'Leaf');
    const depths = nodeDepths(doc2);
    expect(depths[doc0.rootId]).toBe(0);
    expect(depths[branch]).toBe(1);
    expect(depths[leaf]).toBe(2);
  });

  it('setDecomposition changes the split type', () => {
    const doc0 = seed();
    const { doc: doc1 } = addChild(doc0, doc0.rootId, 'A');
    const doc2 = setDecomposition(doc1, doc0.rootId, 'binary');
    expect(splitOf(doc2, doc0.rootId)?.decomposition).toBe('binary');
  });

  it('renameNode updates the label', () => {
    const doc0 = seed();
    const doc1 = renameNode(doc0, doc0.rootId, 'New question?');
    expect(doc1.nodes[doc0.rootId]?.label).toBe('New question?');
  });

  it('setNodeValue sets and clears a value', () => {
    const doc0 = seed();
    const withVal = setNodeValue(doc0, doc0.rootId, { amount: 10, unit: '$' });
    expect(withVal.nodes[doc0.rootId]?.value).toEqual({ amount: 10, unit: '$' });
    const cleared = setNodeValue(withVal, doc0.rootId, undefined);
    expect(cleared.nodes[doc0.rootId]?.value).toBeUndefined();
  });

  it('setDetail sets and clears notes (blank clears)', () => {
    const doc0 = seed();
    const withNote = setDetail(doc0, doc0.rootId, 'Margin compression since Q2.');
    expect(withNote.nodes[doc0.rootId]?.detail).toBe('Margin compression since Q2.');
    const cleared = setDetail(withNote, doc0.rootId, '   ');
    expect(cleared.nodes[doc0.rootId]?.detail).toBeUndefined();
  });

  it('setOperator sets the formula combine operator', () => {
    const doc0 = seed();
    const { doc: d1 } = addChild(doc0, doc0.rootId, 'A');
    const formula = setDecomposition(d1, doc0.rootId, 'formula');
    const product = setOperator(formula, doc0.rootId, 'product');
    expect(splitOf(product, doc0.rootId)?.operator).toBe('product');
  });

  it('removeNodes / setStatusMany / setPriorityMany act on several nodes at once', () => {
    let doc = seed();
    const a = addChild(doc, doc.rootId, 'A');
    doc = a.doc;
    const b = addChild(doc, doc.rootId, 'B');
    doc = b.doc;
    const c = addChild(doc, doc.rootId, 'C');
    doc = c.doc;
    const ids = [a.childId, b.childId, c.childId];

    const parked = setStatusMany(doc, ids, 'parked');
    expect(ids.every((id) => parked.nodes[id]?.status === 'parked')).toBe(true);

    const prioritised = setPriorityMany(doc, ids, { impact: 'high', ease: 'high' });
    expect(ids.every((id) => prioritised.nodes[id]?.priority?.impact === 'high')).toBe(true);
    const cleared = setPriorityMany(prioritised, ids, undefined);
    expect(ids.every((id) => cleared.nodes[id]?.priority === undefined)).toBe(true);

    const pruned = removeNodes(doc, [a.childId, c.childId]);
    expect(childrenOf(pruned, doc.rootId).map((n) => n.label)).toEqual(['B']);
  });

  it('setAnswer sets (trimmed), no-ops when unchanged, and clears on blank', () => {
    const doc0 = seed();
    const set = setAnswer(doc0, '  Costs rose faster than revenue  ');
    expect(set.answer).toBe('Costs rose faster than revenue');
    expect(setAnswer(set, 'Costs rose faster than revenue')).toBe(set); // unchanged → same ref
    expect(setAnswer(set, '').answer).toBeUndefined();
  });

  it('setDimension sets (trimmed), no-ops when unchanged, and clears on blank', () => {
    const doc0 = seed();
    const { doc: d1 } = addChild(doc0, doc0.rootId, 'A');
    const set = setDimension(d1, doc0.rootId, '  geography  ');
    expect(splitOf(set, doc0.rootId)?.dimension).toBe('geography');
    expect(setDimension(set, doc0.rootId, 'geography')).toBe(set); // unchanged → same ref
    const cleared = setDimension(set, doc0.rootId, '');
    expect(splitOf(cleared, doc0.rootId)?.dimension).toBeUndefined();
  });

  it('toggleCollapse collapses then expands a node', () => {
    const doc0 = seed();
    const { doc } = addChild(doc0, doc0.rootId, 'A');
    const collapsed = toggleCollapse(doc, doc0.rootId);
    expect(collapsed.nodes[doc0.rootId]?.collapsed).toBe(true);
    const expanded = toggleCollapse(collapsed, doc0.rootId);
    expect(expanded.nodes[doc0.rootId]?.collapsed).toBeUndefined();
  });

  it('hiddenNodeIds hides only the descendants of a collapsed node', () => {
    let doc = seed();
    const { doc: d1, childId: a } = addChild(doc, doc.rootId, 'A');
    const { doc: d2, childId: aChild } = addChild(d1, a, 'A-child');
    doc = addChild(d2, doc.rootId, 'B').doc;
    expect(hiddenNodeIds(doc).size).toBe(0);

    const hidden = hiddenNodeIds(toggleCollapse(doc, a));
    expect(hidden.has(aChild)).toBe(true);
    expect(hidden.has(a)).toBe(false);
  });

  it('setAllCollapsed collapses non-root parents and expands all', () => {
    let doc = seed();
    const { doc: d1, childId: a } = addChild(doc, doc.rootId, 'A');
    doc = addChild(d1, a, 'A-child').doc;

    const collapsed = setAllCollapsed(doc, true);
    expect(collapsed.nodes[a]?.collapsed).toBe(true);
    expect(collapsed.nodes[doc.rootId]?.collapsed).toBeUndefined(); // root stays open

    const expanded = setAllCollapsed(collapsed, false);
    expect(expanded.nodes[a]?.collapsed).toBeUndefined();
  });

  it('parentOf finds the node a child hangs under', () => {
    const doc0 = seed();
    const { doc, childId } = addChild(doc0, doc0.rootId, 'A');
    expect(parentOf(doc, childId)).toBe(doc0.rootId);
    expect(parentOf(doc, doc0.rootId)).toBeUndefined();
  });

  it('moveNode re-parents a node under a new parent', () => {
    const doc0 = seed();
    let doc = addChild(doc0, doc0.rootId, 'Revenue').doc;
    doc = addChild(doc, doc0.rootId, 'Cost').doc;
    const childIds = splitOf(doc, doc0.rootId)?.childIds ?? [];
    const revenue = childIds[0];
    const cost = childIds[1];
    if (!revenue || !cost) throw new Error('expected two children');

    doc = moveNode(doc, cost, revenue);
    expect(childrenOf(doc, doc0.rootId).map((n) => n.label)).toEqual(['Revenue']);
    expect(childrenOf(doc, revenue).map((n) => n.label)).toEqual(['Cost']);
    expect(parentOf(doc, cost)).toBe(revenue);
  });

  it('moveNode carries the subtree and refuses cycles / the root', () => {
    const doc0 = seed();
    const { doc: d1, childId: a } = addChild(doc0, doc0.rootId, 'A');
    const { doc: d2, childId: aChild } = addChild(d1, a, 'A-child');
    const doc = addChild(d2, doc0.rootId, 'B').doc;
    const b = splitOf(doc, doc0.rootId)?.childIds.find((id) => id !== a);
    if (!b) throw new Error('expected B');

    expect(moveNode(doc, a, aChild)).toBe(doc); // onto own descendant → no-op
    expect(moveNode(doc, doc0.rootId, a)).toBe(doc); // moving the root → no-op

    const moved = moveNode(doc, a, b);
    expect(parentOf(moved, a)).toBe(b);
    expect(parentOf(moved, aChild)).toBe(a);
    expect(descendantIds(moved, b)).toContain(aChild);
  });

  it('moveNode drops an emptied old-parent split; same-parent move is a no-op', () => {
    const doc0 = seed();
    const { doc: d1, childId: a } = addChild(doc0, doc0.rootId, 'A');
    const { doc: d2, childId: a1 } = addChild(d1, a, 'A1');

    expect(splitOf(d2, a)).toBeDefined();
    const moved = moveNode(d2, a1, doc0.rootId);
    expect(splitOf(moved, a)).toBeUndefined(); // A is a leaf again
    expect(parentOf(moved, a1)).toBe(doc0.rootId);

    expect(moveNode(moved, a1, doc0.rootId)).toBe(moved); // already there
  });

  it('duplicateNode clones a subtree as a sibling with fresh ids', () => {
    const doc0 = seed();
    const { doc: d1, childId: a } = addChild(doc0, doc0.rootId, 'A');
    const { doc: d2 } = addChild(d1, a, 'A-child');
    const { doc, newId } = duplicateNode(d2, a);

    expect(childrenOf(doc, doc0.rootId)).toHaveLength(2); // A + its clone
    expect(newId).not.toBe(a);
    const cloneChildren = childrenOf(doc, newId);
    expect(cloneChildren).toHaveLength(1);
    expect(cloneChildren[0]?.label).toBe('A-child');
    expect(cloneChildren[0]?.id).not.toBe(childrenOf(doc, a)[0]?.id); // fresh ids
    expect(duplicateNode(doc, doc0.rootId).doc).toBe(doc); // root is a no-op
  });

  it('moveSibling reorders a node among its siblings', () => {
    const doc0 = seed();
    let doc = addChild(doc0, doc0.rootId, 'A').doc;
    doc = addChild(doc, doc0.rootId, 'B').doc;
    doc = addChild(doc, doc0.rootId, 'C').doc;
    const ids = splitOf(doc, doc0.rootId)?.childIds ?? [];
    const [aId, bId] = ids;
    if (!aId || !bId) throw new Error('expected children');

    expect(childrenOf(moveSibling(doc, bId, 'up'), doc0.rootId).map((n) => n.label)).toEqual([
      'B',
      'A',
      'C',
    ]);
    expect(childrenOf(moveSibling(doc, bId, 'down'), doc0.rootId).map((n) => n.label)).toEqual([
      'A',
      'C',
      'B',
    ]);
    expect(moveSibling(doc, aId, 'up')).toBe(doc); // first child can't move up
  });

  it('removeNode drops the subtree and updates the parent split; root is protected', () => {
    const doc0 = seed();
    const { doc: doc1, childId: rev } = addChild(doc0, doc0.rootId, 'Revenue');
    const { doc: doc2 } = addChild(doc1, doc0.rootId, 'Cost');
    const { doc: doc3, childId: price } = addChild(doc2, rev, 'Price');

    expect(descendantIds(doc3, doc0.rootId)).toHaveLength(3);

    const doc4 = removeNode(doc3, rev);
    expect(doc4.nodes[rev]).toBeUndefined();
    expect(doc4.nodes[price]).toBeUndefined();
    expect(childrenOf(doc4, doc0.rootId).map((n) => n.label)).toEqual(['Cost']);

    expect(removeNode(doc4, doc0.rootId)).toBe(doc4);
  });
});
