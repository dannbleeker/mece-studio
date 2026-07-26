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

  it('defuses a label that would open as a spreadsheet formula', () => {
    // A tree can arrive by import or as a shared template, so a label is not
    // necessarily text this user typed. Excel evaluates a field starting with
    // `=`, so it must reach the sheet as text.
    const doc = createDoc('=HYPERLINK("http://evil.example","click")', 0);
    const csv = treeToCsv(doc, en);
    expect(csv).toContain(`'=HYPERLINK`);
    expect(csv).not.toMatch(/(^|,|")=HYPERLINK/m);
  });

  it('leaves a negative amount alone — it is a number, not a formula', () => {
    let doc = createDoc('Margin', 0);
    doc = setNodeValue(doc, doc.rootId, { amount: -500, unit: 'k' });
    const csv = treeToCsv(doc, en);
    expect(csv).toContain(',-500,'); // still parses as a number in the sheet
    expect(csv).not.toContain(`'-500`);
  });

  it('defuses the other formula starters, including a unit', () => {
    let doc = createDoc('+1 growth', 0);
    doc = setNodeValue(doc, doc.rootId, { amount: 5, unit: '@rate' });
    const csv = treeToCsv(doc, en);
    expect(csv).toContain(`'+1 growth`);
    expect(csv).toContain(`'@rate`);
  });
});
