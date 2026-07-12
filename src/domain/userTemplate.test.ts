import { describe, expect, it } from 'vitest';
import { createDoc } from './factory';
import {
  addChild,
  setNodeValue,
  setProblemBrief,
  setSplitLogic,
  setSplitOrder,
  setSplitSummary,
  setStatus,
  setTreeMode,
} from './tree';
import { templateFromDoc } from './userTemplate';

describe('templateFromDoc', () => {
  it('keeps structure + labels but strips instance data', () => {
    let doc = createDoc('Diligence checklist', 0);
    const a = addChild(doc, doc.rootId, 'Market attractive?');
    doc = a.doc;
    doc = setNodeValue(doc, a.childId, { amount: 100, unit: 'M' });
    doc = setStatus(doc, a.childId, 'supported');
    doc = { ...doc, answer: 'Yes, enter' };

    const template = templateFromDoc(doc);
    expect(template.nodes[doc.rootId]?.label).toBe('Diligence checklist');
    expect(Object.keys(template.nodes)).toHaveLength(2); // structure kept
    expect(Object.keys(template.splits)).toHaveLength(Object.keys(doc.splits).length);
    // …but instance data is gone
    expect(template.nodes[a.childId]?.value).toBeUndefined();
    expect(template.nodes[a.childId]?.status).toBe('open');
    expect(template.answer).toBeUndefined();
  });

  it('strips a split summary and the problem brief but keeps the structural logic mode', () => {
    let doc = createDoc('Cost tree', 0);
    const a = addChild(doc, doc.rootId, 'Fixed');
    doc = addChild(a.doc, a.doc.rootId, 'Variable').doc;
    doc = setSplitLogic(doc, doc.rootId, 'deductive');
    doc = setSplitOrder(doc, doc.rootId, 'time');
    doc = setSplitSummary(doc, doc.rootId, 'Costs split fixed vs variable');
    doc = setProblemBrief(doc, { situation: 'Margins down' });
    doc = setTreeMode(doc, 'how');

    const template = templateFromDoc(doc);
    const split = Object.values(template.splits)[0];
    expect(split?.logic).toBe('deductive'); // structural — kept
    expect(split?.order).toBe('time'); // structural — kept
    expect(template.mode).toBe('how'); // structural — kept
    expect(split?.summary).toBeUndefined(); // instance data — stripped
    expect(template.problemBrief).toBeUndefined();
  });
});
