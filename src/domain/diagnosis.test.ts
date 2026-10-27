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
  let doc = createDoc('Why are German tills slow on Saturdays?', 0);
  const csu = addChild(doc, doc.rootId, 'CSU slow at peak');
  doc = csu.doc;
  const line = addChild(doc, doc.rootId, 'Store line too thin');
  doc = line.doc;
  doc = addFact(doc, {
    id: 'f-when',
    dimension: 'when',
    is: 'Saturdays from 16:00',
    isNot: 'Weekdays',
  });
  doc = addFact(doc, {
    id: 'f-where',
    dimension: 'where',
    is: 'Germany',
    isNot: 'Other countries',
  });
  doc = addFact(doc, { id: 'f-fast', dimension: 'extent', is: 'Some fast lines hit too' });
  return { doc, csu: csu.childId, line: line.childId };
}

describe('is / is not facts', () => {
  it('adds, edits and lists facts in order', () => {
    let { doc } = posTree();
    doc = updateFact(doc, 'f-where', { isNot: 'Denmark, Ireland' });
    expect(factsOf(doc).map((f) => [f.id, f.dimension, f.is, f.isNot])).toEqual([
      ['f-when', 'when', 'Saturdays from 16:00', 'Weekdays'],
      ['f-where', 'where', 'Germany', 'Denmark, Ireland'],
      ['f-fast', 'extent', 'Some fast lines hit too', undefined],
    ]);
  });

  it('trims text, clears an empty is-not, and is a no-op when nothing changes', () => {
    let { doc } = posTree();
    expect(updateFact(doc, 'f-when', { is: 'Saturdays from 16:00' })).toBe(doc);
    doc = updateFact(doc, 'f-when', { isNot: '   ' });
    expect(factsOf(doc)[0]).not.toHaveProperty('isNot');
    doc = updateFact(doc, 'f-when', { is: '  Saturdays, 16:00–18:30 ' });
    expect(factsOf(doc)[0]?.is).toBe('Saturdays, 16:00–18:30');
  });

  it('removing a fact also removes every verdict on it', () => {
    let { doc, csu } = posTree();
    doc = setExplains(doc, csu, 'f-where', 'no');
    doc = setExplains(doc, csu, 'f-when', 'yes');
    doc = removeFact(doc, 'f-where');
    expect(factsOf(doc).map((f) => f.id)).toEqual(['f-when', 'f-fast']);
    expect(explainsOf(doc.nodes[csu] ?? { explains: {} })).toEqual({ 'f-when': 'yes' });
  });

  it('drops malformed facts and verdicts from a file', () => {
    const { doc, csu } = posTree();
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
    expect(csu).toBeTruthy();
  });

  it('is empty for a tree saved before facts existed', () => {
    expect(factsOf(createDoc('Q', 0))).toEqual([]);
  });
});

describe('must-explain verdicts and coverage', () => {
  it('records, changes and clears a verdict', () => {
    let { doc, csu } = posTree();
    doc = setExplains(doc, csu, 'f-when', 'yes');
    doc = setExplains(doc, csu, 'f-when', 'partly');
    expect(explainsOf(doc.nodes[csu] ?? {})).toEqual({ 'f-when': 'partly' });
    doc = setExplains(doc, csu, 'f-when', null);
    expect(doc.nodes[csu]).not.toHaveProperty('explains');
  });

  it('ignores a verdict on a fact that does not exist', () => {
    const { doc, csu } = posTree();
    expect(setExplains(doc, csu, 'no-such-fact', 'yes')).toBe(doc);
  });

  it('summarises which hypotheses explain every fact', () => {
    let { doc, csu, line } = posTree();
    doc = setExplains(doc, csu, 'f-when', 'yes');
    doc = setExplains(doc, csu, 'f-where', 'partly');
    doc = setExplains(doc, csu, 'f-fast', 'yes');
    doc = setExplains(doc, line, 'f-when', 'yes');
    doc = setExplains(doc, line, 'f-fast', 'no');
    const rows = coverage(doc);
    expect(rows).toEqual([
      {
        nodeId: csu,
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
    let { doc, csu } = posTree();
    for (const f of ['f-when', 'f-where', 'f-fast']) doc = setExplains(doc, csu, f, 'yes');
    expect(coverage(doc)[0]).toMatchObject({ nodeId: csu, explainsAll: true });
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
    let { doc, csu } = posTree();
    doc = setKillTest(doc, csu, '  Probe from an Azure VM stays at 120 ms at 16:00 ');
    doc = setPrediction(doc, csu, 'All three probes slow at 16:00 on 31 Oct');
    expect(doc.nodes[csu]).toMatchObject({
      killTest: 'Probe from an Azure VM stays at 120 ms at 16:00',
      prediction: 'All three probes slow at 16:00 on 31 Oct',
    });
    expect(setKillTest(doc, csu, 'Probe from an Azure VM stays at 120 ms at 16:00')).toBe(doc);
    doc = setPrediction(doc, csu, '');
    expect(doc.nodes[csu]).not.toHaveProperty('prediction');
    expect(firstChild(doc)).toBeTruthy();
  });
});
