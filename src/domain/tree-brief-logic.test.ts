import { describe, expect, it } from 'vitest';
import { createDoc } from './factory';
import {
  addChild,
  setProblemBrief,
  setSplitLogic,
  setSplitOrder,
  setSplitSummary,
  setTreeMode,
  splitOf,
} from './tree';

/** A doc whose root has a real split (two children). */
const withSplit = () => {
  const doc0 = createDoc('Why is profit down?', 0);
  const { doc } = addChild(doc0, doc0.rootId, 'Revenue');
  return addChild(doc, doc0.rootId, 'Cost').doc;
};

describe('setSplitLogic', () => {
  it('stores deductive and clears back to inductive (the default)', () => {
    const doc = withSplit();
    const deductive = setSplitLogic(doc, doc.rootId, 'deductive');
    expect(splitOf(deductive, doc.rootId)?.logic).toBe('deductive');
    const back = setSplitLogic(deductive, doc.rootId, 'inductive');
    expect(splitOf(back, doc.rootId)?.logic).toBeUndefined();
  });

  it('is a no-op (same reference) when unchanged or when there is no split', () => {
    const doc = withSplit();
    expect(setSplitLogic(doc, doc.rootId, 'inductive')).toBe(doc); // already the default
    const leaf = createDoc('Q', 0);
    expect(setSplitLogic(leaf, leaf.rootId, 'deductive')).toBe(leaf); // no split to set
  });
});

describe('setSplitSummary', () => {
  it('sets and clears the so-what line, trimming whitespace', () => {
    const doc = withSplit();
    const withSum = setSplitSummary(doc, doc.rootId, '  Profit is squeezed both sides  ');
    expect(splitOf(withSum, doc.rootId)?.summary).toBe('Profit is squeezed both sides');
    const cleared = setSplitSummary(withSum, doc.rootId, '   ');
    expect(splitOf(cleared, doc.rootId)?.summary).toBeUndefined();
  });

  it('no-ops when unchanged', () => {
    const doc = withSplit();
    expect(setSplitSummary(doc, doc.rootId, '')).toBe(doc);
    const withSum = setSplitSummary(doc, doc.rootId, 'x');
    expect(setSplitSummary(withSum, doc.rootId, 'x')).toBe(withSum);
  });
});

describe('setSplitOrder', () => {
  it('sets and clears the ordering principle', () => {
    const doc = withSplit();
    const timed = setSplitOrder(doc, doc.rootId, 'time');
    expect(splitOf(timed, doc.rootId)?.order).toBe('time');
    const cleared = setSplitOrder(timed, doc.rootId, undefined);
    expect(splitOf(cleared, doc.rootId)?.order).toBeUndefined();
  });

  it('no-ops when unchanged or when there is no split', () => {
    const doc = withSplit();
    expect(setSplitOrder(doc, doc.rootId, undefined)).toBe(doc);
    const leaf = createDoc('Q', 0);
    expect(setSplitOrder(leaf, leaf.rootId, 'time')).toBe(leaf);
  });
});

describe('setTreeMode', () => {
  it('sets and clears the why/how mode', () => {
    const doc = createDoc('Q', 0);
    expect(setTreeMode(doc, 'why').mode).toBe('why');
    expect(setTreeMode(setTreeMode(doc, 'why'), undefined).mode).toBeUndefined();
  });

  it('no-ops when unchanged', () => {
    const doc = createDoc('Q', 0);
    expect(setTreeMode(doc, undefined)).toBe(doc);
    const how = setTreeMode(doc, 'how');
    expect(setTreeMode(how, 'how')).toBe(how);
  });
});

describe('setProblemBrief', () => {
  it('merges fields, trims values, and drops blanks', () => {
    const doc = createDoc('Q', 0);
    const a = setProblemBrief(doc, { situation: '  Stable co  ', owner: 'CEO' });
    expect(a.problemBrief).toEqual({ situation: 'Stable co', owner: 'CEO' });
    const b = setProblemBrief(a, { complication: 'Margin fell' });
    expect(b.problemBrief).toEqual({
      situation: 'Stable co',
      owner: 'CEO',
      complication: 'Margin fell',
    });
    const c = setProblemBrief(b, { owner: '' }); // clearing removes only that key
    expect(c.problemBrief).toEqual({ situation: 'Stable co', complication: 'Margin fell' });
  });

  it('removes problemBrief entirely once every field clears', () => {
    let doc = createDoc('Q', 0);
    doc = setProblemBrief(doc, { situation: 'X' });
    expect(setProblemBrief(doc, { situation: '' }).problemBrief).toBeUndefined();
  });

  it('no-ops when the patch changes nothing', () => {
    const doc = createDoc('Q', 0);
    expect(setProblemBrief(doc, { situation: '  ' })).toBe(doc); // blank on an empty brief
    const filled = setProblemBrief(doc, { situation: 'X' });
    expect(setProblemBrief(filled, { situation: 'X' })).toBe(filled); // identical value
  });
});
