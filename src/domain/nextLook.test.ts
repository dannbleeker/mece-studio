import { describe, expect, it } from 'vitest';
import { createDoc, createEvidence } from './factory';
import { uncertaintyOf, whereToLook } from './nextLook';
import { addChild, addEvidence, setPriority, setStatus } from './tree';
import type { IssueTreeDoc, NodeId } from './types';

function tree() {
  let doc: IssueTreeDoc = createDoc('Why are page loads slow?', 0);
  const add = (parent: NodeId, label: string) => {
    const r = addChild(doc, parent, label);
    doc = r.doc;
    return r.childId;
  };
  const db = add(doc.rootId, 'Database slow at peak');
  const line = add(doc.rootId, 'Network link full');
  const lan = add(doc.rootId, 'Office network');
  const lanSwitch = add(lan, 'Switch port errors');
  return {
    get doc() {
      return doc;
    },
    set doc(d) {
      doc = d;
    },
    db,
    line,
    lan,
    lanSwitch,
  };
}

describe('uncertaintyOf', () => {
  it('grades the evidence on a node', () => {
    expect(uncertaintyOf([])).toBe('unknown');
    expect(uncertaintyOf([createEvidence('a', true, 'anecdote', 0)])).toBe('thin');
    expect(uncertaintyOf([createEvidence('a', true, 'strong', 0)])).toBe('leaning');
    expect(
      uncertaintyOf([
        createEvidence('a', true, 'strong', 0),
        createEvidence('b', false, 'anecdote', 0),
      ])
    ).toBe('contested');
  });
});

describe('whereToLook', () => {
  it('ranks open hypotheses by impact × uncertainty, ties in tree order', () => {
    const t = tree();
    t.doc = setPriority(t.doc, t.db, { impact: 'high', ease: 'low' });
    t.doc = addEvidence(t.doc, t.db, createEvidence('Probe slow', true, 'strong', 0));
    t.doc = addEvidence(t.doc, t.db, createEvidence('Probe fine', false, 'indicative', 0));
    t.doc = setPriority(t.doc, t.line, { impact: 'low', ease: 'high' });
    const rows = whereToLook(t.doc);
    expect(rows.map((r) => [r.nodeId, r.score, r.uncertainty])).toEqual([
      [t.db, 9, 'contested'],
      [t.lan, 6, 'unknown'],
      [t.lanSwitch, 6, 'unknown'],
      [t.line, 3, 'unknown'],
    ]);
    expect(rows[1]?.impact).toBeUndefined();
  });

  it('leaves out judged nodes and anything under a refuted or parked branch', () => {
    const t = tree();
    t.doc = setStatus(t.doc, t.db, 'supported', 1);
    t.doc = setStatus(t.doc, t.lan, 'parked', 1);
    expect(whereToLook(t.doc).map((r) => r.nodeId)).toEqual([t.line]);
  });

  it('notes whether a kill test is written', () => {
    const t = tree();
    t.doc = {
      ...t.doc,
      nodes: { ...t.doc.nodes, [t.line]: { ...t.doc.nodes[t.line]!, killTest: 'x' } },
    };
    const byId = new Map(whereToLook(t.doc).map((r) => [r.nodeId, r.hasKillTest]));
    expect(byId.get(t.line)).toBe(true);
    expect(byId.get(t.db)).toBe(false);
  });
});
