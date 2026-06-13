import { describe, expect, it } from 'vitest';
import { createDoc } from './factory';
import { sensitivity } from './sensitivity';
import { addChild, setDecomposition, setNodeValue, setOperator } from './tree';

/** A formula sum: root = A + B, both leaf drivers valued. */
function profitTree(aValue: number, bValue: number | undefined) {
  let doc = createDoc('Profit', 0);
  doc = setNodeValue(doc, doc.rootId, { amount: 100 });
  const a = addChild(doc, doc.rootId, 'Revenue');
  doc = a.doc;
  const b = addChild(doc, doc.rootId, 'Cost');
  doc = b.doc;
  doc = setNodeValue(doc, a.childId, { amount: aValue });
  if (bValue !== undefined) doc = setNodeValue(doc, b.childId, { amount: bValue });
  doc = setDecomposition(doc, doc.rootId, 'formula');
  doc = setOperator(doc, doc.rootId, 'sum');
  return { doc, aId: a.childId, bId: b.childId };
}

describe('sensitivity', () => {
  it('ranks leaf drivers by how much the root value swings', () => {
    const { doc } = profitTree(80, 20);
    const result = sensitivity(doc, doc.rootId, 0.1);
    expect(result).toHaveLength(2);
    // Revenue (80) swings the sum more than Cost (20): ±10% → ±16 vs ±4.
    expect(result[0]?.label).toBe('Revenue');
    expect(result[0]?.swing).toBeGreaterThan(result[1]?.swing ?? 0);
  });

  it('returns an empty list when the root has no rolled-up value', () => {
    const doc = createDoc('Bare', 0); // a leaf, no formula, no value
    expect(sensitivity(doc, doc.rootId)).toEqual([]);
  });

  it('falls back to the stored value when a sibling driver is unvalued', () => {
    // B has no value, so the formula can't roll up — evaluate() falls back to the
    // root's stored amount, leaving the valued driver insensitive (zero swing).
    const { doc } = profitTree(80, undefined);
    const result = sensitivity(doc, doc.rootId, 0.1);
    expect(result).toHaveLength(1);
    expect(result[0]?.label).toBe('Revenue');
    expect(result[0]?.swing).toBe(0);
  });
});
