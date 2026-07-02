import { describe, expect, it } from 'vitest';
import { createDoc } from './factory';
import { addChild, setNodeValue, setStatus } from './tree';
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
});
