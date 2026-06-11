import { describe, expect, it } from 'vitest';
import { createDoc } from '@/domain/factory';
import {
  addChild,
  childrenOf,
  descendantIds,
  removeNode,
  renameNode,
  setDecomposition,
  setNodeValue,
  splitOf,
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
