import { describe, expect, it } from 'vitest';
import { createDoc } from '@/domain/factory';
import { synthesise } from '@/domain/synthesis';
import { addChild, setStatus } from '@/domain/tree';

describe('hypothesis status', () => {
  it('sets a node status', () => {
    const doc0 = createDoc('Root', 1000);
    const d1 = setStatus(doc0, doc0.rootId, 'supported');
    expect(d1.nodes[doc0.rootId]?.status).toBe('supported');
  });

  it('marks supported and refuted branches in the synthesis', () => {
    let doc = createDoc('Root', 1000);
    const pricing = addChild(doc, doc.rootId, 'Pricing');
    doc = pricing.doc;
    const product = addChild(doc, doc.rootId, 'Product');
    doc = product.doc;
    doc = setStatus(doc, pricing.childId, 'refuted');
    doc = setStatus(doc, product.childId, 'supported');

    const md = synthesise(doc);
    expect(md).toContain('✗ Pricing');
    expect(md).toContain('✓ Product');
  });
});
