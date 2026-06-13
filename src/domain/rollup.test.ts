import { describe, expect, it } from 'vitest';
import { createDoc } from './factory';
import { combineValues, rollUpValue } from './rollup';
import { addChild, setDecomposition, setNodeValue, setOperator } from './tree';

describe('combineValues', () => {
  it('sums by default', () => {
    expect(combineValues([10, 20, 30], undefined)).toBe(60);
  });

  it('multiplies for a product', () => {
    expect(combineValues([2, 3, 4], 'product')).toBe(24);
    expect(combineValues([], 'product')).toBe(1); // empty product is the identity
  });

  it('subtracts the tail from the head for a difference', () => {
    expect(combineValues([100, 30, 10], 'difference')).toBe(60);
    expect(combineValues([], 'difference')).toBe(0); // no head → falls back to 0
  });
});

describe('rollUpValue', () => {
  function formulaParent(childValues: (number | undefined)[]) {
    let doc = createDoc('Root', 0);
    const ids: string[] = [];
    childValues.forEach((v, i) => {
      const added = addChild(doc, doc.rootId, `C${i}`);
      doc = added.doc;
      ids.push(added.childId);
      if (v !== undefined) doc = setNodeValue(doc, added.childId, { amount: v });
    });
    doc = setDecomposition(doc, doc.rootId, 'formula');
    doc = setOperator(doc, doc.rootId, 'sum');
    return doc;
  }

  it('rolls a fully-valued formula split up to the parent', () => {
    const doc = formulaParent([40, 60]);
    expect(rollUpValue(doc, doc.rootId)).toBe(100);
  });

  it('is undefined when any child has no value', () => {
    const doc = formulaParent([40, undefined]);
    expect(rollUpValue(doc, doc.rootId)).toBeUndefined();
  });

  it('is undefined for a non-formula split', () => {
    let doc = createDoc('Root', 0);
    doc = addChild(doc, doc.rootId, 'A').doc;
    doc = addChild(doc, doc.rootId, 'B').doc;
    doc = setDecomposition(doc, doc.rootId, 'binary');
    expect(rollUpValue(doc, doc.rootId)).toBeUndefined();
  });

  it('is undefined for a leaf with no split', () => {
    const doc = createDoc('Leaf', 0);
    expect(rollUpValue(doc, doc.rootId)).toBeUndefined();
  });
});
