import { describe, expect, it } from 'vitest';
import { createDoc } from '@/domain/factory';
import { evaluateSplit } from '@/domain/mece';
import { addChild, setDecomposition, setOperator, splitOf } from '@/domain/tree';
import type { IssueTreeDoc } from '@/domain/types';

function must<T>(v: T | undefined, msg: string): T {
  if (v === undefined) throw new Error(msg);
  return v;
}

function withChildren(labels: string[]): IssueTreeDoc {
  let doc = createDoc('Root', 1000);
  for (const label of labels) doc = addChild(doc, doc.rootId, label).doc;
  return doc;
}

const rootMece = (doc: IssueTreeDoc) => evaluateSplit(must(splitOf(doc, doc.rootId), 'split'), doc);

describe('MECE rules — segments & overlap', () => {
  it('warns a segment split without an Other bucket', () => {
    let doc = withChildren(['Enterprise', 'SMB']);
    doc = setDecomposition(doc, doc.rootId, 'segment');
    expect(rootMece(doc).exhaustive.state).toBe('warn');
  });

  it('passes a segment split that has an Other bucket', () => {
    let doc = withChildren(['Enterprise', 'SMB', 'Other']);
    doc = setDecomposition(doc, doc.rootId, 'segment');
    expect(rootMece(doc).exhaustive.state).toBe('pass');
  });

  it('flags overlapping siblings on a freeform split', () => {
    const doc = withChildren(['Online marketing', 'Online sales']);
    expect(rootMece(doc).exclusive.state).toBe('warn');
  });

  it('does not flag clearly distinct siblings', () => {
    const doc = withChildren(['Pricing', 'Distribution']);
    expect(rootMece(doc).exclusive.state).not.toBe('warn');
  });

  it('ignores scaffold placeholder words when checking overlap', () => {
    const doc = withChildren(['Segment 1', 'Segment 2', 'Other']);
    expect(rootMece(doc).exclusive.state).not.toBe('warn');
  });
});

describe('MECE rules — overlap heuristic (dimension-aware)', () => {
  it('ignores a word every sibling shares (the dimension) when there are 3+', () => {
    const doc = withChildren(['North region', 'South region', 'East region', 'West region']);
    expect(rootMece(doc).exclusive.state).not.toBe('warn');
  });

  it('flags a word shared by only some siblings and names the pair', () => {
    const doc = withChildren(['Domestic retail', 'Domestic wholesale', 'Export']);
    const res = rootMece(doc).exclusive;
    expect(res.state).toBe('warn');
    expect(res.message).toMatch(
      /Domestic retail.*Domestic wholesale|Domestic wholesale.*Domestic retail/
    );
  });

  it('still flags a two-sibling overlap (the shared word is the only signal)', () => {
    const doc = withChildren(['Online marketing', 'Online sales']);
    expect(rootMece(doc).exclusive.state).toBe('warn');
  });
});

describe('MECE rules — mixed-axis advisory', () => {
  it('flags branches that each name a different cut-axis', () => {
    const doc = withChildren(['By region', 'By product', 'By customer segment']);
    const res = rootMece(doc).exclusive;
    expect(res.state).toBe('warn');
    expect(res.message).toMatch(/mix.*axes/i);
  });

  it('does not treat a mid-label "by" as an axis (means, not a cut)', () => {
    const doc = withChildren(['Grow revenue by expansion', 'Cut cost by automation']);
    expect(rootMece(doc).exclusive.state).not.toBe('warn');
  });

  it('stays quiet when every branch shares one axis', () => {
    const doc = withChildren(['By region north', 'By region south', 'By region east']);
    expect(rootMece(doc).exclusive.state).not.toBe('warn');
  });

  it('does not mask a concrete word-overlap (overlap wins)', () => {
    // Both start with the same axis word AND overlap on it — the overlap check
    // fires first, so the message names the overlapping pair, not the axis mix.
    const doc = withChildren(['Online marketing', 'Online sales']);
    const res = rootMece(doc).exclusive;
    expect(res.state).toBe('warn');
    expect(res.message).toMatch(/overlap/i);
  });
});

describe('MECE rules — formula exclusivity (double-count smells)', () => {
  function formula(labels: string[], operator?: 'sum' | 'product' | 'difference'): IssueTreeDoc {
    let doc = withChildren(labels);
    doc = setDecomposition(doc, doc.rootId, 'formula');
    if (operator) doc = setOperator(doc, doc.rootId, operator);
    return doc;
  }

  it('passes distinct additive terms', () => {
    expect(rootMece(formula(['New customers', 'Returning customers'])).exclusive.state).toBe(
      'pass'
    );
  });

  it('flags a running-total term among summed drivers', () => {
    const res = rootMece(formula(['Total revenue', 'New', 'Returning'], 'sum')).exclusive;
    expect(res.state).toBe('warn');
    expect(res.message).toMatch(/total/i);
  });

  it('flags duplicate additive term labels', () => {
    expect(rootMece(formula(['Price', 'Price'])).exclusive.state).toBe('warn');
  });

  it('leaves product/difference terms alone (dimensions by construction)', () => {
    expect(rootMece(formula(['Price', 'Volume'], 'product')).exclusive.state).toBe('pass');
    expect(rootMece(formula(['Revenue', 'Cost'], 'difference')).exclusive.state).toBe('pass');
  });
});

describe('MECE rules — CE guidance for un-provable splits', () => {
  it('coaches CE for a process split (stays unknown, carries a message)', () => {
    let doc = withChildren(['Awareness', 'Consideration', 'Purchase']);
    doc = setDecomposition(doc, doc.rootId, 'process');
    const ce = rootMece(doc).exhaustive;
    expect(ce.state).toBe('unknown');
    expect(ce.message).toMatch(/end to end/i);
  });

  it('coaches CE for a framework split', () => {
    let doc = withChildren(['Political', 'Economic', 'Social']);
    doc = setDecomposition(doc, doc.rootId, 'framework');
    const ce = rootMece(doc).exhaustive;
    expect(ce.state).toBe('unknown');
    expect(ce.message).toMatch(/framework/i);
  });
});
