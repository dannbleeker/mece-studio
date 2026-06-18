import { describe, expect, it } from 'vitest';
import { createDoc } from '@/domain/factory';
import { evaluateSplit } from '@/domain/mece';
import { addChild, setDecomposition, splitOf } from '@/domain/tree';
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
