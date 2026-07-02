import { describe, expect, it } from 'vitest';
import { createDoc } from '@/domain/factory';
import { recomputeMece } from '@/domain/mece';
import { addChild, setDecomposition, setNodeValue, setStatus } from '@/domain/tree';
import { treeToCsv } from './csv';

describe('treeToCsv', () => {
  it('emits a header and one row per node with the value model', () => {
    let doc = createDoc('Profit', 0);
    doc = setNodeValue(doc, doc.rootId, { amount: 100, unit: 'M' });
    const a = addChild(doc, doc.rootId, 'Revenue');
    doc = a.doc;
    doc = setNodeValue(doc, a.childId, { amount: 160 });
    doc = setDecomposition(doc, doc.rootId, 'formula');
    doc = setStatus(doc, a.childId, 'supported');
    doc = recomputeMece(doc);

    const csv = treeToCsv(doc);
    const lines = csv.trim().split('\r\n');
    expect(lines[0]).toContain('path,label,decomposition');
    expect(lines).toHaveLength(3); // header + Profit + Revenue
    expect(csv).toContain('Profit,Profit,formula');
    expect(csv).toContain('160');
    expect(csv).toContain('supported');
  });

  it('quotes cells that contain commas or quotes', () => {
    const doc = createDoc('A, B "C"', 0);
    expect(treeToCsv(doc)).toContain('"A, B ""C"""');
  });
});
