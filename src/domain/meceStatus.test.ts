import { describe, expect, it } from 'vitest';
import { EXAMPLE_TREES } from './examples';
import { createDoc } from './factory';
import { recomputeMece } from './mece';
import { flaggedSplits, meceSummary, reviewCount } from './meceStatus';
import { addChild, setDecomposition } from './tree';

describe('meceStatus', () => {
  it("reports 'empty' for a tree with no splits", () => {
    const doc = createDoc('Why?', 0);
    expect(meceSummary(doc)).toEqual({ kind: 'empty', warns: 0, splits: 0 });
    expect(reviewCount(doc)).toBe(0);
  });

  it("reports 'clean' when every split passes", () => {
    // A binary split is provably MECE → both axes pass.
    let doc = createDoc('Launch?', 0);
    doc = addChild(doc, doc.rootId, 'Yes').doc;
    doc = addChild(doc, doc.rootId, 'No').doc;
    doc = setDecomposition(doc, doc.rootId, 'binary');
    doc = recomputeMece(doc);
    const summary = meceSummary(doc);
    expect(summary.kind).toBe('clean');
    expect(summary.warns).toBe(0);
    expect(summary.splits).toBe(1);
  });

  it("reports 'review' and counts the flagged splits", () => {
    // A segment split with no "Other" bucket and overlapping labels → warns.
    let doc = createDoc('Why?', 0);
    const causes = addChild(doc, doc.rootId, 'Causes');
    doc = causes.doc;
    doc = addChild(doc, causes.childId, 'Customer growth').doc; // shares "customer"
    doc = addChild(doc, causes.childId, 'Customer churn').doc;
    doc = setDecomposition(doc, causes.childId, 'segment'); // no "Other" → CE gap
    doc = recomputeMece(doc);
    const summary = meceSummary(doc);
    expect(summary.kind).toBe('review');
    expect(summary.warns).toBeGreaterThan(0);
  });

  it('matches the recomputed status on the example trees (no divergence)', () => {
    for (const ex of EXAMPLE_TREES) {
      const doc = recomputeMece(ex.build());
      const summary = meceSummary(doc);
      // The profit example is built to reconcile, so it should be clean.
      if (ex.id === 'profit') expect(summary.kind).toBe('clean');
      // Whatever the kind, warns and the manual count agree.
      expect(summary.warns).toBe(reviewCount(doc));
    }
  });

  it('flaggedSplits lists each warned split with its decomposition + message', () => {
    // A single root segment split with no "Other" bucket → exactly one flagged split.
    let doc = createDoc('Why?', 0);
    doc = addChild(doc, doc.rootId, 'A').doc;
    doc = addChild(doc, doc.rootId, 'B').doc;
    doc = setDecomposition(doc, doc.rootId, 'segment'); // no "Other" → CE gap
    doc = recomputeMece(doc);
    const flagged = flaggedSplits(doc);
    expect(flagged).toHaveLength(1);
    expect(flagged[0]?.nodeId).toBe(doc.rootId);
    expect(flagged[0]?.decomposition).toBe('segment');
    expect(flagged[0]?.exhaustive).toBeTruthy();
  });

  it('flaggedSplits is empty for a clean tree', () => {
    let doc = createDoc('Q', 0);
    doc = addChild(doc, doc.rootId, 'Yes').doc;
    doc = addChild(doc, doc.rootId, 'No').doc;
    doc = setDecomposition(doc, doc.rootId, 'binary');
    doc = recomputeMece(doc);
    expect(flaggedSplits(doc)).toEqual([]);
  });
});
