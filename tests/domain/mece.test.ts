import { describe, expect, it } from 'vitest';
import { createDoc } from '@/domain/factory';
import { evaluateSplit, recomputeMece } from '@/domain/mece';
import { addChild, setDecomposition, setNodeValue, splitOf } from '@/domain/tree';
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

  it('is unknown for a formula split missing values', () => {
    let doc = withChildren(['Price', 'Volume']);
    doc = setDecomposition(doc, doc.rootId, 'formula');
    expect(rootMece(doc).exhaustive.state).toBe('unknown');
  });

  it('recomputeMece writes status onto every split', () => {
    let doc = withChildren(['A', 'not-A']);
    doc = setDecomposition(doc, doc.rootId, 'binary');
    doc = recomputeMece(doc);
    expect(splitOf(doc, doc.rootId)?.mece.exhaustive.state).toBe('pass');
  });
});
