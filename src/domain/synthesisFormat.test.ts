import { describe, expect, it } from 'vitest';
import { createDoc } from './factory';
import { synthesise } from './synthesis';
import { answerPageHtml, formatSynthesis } from './synthesisFormat';
import { addChild, setAnswer, setProblemBrief, setSplitSummary, setStatus } from './tree';

describe('formatSynthesis', () => {
  it('classifies the answer, verdict, lead, and branch lines and strips emphasis', () => {
    let doc = createDoc('Enter market?', 0);
    doc = setAnswer(doc, 'Yes, via partnership');
    const a = addChild(doc, doc.rootId, 'Attractive');
    doc = a.doc;
    doc = setStatus(doc, a.childId, 'supported');

    const lines = formatSynthesis(synthesise(doc));
    const kinds = new Set(lines.map((l) => l.kind));
    expect(kinds.has('title')).toBe(true);
    expect(kinds.has('answer')).toBe(true);
    expect(kinds.has('verdict')).toBe(true);
    expect(kinds.has('branch')).toBe(true);

    expect(lines.find((l) => l.kind === 'answer')?.text).toBe('Yes, via partnership'); // ** stripped
    expect(lines.find((l) => l.kind === 'branch')?.text).not.toContain('**');
  });
});

describe('formatSynthesis — brief intro & so-what', () => {
  it('classifies the SCR intro and the so-what insight lines', () => {
    let doc = createDoc('How can we restore profit?', 0);
    doc = setProblemBrief(doc, { situation: 'Stable co', complication: 'Margin fell' });
    doc = addChild(doc, doc.rootId, 'Revenue').doc;
    doc = addChild(doc, doc.rootId, 'Costs').doc;
    doc = setSplitSummary(doc, doc.rootId, 'Profit squeezed both sides');

    const lines = formatSynthesis(synthesise(doc));
    const kinds = new Set(lines.map((l) => l.kind));
    expect(kinds.has('situation')).toBe(true);
    expect(kinds.has('complication')).toBe(true);
    expect(kinds.has('insight')).toBe(true);
    expect(lines.find((l) => l.kind === 'situation')?.text).toBe('Stable co');
    expect(lines.find((l) => l.kind === 'insight')?.text).toBe('Profit squeezed both sides');
  });
});

describe('answerPageHtml', () => {
  it('produces a self-contained HTML page with the question + answer, HTML-escaped', () => {
    let doc = createDoc('Why <profit> down?', 0);
    doc = setAnswer(doc, 'Costs rose');
    const html = answerPageHtml(doc);
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('Costs rose');
    expect(html).toContain('Why &lt;profit&gt; down?'); // escaped
    expect(html).not.toContain('<profit>'); // never raw
  });
});
