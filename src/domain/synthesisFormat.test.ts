import { describe, expect, it } from 'vitest';
import { createDoc } from './factory';
import { synthesise } from './synthesis';
import { answerPageHtml, formatSynthesis } from './synthesisFormat';
import { addChild, setAnswer, setStatus } from './tree';

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
