import { describe, expect, it } from 'vitest';
import { createDoc } from '@/domain/factory';
import { sensitivity } from '@/domain/sensitivity';
import { addChild, setDecomposition, setNodeValue, setOperator } from '@/domain/tree';

// Profit = Revenue − Cost, where Revenue = Price × Volume.
// Price 10, Volume 100 → Revenue 1000; Cost 400 → Profit 600.
function profitTree() {
  let doc = createDoc('Profit', 1);
  const root = doc.rootId;
  const revenue = addChild(doc, root, 'Revenue');
  doc = revenue.doc;
  const cost = addChild(doc, root, 'Cost');
  doc = cost.doc;
  doc = setDecomposition(doc, root, 'formula');
  doc = setOperator(doc, root, 'difference');

  const price = addChild(doc, revenue.childId, 'Price');
  doc = price.doc;
  const volume = addChild(doc, revenue.childId, 'Volume');
  doc = volume.doc;
  doc = setDecomposition(doc, revenue.childId, 'formula');
  doc = setOperator(doc, revenue.childId, 'product');

  doc = setNodeValue(doc, price.childId, { amount: 10 });
  doc = setNodeValue(doc, volume.childId, { amount: 100 });
  doc = setNodeValue(doc, cost.childId, { amount: 400 });
  return { doc, root, ids: { price: price.childId, volume: volume.childId, cost: cost.childId } };
}

describe('sensitivity', () => {
  it('swings the root through the whole formula subtree and ranks drivers', () => {
    const { doc, root, ids } = profitTree();
    const result = sensitivity(doc, root);
    const by = Object.fromEntries(result.map((d) => [d.id, d]));

    expect(result).toHaveLength(3);
    // ±10% of Price (or Volume) swings Profit by 200; Cost by 80.
    expect(by[ids.price]?.swing).toBeCloseTo(200);
    expect(by[ids.volume]?.swing).toBeCloseTo(200);
    expect(by[ids.cost]?.swing).toBeCloseTo(80);
    // Sorted most-impactful first; Cost is last.
    expect(result[0]?.swing).toBeGreaterThan(by[ids.cost]?.swing ?? 0);
    expect(result[2]?.id).toBe(ids.cost);
  });

  it('ranks sum drivers by their magnitude', () => {
    let doc = createDoc('Total', 1);
    const root = doc.rootId;
    const a = addChild(doc, root, 'A');
    doc = a.doc;
    const b = addChild(doc, root, 'B');
    doc = b.doc;
    const c = addChild(doc, root, 'C');
    doc = c.doc;
    doc = setDecomposition(doc, root, 'formula'); // default operator = sum
    doc = setNodeValue(doc, a.childId, { amount: 100 });
    doc = setNodeValue(doc, b.childId, { amount: 50 });
    doc = setNodeValue(doc, c.childId, { amount: 10 });

    const result = sensitivity(doc, root);
    expect(result.map((d) => d.label)).toEqual(['A', 'B', 'C']);
    expect(result[0]?.swing).toBeCloseTo(20);
    expect(result[1]?.swing).toBeCloseTo(10);
    expect(result[2]?.swing).toBeCloseTo(2);
  });

  it('returns nothing for a non-formula node', () => {
    let doc = createDoc('Why?', 1);
    const child = addChild(doc, doc.rootId, 'A');
    doc = setNodeValue(child.doc, child.childId, { amount: 5 });
    expect(sensitivity(doc, doc.rootId)).toEqual([]);
  });
});
