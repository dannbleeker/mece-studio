import { describe, expect, it } from 'vitest';
import { createDoc } from './factory';
import { presentationSteps } from './presentation';
import { addChild } from './tree';
import type { NodeId } from './types';

describe('presentationSteps', () => {
  it('returns the root alone for an undecomposed tree', () => {
    const doc = createDoc('Lonely root', 1);
    expect(presentationSteps(doc)).toEqual([doc.rootId]);
  });

  it('lists every decomposed node in depth-first pre-order', () => {
    // root → [A, B]; A → [A1]; so steps are the nodes WITH splits: root, then A.
    let doc = createDoc('Root', 1);
    const a = addChild(doc, doc.rootId, 'A');
    doc = a.doc;
    const b = addChild(doc, doc.rootId, 'B');
    doc = b.doc;
    const a1 = addChild(doc, a.childId, 'A1');
    doc = a1.doc;

    const steps = presentationSteps(doc);
    expect(steps).toEqual([doc.rootId, a.childId]);
    // B and A1 are leaves (no split), so they are not steps.
    expect(steps).not.toContain(b.childId as NodeId);
    expect(steps).not.toContain(a1.childId as NodeId);
  });
});
