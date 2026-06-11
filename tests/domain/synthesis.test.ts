import { describe, expect, it } from 'vitest';
import { createDoc, createEvidence } from '@/domain/factory';
import { recomputeMece } from '@/domain/mece';
import { synthesise } from '@/domain/synthesis';
import { addChild, addEvidence, setPriority } from '@/domain/tree';

describe('synthesise', () => {
  it('leads with the top-priority branch and orders branches by priority', () => {
    let doc = createDoc('Why is profit down?', 1000);
    const cost = addChild(doc, doc.rootId, 'Cost');
    doc = cost.doc;
    const revenue = addChild(doc, doc.rootId, 'Revenue');
    doc = revenue.doc;
    doc = setPriority(doc, cost.childId, { impact: 'low', ease: 'low' });
    doc = setPriority(doc, revenue.childId, { impact: 'high', ease: 'high' });
    doc = recomputeMece(doc);

    const md = synthesise(doc);
    expect(md).toContain('Start with **Revenue**');
    expect(md.indexOf('Revenue')).toBeLessThan(md.indexOf('Cost'));
  });

  it('includes evidence under a branch', () => {
    let doc = createDoc('Root', 1000);
    const pricing = addChild(doc, doc.rootId, 'Pricing');
    doc = pricing.doc;
    doc = addEvidence(doc, pricing.childId, createEvidence('Win rate fell', true, 'strong'));

    const md = synthesise(doc);
    expect(md).toContain('evidence:');
    expect(md).toContain('Win rate fell');
  });
});
