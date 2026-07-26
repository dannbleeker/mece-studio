import { describe, expect, it } from 'vitest';
import { createDoc } from '@/domain/factory';
import { recomputeMece } from '@/domain/mece';
import { addChild, setDecomposition, setNodeValue, setStatus } from '@/domain/tree';
import { en } from '@/i18n/locales/en';
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

    const c = en.exports.csvColumns;
    const csv = treeToCsv(doc, en);
    const lines = csv.trim().split('\r\n');
    expect(lines[0]).toContain(`${c.path},${c.label},${c.decomposition}`);
    expect(lines).toHaveLength(3); // header + Profit + Revenue
    expect(csv).toContain('Profit,Profit,formula'); // cells stay machine-readable
    expect(csv).toContain('160');
    expect(csv).toContain('supported');
  });

  it('quotes cells that contain commas or quotes', () => {
    const doc = createDoc('A, B "C"', 0);
    expect(treeToCsv(doc, en)).toContain('"A, B ""C"""');
  });
});
