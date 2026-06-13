import { describe, expect, it } from 'vitest';
import { createDoc, createEvidence } from './factory';
import { recomputeMece } from './mece';
import { synthesise } from './synthesis';
import { addChild, addEvidence, setDecomposition, setPriority, setStatus } from './tree';

describe('synthesise', () => {
  it('prompts to decompose when there are no branches yet', () => {
    const out = synthesise(createDoc('Why?', 0));
    expect(out).toContain('# Why?');
    expect(out).toContain('No branches yet');
    expect(out).toContain('set impact × ease'); // no-priority lead
  });

  it('leads with the highest-priority branch and orders branches by priority', () => {
    let doc = createDoc('Q', 0);
    const lo = addChild(doc, doc.rootId, 'Low branch');
    doc = lo.doc;
    const hi = addChild(doc, doc.rootId, 'High branch');
    doc = hi.doc;
    doc = setPriority(doc, lo.childId, { impact: 'low', ease: 'low' });
    doc = setPriority(doc, hi.childId, { impact: 'high', ease: 'high' });

    const out = synthesise(doc);
    expect(out).toContain('Start with **High branch**');
    expect(out.indexOf('High branch')).toBeLessThan(out.indexOf('Low branch'));
  });

  it('marks hypothesis status, shows evidence, and falls back to the tip lead without priorities', () => {
    let doc = createDoc('Q', 0);
    const a = addChild(doc, doc.rootId, 'Supported claim');
    doc = a.doc;
    const b = addChild(doc, doc.rootId, 'Refuted claim');
    doc = b.doc;
    const c = addChild(doc, doc.rootId, 'Parked claim');
    doc = c.doc;
    doc = setStatus(doc, a.childId, 'supported');
    doc = setStatus(doc, b.childId, 'refuted');
    doc = setStatus(doc, c.childId, 'parked');
    doc = addEvidence(doc, a.childId, createEvidence('It works', true, 'strong'));

    const out = synthesise(doc);
    expect(out).toContain('✓ Supported claim');
    expect(out).toContain('✗ Refuted claim');
    expect(out).toContain('⊘ Parked claim');
    expect(out).toContain('evidence: ✓ It works');
    expect(out).toContain('set impact × ease'); // no priorities → tip lead
  });

  it('shows contradicting evidence with an ✗ mark', () => {
    let doc = createDoc('Q', 0);
    const a = addChild(doc, doc.rootId, 'Claim');
    doc = a.doc;
    doc = addEvidence(doc, a.childId, createEvidence('Counter-point', false, 'indicative'));
    expect(synthesise(doc)).toContain('evidence: ✗ Counter-point');
  });

  it('uses the document title in the heading when the root node is missing', () => {
    const doc = createDoc('Orphaned', 0);
    const broken = { ...doc, nodes: {} }; // corrupt import: rootId dangles
    const out = synthesise(broken);
    expect(out).toContain(`# ${doc.title}`);
    expect(out).toContain('No branches yet');
  });

  it('flags MECE overlaps and gaps on a branch', () => {
    let doc = createDoc('Q', 0);
    const causes = addChild(doc, doc.rootId, 'Causes');
    doc = causes.doc;
    doc = addChild(doc, causes.childId, 'Customer growth').doc; // shares "customer"
    doc = addChild(doc, causes.childId, 'Customer churn').doc;
    doc = setDecomposition(doc, causes.childId, 'segment'); // no "Other" → gap
    doc = recomputeMece(doc);

    const out = synthesise(doc);
    expect(out).toContain('⚠');
    expect(out).toContain('overlap');
    expect(out).toContain('gap');
  });
});
