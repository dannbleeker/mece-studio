import { describe, expect, it } from 'vitest';
import { createDoc } from './factory';
import { renameNode, setDetail, setNodeValue } from './tree';

// A no-op edit returns the SAME document reference, so the store's `apply` skips
// it and it never adds a redundant step to undo/redo (e.g. focusing a field and
// blurring it without changing anything).
describe('no-op edits return the same document', () => {
  it('renameNode to the identical label is a no-op', () => {
    const doc = createDoc('Why?', 0);
    expect(renameNode(doc, doc.rootId, 'Why?')).toBe(doc);
    expect(renameNode(doc, doc.rootId, 'Changed')).not.toBe(doc);
  });

  it('setNodeValue to the identical value is a no-op', () => {
    let doc = createDoc('Q', 0);
    expect(setNodeValue(doc, doc.rootId, undefined)).toBe(doc); // undefined → undefined
    doc = setNodeValue(doc, doc.rootId, { amount: 5, unit: 'DKK' });
    expect(setNodeValue(doc, doc.rootId, { amount: 5, unit: 'DKK' })).toBe(doc);
    expect(setNodeValue(doc, doc.rootId, { amount: 6, unit: 'DKK' })).not.toBe(doc);
    expect(setNodeValue(doc, doc.rootId, { amount: 5, unit: '%' })).not.toBe(doc);
  });

  it('setDetail to the identical notes is a no-op (blank equals none)', () => {
    let doc = createDoc('Q', 0);
    expect(setDetail(doc, doc.rootId, '   ')).toBe(doc); // blank on a node with no notes
    doc = setDetail(doc, doc.rootId, 'note');
    expect(setDetail(doc, doc.rootId, 'note')).toBe(doc);
    expect(setDetail(doc, doc.rootId, 'other')).not.toBe(doc);
  });
});
