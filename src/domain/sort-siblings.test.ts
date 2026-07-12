import { describe, expect, it } from 'vitest';
import { createDoc } from './factory';
import { orderSiblings } from './priority';
import { addChild, setPriority, splitOf } from './tree';

describe('orderSiblings', () => {
  it('orders children highest-priority first when the global default is on; off is a no-op', () => {
    let doc = createDoc('Q', 0);
    const low = addChild(doc, doc.rootId, 'low');
    doc = low.doc;
    const none = addChild(doc, doc.rootId, 'none');
    doc = none.doc;
    const high = addChild(doc, doc.rootId, 'high');
    doc = high.doc;
    doc = setPriority(doc, low.childId, { impact: 'low', ease: 'low' }); // score 1
    doc = setPriority(doc, high.childId, { impact: 'high', ease: 'high' }); // score 9
    // `none` has no priority → sorts last.

    const original = splitOf(doc, doc.rootId)?.childIds;
    expect(original).toEqual([low.childId, none.childId, high.childId]);

    // Global default off → authored order, same reference.
    expect(orderSiblings(doc, false)).toBe(doc);

    const sorted = orderSiblings(doc, true);
    expect(splitOf(sorted, doc.rootId)?.childIds).toEqual([
      high.childId,
      low.childId,
      none.childId,
    ]);

    // The input document is untouched (view-only transform).
    expect(splitOf(doc, doc.rootId)?.childIds).toEqual(original);
  });
});
