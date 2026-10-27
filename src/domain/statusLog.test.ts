import { describe, expect, it } from 'vitest';
import { createDoc } from './factory';
import { statusLogOf } from './provenance';
import {
  addChild,
  addEvidence,
  duplicateNode,
  removeEvidence,
  setEvidenceProvenance,
  setStatus,
  setStatusMany,
  updateStatusChange,
} from './tree';
import type { IssueTreeDoc, NodeId } from './types';

function withHypothesis(): { doc: IssueTreeDoc; id: NodeId } {
  const doc0 = createDoc('Why is the POS slow?', 0);
  const { doc, childId } = addChild(doc0, doc0.rootId, 'CSU slow at peak');
  return { doc, id: childId };
}

const log = (doc: IssueTreeDoc, id: NodeId) => statusLogOf(doc.nodes[id] ?? { statusLog: [] });

describe('status history', () => {
  it('records each change with when, from and to', () => {
    let { doc, id } = withHypothesis();
    doc = setStatus(doc, id, 'refuted', 1000);
    doc = setStatus(doc, id, 'open', 2000);
    expect(log(doc, id)).toEqual([
      { at: 1000, from: 'open', to: 'refuted' },
      { at: 2000, from: 'refuted', to: 'open' },
    ]);
  });

  it('records nothing when the status does not actually change', () => {
    const { doc, id } = withHypothesis();
    expect(setStatus(doc, id, 'open', 1000)).toBe(doc);
  });

  it('records a change for every node in a bulk status set', () => {
    let { doc, id } = withHypothesis();
    const other = addChild(doc, doc.rootId, 'Line too thin');
    doc = setStatusMany(other.doc, [id, other.childId], 'parked', 5);
    expect(log(doc, id)).toEqual([{ at: 5, from: 'open', to: 'parked' }]);
    expect(log(doc, other.childId)).toEqual([{ at: 5, from: 'open', to: 'parked' }]);
  });

  it('adds a reason and the evidence that tipped it to one entry', () => {
    let { doc, id } = withHypothesis();
    doc = addEvidence(doc, id, {
      id: 'ev1',
      summary: 'ZDX: CSU 120 ms to 450 ms at 16:00',
      supports: true,
      strength: 'indicative',
    });
    doc = setStatus(doc, id, 'refuted', 1);
    doc = setStatus(doc, id, 'open', 2);
    doc = updateStatusChange(doc, id, 1, {
      reason: 'Neutral probe saw the backend slow',
      evidenceId: 'ev1',
    });
    expect(log(doc, id)[1]).toEqual({
      at: 2,
      from: 'refuted',
      to: 'open',
      reason: 'Neutral probe saw the backend slow',
      evidenceId: 'ev1',
    });
    expect(log(doc, id)[0]).toEqual({ at: 1, from: 'open', to: 'refuted' });
  });

  it('clears a reason with an empty string, and is a no-op for a missing entry', () => {
    let { doc, id } = withHypothesis();
    doc = setStatus(doc, id, 'refuted', 1);
    doc = updateStatusChange(doc, id, 0, { reason: 'x' });
    doc = updateStatusChange(doc, id, 0, { reason: '  ' });
    expect(log(doc, id)[0]).toEqual({ at: 1, from: 'open', to: 'refuted' });
    expect(updateStatusChange(doc, id, 7, { reason: 'y' })).toBe(doc);
  });

  it('drops the evidence link when that evidence is removed', () => {
    let { doc, id } = withHypothesis();
    doc = addEvidence(doc, id, { id: 'ev1', summary: 's', supports: false, strength: 'strong' });
    doc = setStatus(doc, id, 'refuted', 1);
    doc = updateStatusChange(doc, id, 0, { evidenceId: 'ev1', reason: 'kept' });
    doc = removeEvidence(doc, id, 'ev1');
    expect(log(doc, id)[0]).toEqual({ at: 1, from: 'open', to: 'refuted', reason: 'kept' });
  });

  it('copies the history with a duplicated node, as its own array', () => {
    let { doc, id } = withHypothesis();
    doc = setStatus(doc, id, 'refuted', 1);
    const { doc: dup, newId: copyId } = duplicateNode(doc, id);
    expect(log(dup, copyId)).toEqual(log(doc, id));
    expect(dup.nodes[copyId]?.statusLog).not.toBe(doc.nodes[id]?.statusLog);
  });
});

describe('evidence provenance', () => {
  function withEvidence() {
    const { doc, id } = withHypothesis();
    return {
      doc: addEvidence(doc, id, { id: 'ev1', summary: 's', supports: true, strength: 'strong' }),
      id,
    };
  }
  const ev = (doc: IssueTreeDoc, id: NodeId) => doc.nodes[id]?.evidence[0];

  it('sets date, author, source and link, trimmed', () => {
    let { doc, id } = withEvidence();
    doc = setEvidenceProvenance(doc, id, 'ev1', 'author', '  Martin ');
    doc = setEvidenceProvenance(doc, id, 'ev1', 'date', '2026-10-24');
    doc = setEvidenceProvenance(doc, id, 'ev1', 'source', 'Zscaler ZDX');
    doc = setEvidenceProvenance(doc, id, 'ev1', 'url', 'https://teams.microsoft.com/l/message/1');
    expect(ev(doc, id)).toMatchObject({
      author: 'Martin',
      date: '2026-10-24',
      source: 'Zscaler ZDX',
      url: 'https://teams.microsoft.com/l/message/1',
    });
  });

  it('clears a field with an empty value, and is a no-op when nothing changes', () => {
    let { doc, id } = withEvidence();
    doc = setEvidenceProvenance(doc, id, 'ev1', 'author', 'Martin');
    expect(setEvidenceProvenance(doc, id, 'ev1', 'author', 'Martin')).toBe(doc);
    doc = setEvidenceProvenance(doc, id, 'ev1', 'author', '   ');
    expect(ev(doc, id)).not.toHaveProperty('author');
  });

  it('refuses a date that is not a real calendar day', () => {
    const { doc, id } = withEvidence();
    expect(setEvidenceProvenance(doc, id, 'ev1', 'date', '2026-02-30')).toBe(doc);
  });
});
