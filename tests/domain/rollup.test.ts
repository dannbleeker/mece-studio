import { describe, expect, it } from 'vitest';
import { createDoc } from '@/domain/factory';
import { combineValues, rollUpValue } from '@/domain/rollup';
import { addChild, setDecomposition, setNodeValue } from '@/domain/tree';

describe('rollup', () => {
  it('combines values by operator', () => {
    expect(combineValues([2, 3, 5], 'sum')).toBe(10);
    expect(combineValues([2, 3, 5], undefined)).toBe(10);
    expect(combineValues([2, 3, 4], 'product')).toBe(24);
    expect(combineValues([10, 3, 2], 'difference')).toBe(5);
  });

  it('rolls up a formula split when every child is valued', () => {
    let doc = createDoc('Revenue', 1000);
    const price = addChild(doc, doc.rootId, 'Price');
    doc = price.doc;
    const volume = addChild(doc, doc.rootId, 'Volume');
    doc = volume.doc;
    doc = setDecomposition(doc, doc.rootId, 'formula');
    doc = setNodeValue(doc, price.childId, { amount: 60 });
    doc = setNodeValue(doc, volume.childId, { amount: 40 });
    expect(rollUpValue(doc, doc.rootId)).toBe(100);
  });

  it('returns undefined for a non-formula split', () => {
    let doc = createDoc('Root', 1000);
    doc = addChild(doc, doc.rootId, 'A').doc;
    doc = addChild(doc, doc.rootId, 'B').doc;
    expect(rollUpValue(doc, doc.rootId)).toBeUndefined();
  });
});
