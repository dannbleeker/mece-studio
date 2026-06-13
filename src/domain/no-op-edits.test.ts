import { describe, expect, it } from 'vitest';
import { createDoc, createEvidence } from './factory';
import {
  addEvidence,
  removeEvidence,
  renameNode,
  setAllCollapsed,
  setDetail,
  setNodeValue,
  setStatus,
  toggleCollapse,
  updateEvidence,
} from './tree';
import type { NodeId } from './types';

const GHOST = 'ghost-node' as NodeId;

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

  it('edits targeting a missing node return the same document', () => {
    const doc = createDoc('Q', 0);
    const item = createEvidence('E', true, 'strong');
    expect(addEvidence(doc, GHOST, item)).toBe(doc);
    expect(removeEvidence(doc, GHOST, 'x')).toBe(doc);
    expect(updateEvidence(doc, GHOST, 'x', { summary: 'y' })).toBe(doc);
    expect(toggleCollapse(doc, GHOST)).toBe(doc);
    expect(setStatus(doc, GHOST, 'supported')).toBe(doc);
  });

  it('evidence edits for an unknown id, and a status set to the current value, are no-ops', () => {
    let doc = createDoc('Q', 0);
    expect(setStatus(doc, doc.rootId, 'open')).toBe(doc); // already open
    doc = addEvidence(doc, doc.rootId, createEvidence('E', true, 'strong'));
    expect(removeEvidence(doc, doc.rootId, 'no-such-id')).toBe(doc);
    expect(updateEvidence(doc, doc.rootId, 'no-such-id', { summary: 'z' })).toBe(doc);
    const id = doc.nodes[doc.rootId]?.evidence[0]?.id;
    if (!id) throw new Error('no evidence id');
    expect(updateEvidence(doc, doc.rootId, id, { summary: 'z' })).not.toBe(doc); // real change
  });

  it('setAllCollapsed with nothing to change returns the same document', () => {
    const doc = createDoc('Q', 0); // a lone root: nothing is collapsed, nothing to collapse
    expect(setAllCollapsed(doc, false)).toBe(doc);
  });
});
