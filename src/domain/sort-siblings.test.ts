import { describe, expect, it } from 'vitest';
import { createDoc } from './factory';
import { orderSiblings } from './priority';
import { addChild, setPriority, setSplitOrder, splitOf } from './tree';

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

  it('per-split order overrides the global default', () => {
    let doc = createDoc('Q', 0);
    const a = addChild(doc, doc.rootId, 'a');
    doc = a.doc;
    const b = addChild(doc, doc.rootId, 'b');
    doc = b.doc;
    doc = setPriority(doc, a.childId, { impact: 'low', ease: 'low' }); // score 1
    doc = setPriority(doc, b.childId, { impact: 'high', ease: 'high' }); // score 9
    const authored = [a.childId, b.childId];

    // `importance` sorts even when the global default is off.
    const imp = setSplitOrder(doc, doc.rootId, 'importance');
    expect(splitOf(orderSiblings(imp, false), doc.rootId)?.childIds).toEqual([
      b.childId,
      a.childId,
    ]);

    // `time` keeps the authored order even when the global default is on.
    const timed = setSplitOrder(doc, doc.rootId, 'time');
    expect(splitOf(orderSiblings(timed, true), doc.rootId)?.childIds).toEqual(authored);
  });
});
