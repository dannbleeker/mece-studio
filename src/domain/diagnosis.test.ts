import { describe, expect, it } from 'vitest';
import {
  addFact,
  coverage,
  explainsOf,
  factsOf,
  removeFact,
  setExplains,
  setKillTest,
  setPrediction,
  updateFact,
} from './diagnosis';
import { createDoc } from './factory';
import { addChild } from './tree';
import type { IssueTreeDoc, NodeId } from './types';

function posTree() {
  let doc = createDoc('Why are page loads slow on Monday mornings?', 0);
  const db = addChild(doc, doc.rootId, 'Database slow at peak');
  doc = db.doc;
  const line = addChild(doc, doc.rootId, 'Network link too thin');
  doc = line.doc;
  doc = addFact(doc, {
    id: 'f-when',
    dimension: 'when',
    is: 'Mondays from 09:00',
    isNot: 'Other days',
  });
  doc = addFact(doc, {
    id: 'f-where',
    dimension: 'where',
    is: 'Region A',
    isNot: 'Other regions',
  });
  doc = addFact(doc, { id: 'f-fast', dimension: 'extent', is: 'Some fast lines hit too' });
  return { doc, db: db.childId, line: line.childId };
}

describe('is / is not facts', () => {
  it('adds, edits and lists facts in order', () => {
    let { doc } = posTree();
    doc = updateFact(doc, 'f-where', { isNot: 'Region B, Region C' });
    expect(factsOf(doc).map((f) => [f.id, f.dimension, f.is, f.isNot])).toEqual([
      ['f-when', 'when', 'Mondays from 09:00', 'Other days'],
      ['f-where', 'where', 'Region A', 'Region B, Region C'],
      ['f-fast', 'extent', 'Some fast lines hit too', undefined],
    ]);
  });

  it('trims text, clears an empty is-not, and is a no-op when nothing changes', () => {
    let { doc } = posTree();
    expect(updateFact(doc, 'f-when', { is: 'Mondays from 09:00' })).toBe(doc);
    doc = updateFact(doc, 'f-when', { isNot: '   ' });
    expect(factsOf(doc)[0]).not.toHaveProperty('isNot');
    doc = updateFact(doc, 'f-when', { is: '  Mondays, 09:00–11:30 ' });
    expect(factsOf(doc)[0]?.is).toBe('Mondays, 09:00–11:30');
  });

  it('removing a fact also removes every verdict on it', () => {
    let { doc, db } = posTree();
    doc = setExplains(doc, db, 'f-where', 'no');
    doc = setExplains(doc, db, 'f-when', 'yes');
    doc = removeFact(doc, 'f-where');
    expect(factsOf(doc).map((f) => f.id)).toEqual(['f-when', 'f-fast']);
    expect(explainsOf(doc.nodes[db] ?? { explains: {} })).toEqual({ 'f-when': 'yes' });
  });

  it('drops malformed facts and verdicts from a file', () => {
    const { doc, db } = posTree();
    const raw = {
      ...doc,
      facts: [
        ...(doc.facts ?? []),
        { id: 'x', dimension: 'sometime', is: 'bad dimension' },
        { id: 'y', dimension: 'when' },
        null,
      ],
    } as unknown as IssueTreeDoc;
    expect(factsOf(raw).map((f) => f.id)).toEqual(['f-when', 'f-where', 'f-fast']);
    const node = { explains: { 'f-when': 'yes', 'f-where': 'maybe', 'f-fast': 3 } } as unknown as {
      explains: Record<string, 'yes'>;
    };
    expect(explainsOf(node)).toEqual({ 'f-when': 'yes' });
    expect(db).toBeTruthy();
  });

  it('is empty for a tree saved before facts existed', () => {
    expect(factsOf(createDoc('Q', 0))).toEqual([]);
  });
});

describe('must-explain verdicts and coverage', () => {
  it('records, changes and clears a verdict', () => {
    let { doc, db } = posTree();
    doc = setExplains(doc, db, 'f-when', 'yes');
    doc = setExplains(doc, db, 'f-when', 'partly');
    expect(explainsOf(doc.nodes[db] ?? {})).toEqual({ 'f-when': 'partly' });
    doc = setExplains(doc, db, 'f-when', null);
    expect(doc.nodes[db]).not.toHaveProperty('explains');
  });

  it('ignores a verdict on a fact that does not exist', () => {
    const { doc, db } = posTree();
    expect(setExplains(doc, db, 'no-such-fact', 'yes')).toBe(doc);
  });

  it('summarises which hypotheses explain every fact', () => {
    let { doc, db, line } = posTree();
    doc = setExplains(doc, db, 'f-when', 'yes');
    doc = setExplains(doc, db, 'f-where', 'partly');
    doc = setExplains(doc, db, 'f-fast', 'yes');
    doc = setExplains(doc, line, 'f-when', 'yes');
    doc = setExplains(doc, line, 'f-fast', 'no');
    const rows = coverage(doc);
    expect(rows).toEqual([
      {
        nodeId: db,
        yes: ['f-when', 'f-fast'],
        partly: ['f-where'],
        no: [],
        unjudged: [],
        explainsAll: false,
        ruledOutByFacts: false,
      },
      {
        nodeId: line,
        yes: ['f-when'],
        partly: [],
        no: ['f-fast'],
        unjudged: ['f-where'],
        explainsAll: false,
        ruledOutByFacts: true,
      },
    ]);
  });

  it('marks a hypothesis that explains every fact', () => {
    let { doc, db } = posTree();
    for (const f of ['f-when', 'f-where', 'f-fast']) doc = setExplains(doc, db, f, 'yes');
    expect(coverage(doc)[0]).toMatchObject({ nodeId: db, explainsAll: true });
  });

  it('lists only nodes with at least one verdict, in tree order, never the root', () => {
    let { doc, line } = posTree();
    doc = setExplains(doc, line, 'f-when', 'yes');
    doc = setExplains(doc, doc.rootId, 'f-when', 'yes');
    expect(coverage(doc).map((r) => r.nodeId)).toEqual([line]);
  });
});

describe('kill test and prediction', () => {
  const firstChild = (doc: IssueTreeDoc) =>
    Object.keys(doc.nodes).find((k) => k !== doc.rootId) as NodeId;

  it('sets, trims and clears both', () => {
    let { doc, db } = posTree();
    doc = setKillTest(doc, db, '  Probe from a cloud VM stays at 120 ms at 09:00 ');
    doc = setPrediction(doc, db, 'Both probes slow at 09:00 next Monday');
    expect(doc.nodes[db]).toMatchObject({
      killTest: 'Probe from a cloud VM stays at 120 ms at 09:00',
      prediction: 'Both probes slow at 09:00 next Monday',
    });
    expect(setKillTest(doc, db, 'Probe from a cloud VM stays at 120 ms at 09:00')).toBe(doc);
    doc = setPrediction(doc, db, '');
    expect(doc.nodes[db]).not.toHaveProperty('prediction');
    expect(firstChild(doc)).toBeTruthy();
  });
});
