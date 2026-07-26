import { describe, expect, it } from 'vitest';
import { createDoc } from '@/domain/factory';
import { evaluateSplit, recomputeMece } from '@/domain/mece';
import {
  addChild,
  setDecomposition,
  setNodeValue,
  setOperator,
  setSplitLogic,
  splitOf,
} from '@/domain/tree';
import type { IssueTreeDoc } from '@/domain/types';

function must<T>(v: T | undefined, msg: string): T {
  if (v === undefined) throw new Error(msg);
  return v;
}

function withChildren(labels: string[]): IssueTreeDoc {
  let doc = createDoc('Root', 1000);
  for (const label of labels) {
    doc = addChild(doc, doc.rootId, label).doc;
  }
  return doc;
}

const rootMece = (doc: IssueTreeDoc) => evaluateSplit(must(splitOf(doc, doc.rootId), 'split'), doc);

describe('MECE engine', () => {
  it('flags a singleton split as not exhaustive', () => {
    expect(rootMece(withChildren(['only one'])).exhaustive.state).toBe('warn');
  });

  it('passes a binary A / not-A split with exactly two children', () => {
    let doc = withChildren(['A', 'not-A']);
    doc = setDecomposition(doc, doc.rootId, 'binary');
    const mece = rootMece(doc);
    expect(mece.exclusive.state).toBe('pass');
    expect(mece.exhaustive.state).toBe('pass');
  });

  it('warns on a binary split with three children', () => {
    let doc = withChildren(['A', 'B', 'C']);
    doc = setDecomposition(doc, doc.rootId, 'binary');
    expect(rootMece(doc).exhaustive.state).toBe('warn');
  });

  it('reconciles a formula split when children combine to the parent', () => {
    let doc = withChildren(['Price', 'Volume']);
    doc = setDecomposition(doc, doc.rootId, 'formula');
    doc = setNodeValue(doc, doc.rootId, { amount: 100 });
    const kids = must(splitOf(doc, doc.rootId), 'split').childIds;
    doc = setNodeValue(doc, must(kids[0], 'k0'), { amount: 60 });
    doc = setNodeValue(doc, must(kids[1], 'k1'), { amount: 40 });
    expect(rootMece(doc).exhaustive.state).toBe('pass');
  });

  it('warns when a formula split does not reconcile', () => {
    let doc = withChildren(['Price', 'Volume']);
    doc = setDecomposition(doc, doc.rootId, 'formula');
    doc = setNodeValue(doc, doc.rootId, { amount: 100 });
    const kids = must(splitOf(doc, doc.rootId), 'split').childIds;
    doc = setNodeValue(doc, must(kids[0], 'k0'), { amount: 60 });
    doc = setNodeValue(doc, must(kids[1], 'k1'), { amount: 30 });
    expect(rootMece(doc).exhaustive.state).toBe('warn');
  });

  it('refuses to reconcile additive terms that carry different units', () => {
    // Without the unit check these sum to 100 and read as a clean reconcile —
    // a confidently wrong answer, which is the one thing the MECE brain must
    // not give.
    let doc = withChildren(['Nordics', 'Rest of world']);
    doc = setDecomposition(doc, doc.rootId, 'formula');
    doc = setNodeValue(doc, doc.rootId, { amount: 100, unit: 'M DKK' });
    const kids = must(splitOf(doc, doc.rootId), 'split').childIds;
    doc = setNodeValue(doc, must(kids[0], 'k0'), { amount: 60, unit: 'M DKK' });
    doc = setNodeValue(doc, must(kids[1], 'k1'), { amount: 40, unit: 'k DKK' });

    const check = rootMece(doc).exhaustive;
    expect(check.state).toBe('warn');
    expect(check.message?.code).toBe('mece.exhaustive.formulaMixedUnits');
  });

  it('lets a product change unit — multiplying dimensions is supposed to', () => {
    // price (k DKK) × volume (k units) = revenue (M DKK): three units, correct.
    let doc = withChildren(['Price', 'Volume']);
    doc = setDecomposition(doc, doc.rootId, 'formula');
    doc = setOperator(doc, doc.rootId, 'product');
    doc = setNodeValue(doc, doc.rootId, { amount: 100, unit: 'M DKK' });
    const kids = must(splitOf(doc, doc.rootId), 'split').childIds;
    doc = setNodeValue(doc, must(kids[0], 'k0'), { amount: 0.5, unit: 'k DKK' });
    doc = setNodeValue(doc, must(kids[1], 'k1'), { amount: 200, unit: 'k units' });
    expect(rootMece(doc).exhaustive.state).toBe('pass');
  });

  it('treats a blank unit as "same as the others", not a second unit', () => {
    let doc = withChildren(['Nordics', 'Rest of world']);
    doc = setDecomposition(doc, doc.rootId, 'formula');
    doc = setNodeValue(doc, doc.rootId, { amount: 100, unit: 'M DKK' });
    const kids = must(splitOf(doc, doc.rootId), 'split').childIds;
    doc = setNodeValue(doc, must(kids[0], 'k0'), { amount: 60 });
    doc = setNodeValue(doc, must(kids[1], 'k1'), { amount: 40, unit: 'm dkk' });
    expect(rootMece(doc).exhaustive.state).toBe('pass'); // case/space-insensitive
  });

  it('is unknown for a formula split missing values', () => {
    let doc = withChildren(['Price', 'Volume']);
    doc = setDecomposition(doc, doc.rootId, 'formula');
    expect(rootMece(doc).exhaustive.state).toBe('unknown');
  });

  it('does not overlap-check a deductive split, even when siblings share a word', () => {
    let doc = withChildren(['Rising input costs', 'Rising labour costs']); // share "rising"/"costs"
    expect(rootMece(doc).exclusive.state).toBe('warn'); // inductive default trips the heuristic

    doc = setSplitLogic(doc, doc.rootId, 'deductive');
    const mece = rootMece(doc);
    expect(mece.exclusive.state).toBe('pass'); // an argument isn't a partition
    expect(mece.exhaustive.state).toBe('unknown'); // a chain prompt, not a gap warn
  });

  it('inductive is the default — overlap-checking is unchanged', () => {
    const doc = withChildren(['Revenue', 'Costs']); // no shared word
    expect(rootMece(doc).exclusive.state).toBe('unknown'); // no overlap, not auto-provable
  });

  it('recomputeMece writes status onto every split', () => {
    let doc = withChildren(['A', 'not-A']);
    doc = setDecomposition(doc, doc.rootId, 'binary');
    doc = recomputeMece(doc);
    expect(splitOf(doc, doc.rootId)?.mece.exhaustive.state).toBe('pass');
  });
});
