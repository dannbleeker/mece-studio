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
    // Asserting the code + params, not the prose: this now survives a reword
    // and pins the *finding* (which pair, which shared token) far more tightly.
    expect(res.message).toEqual({
      code: 'mece.exclusive.siblingOverlap',
      params: { a: 'Domestic retail', b: 'Domestic wholesale', token: 'domestic', more: 0 },
    });
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
    expect(res.message).toEqual({
      code: 'mece.exclusive.mixedAxis',
      params: { axes: ['region', 'product', 'customer'] },
    });
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
    expect(res.message?.code).toBe('mece.exclusive.siblingOverlap');
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
    expect(res.message).toEqual({
      code: 'mece.exclusive.formulaRunningTotal',
      params: { label: 'Total revenue' },
    });
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
    expect(ce.message?.code).toBe('mece.exhaustive.processEndToEnd');
  });

  it('coaches CE for a framework split', () => {
    let doc = withChildren(['Political', 'Economic', 'Social']);
    doc = setDecomposition(doc, doc.rootId, 'framework');
    const ce = rootMece(doc).exhaustive;
    expect(ce.state).toBe('unknown');
    expect(ce.message?.code).toBe('mece.exhaustive.frameworkNotPartition');
  });
});

describe('MECE rules — the Other bucket and the shared dimension', () => {
  it('treats a word every named segment shares as the dimension, even beside "Other"', () => {
    let doc = withChildren(['Large stores', 'Small stores', 'Other']);
    doc = setDecomposition(doc, doc.rootId, 'segment');
    expect(rootMece(doc).exclusive.state).not.toBe('warn');
  });

  it('ignores the dimension word when the remainder bucket repeats it', () => {
    let doc = withChildren(['Large stores', 'Small stores', 'Remaining stores']);
    doc = setDecomposition(doc, doc.rootId, 'segment');
    expect(rootMece(doc).exclusive.state).not.toBe('warn');
  });

  it('still flags a word only some named segments share', () => {
    let doc = withChildren(['Online retail', 'Online wholesale', 'Export', 'Other']);
    doc = setDecomposition(doc, doc.rootId, 'segment');
    const res = rootMece(doc).exclusive;
    expect(res.state).toBe('warn');
    expect(res.message).toMatchObject({
      code: 'mece.exclusive.siblingOverlap',
      params: { token: 'online' },
    });
  });

  it('keeps the two-sibling rule: a lone pair sharing a word is still an overlap', () => {
    const doc = withChildren(['Online marketing', 'Online sales']);
    expect(rootMece(doc).exclusive.state).toBe('warn');
  });
});

describe('MECE rules — letters beyond a–z', () => {
  it('keeps æ, ø and å inside a word instead of splitting on them', () => {
    // Before the fix "Østjylland" tokenised to "stjylland" and "Ørestad" to
    // "restad": the letters vanished, so a real overlap on an ø-word was missed.
    const doc = withChildren(['Østjylland butikker', 'Østjylland lager', 'Fyn']);
    const res = rootMece(doc).exclusive;
    expect(res.state).toBe('warn');
    expect(res.message).toMatchObject({
      code: 'mece.exclusive.siblingOverlap',
      params: { token: 'østjylland' },
    });
  });

  it('recognises a Danish remainder bucket as the Other bucket', () => {
    for (const other of ['Øvrige', 'Andre butikker', 'Resten', 'Diverse']) {
      let doc = withChildren(['Jylland', 'Sjælland', other]);
      doc = setDecomposition(doc, doc.rootId, 'segment');
      expect(rootMece(doc).exhaustive.state, other).toBe('pass');
    }
  });

  it('does not mistake a word that merely starts like "other" for the bucket', () => {
    let doc = withChildren(['Mothers', 'Fathers']);
    doc = setDecomposition(doc, doc.rootId, 'segment');
    expect(rootMece(doc).exhaustive.state).toBe('warn');
  });

  it('treats a Danish dimension word beside "Øvrige" as the dimension', () => {
    let doc = withChildren(['Store butikker', 'Små butikker', 'Øvrige']);
    doc = setDecomposition(doc, doc.rootId, 'segment');
    expect(rootMece(doc).exclusive.state).not.toBe('warn');
  });
});

describe('MECE rules — plural forms', () => {
  it('matches a singular and a plural of the same word', () => {
    const doc = withChildren(['Store network', 'Stores LAN', 'Back end']);
    const res = rootMece(doc).exclusive;
    expect(res.state).toBe('warn');
    expect(res.message).toMatchObject({
      code: 'mece.exclusive.siblingOverlap',
      params: { token: 'store' },
    });
  });

  it('does not strip the s from words that end in -ss', () => {
    const doc = withChildren(['Business rules', 'Busines hours']);
    expect(rootMece(doc).exclusive.state).not.toBe('warn');
  });
});

describe('MECE rules — binary splits are only provable when worded as A / not-A', () => {
  function binary(a: string, b: string) {
    let doc = withChildren([a, b]);
    doc = setDecomposition(doc, doc.rootId, 'binary');
    return rootMece(doc);
  }

  it('proves a split whose second branch negates the first', () => {
    for (const [a, b] of [
      ['A', 'not-A'],
      ['Yes', 'No'],
      ['Yes — launch it', 'No — hold for now'],
      ['Profitable', 'Unprofitable'],
      ['Cause is in the store', 'Cause is not in the store'],
      ['Rentabel', 'Urentabel'],
      ['I butikken', 'Ikke i butikken'],
      ['With a loyalty card', 'Without a loyalty card'],
      ['Online', 'Offline'],
      ['Internal', 'External'],
    ]) {
      const res = binary(a as string, b as string);
      expect(res.exclusive.state, `${a} / ${b}`).toBe('pass');
      expect(res.exhaustive.state, `${a} / ${b}`).toBe('pass');
    }
  });

  it('does not claim proof for two labels that are not complements', () => {
    const res = binary('Revenue', 'Costs');
    // Not a warn: nothing is shown to be wrong, so it stays out of the review
    // dock. But the engine no longer says "provably MECE" about it either.
    expect(res.exclusive).toEqual({
      state: 'unknown',
      message: { code: 'mece.exclusive.binaryNotComplement' },
    });
    expect(res.exhaustive).toEqual({
      state: 'unknown',
      message: { code: 'mece.exhaustive.binaryNotComplement' },
    });
  });

  it('only treats un- / non- / u- as negating prefixes, not in-', () => {
    // "in-" starts too many ordinary words ("Internet", "Income") to read as a
    // negation, so a pair that differs only by it is not taken as proof.
    expect(binary('Ternet', 'Internet').exclusive.state).toBe('unknown');
  });
});
