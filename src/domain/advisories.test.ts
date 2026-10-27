import { describe, expect, it } from 'vitest';
import { type Advisory, type AdvisoryCategory, advisories, advisoriesFor } from './advisories';
import { createDoc } from './factory';
import { addChild, addEvidence, setDecomposition, setStatus, setTreeMode } from './tree';
import type { NodeId } from './types';

const cats = (as: Advisory[], c: AdvisoryCategory): Advisory[] =>
  as.filter((a) => a.category === c);

/** A freeform issue split under a question root; returns the child ids in order. */
function freeform(childLabels: string[], rootLabel = 'Why is profit down?') {
  let doc = createDoc(rootLabel, 0);
  const ids: NodeId[] = [];
  for (const label of childLabels) {
    const r = addChild(doc, doc.rootId, label);
    doc = r.doc;
    ids.push(r.childId);
  }
  return { doc, ids };
}

describe('whole-sentence lint', () => {
  it('flags a bare single-word branch on a freeform split', () => {
    const { doc, ids } = freeform(['Revenue', 'How can we cut costs?']);
    const ws = cats(advisories(doc), 'whole-sentence');
    expect(ws).toHaveLength(1);
    expect(ws[0]?.target.id).toBe(ids[0]); // "Revenue"
  });

  it('does not flag questions, multi-word labels, or non-freeform branches', () => {
    const { doc } = freeform(['How can we grow?', 'Reduce input costs']);
    expect(cats(advisories(doc), 'whole-sentence')).toHaveLength(0);

    // Segment branches are legitimately terse nouns — not issue phrasing.
    let seg = createDoc('Which segment leaks value?', 0);
    seg = addChild(seg, seg.rootId, 'Enterprise').doc;
    seg = addChild(seg, seg.rootId, 'Consumer').doc;
    seg = setDecomposition(seg, seg.rootId, 'segment');
    expect(cats(advisories(seg), 'whole-sentence')).toHaveLength(0);
  });
});

describe('branch-count lint', () => {
  it('flags more than seven children', () => {
    const { doc } = freeform(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
    expect(cats(advisories(doc), 'branch-count')).toHaveLength(1);
  });

  it('does not flag five children', () => {
    const { doc } = freeform(['a', 'b', 'c', 'd', 'e']);
    expect(cats(advisories(doc), 'branch-count')).toHaveLength(0);
  });
});

describe('altitude lint', () => {
  it('flags one detailed branch among terse siblings', () => {
    const { doc } = freeform([
      'Costs',
      'Revenue',
      'Can we renegotiate the top three supplier contracts this year?',
    ]);
    expect(cats(advisories(doc), 'altitude')).toHaveLength(1);
  });

  it('does not flag when the branches are level', () => {
    const { doc } = freeform(['Costs', 'Revenue', 'Volume']);
    expect(cats(advisories(doc), 'altitude')).toHaveLength(0);
  });
});

describe('hypothesis-quality lint', () => {
  it('flags a judged node still phrased as a question', () => {
    let doc = createDoc('Why is profit down?', 0);
    const r = addChild(doc, doc.rootId, 'Are costs rising?');
    doc = addChild(r.doc, r.doc.rootId, 'Are prices falling?').doc;
    doc = setStatus(doc, r.childId, 'supported');
    const h = cats(advisories(doc), 'hypothesis');
    expect(h).toHaveLength(1);
    expect(h[0]?.target.id).toBe(r.childId);
  });

  it('does not flag an open question or a judged statement', () => {
    let doc = createDoc('Why is profit down?', 0);
    doc = addChild(doc, doc.rootId, 'Are costs rising?').doc; // open — fine
    const s = addChild(doc, doc.rootId, 'Costs are rising 5%'); // a claim
    doc = s.doc;
    doc = setStatus(doc, s.childId, 'refuted');
    expect(cats(advisories(doc), 'hypothesis')).toHaveLength(0);
  });
});

describe('key-question lint', () => {
  it('flags a root that is not phrased as a question', () => {
    const doc = createDoc('Improve profitability', 0);
    expect(cats(advisories(doc), 'key-question').some((a) => a.id.startsWith('kq-question'))).toBe(
      true
    );
  });

  it('flags a compound, multi-question root', () => {
    const doc = createDoc('Why did profit fall? And what should we do about it?', 0);
    expect(cats(advisories(doc), 'key-question').some((a) => a.id.startsWith('kq-compound'))).toBe(
      true
    );
  });

  it('does not flag a single, well-formed question', () => {
    const doc = createDoc('How can we restore profitability within a year?', 0);
    expect(cats(advisories(doc), 'key-question')).toHaveLength(0);
  });
});

describe('tree-mode lint', () => {
  it('flags a branch that asks the opposite question word', () => {
    let doc = createDoc('Why is profit down?', 0);
    doc = setTreeMode(doc, 'why');
    const r = addChild(doc, doc.rootId, 'How can we cut costs?'); // opposite direction
    doc = addChild(r.doc, r.doc.rootId, 'Because volumes fell').doc;
    expect(cats(advisories(doc), 'tree-mode').some((a) => a.id.startsWith('mode-direction'))).toBe(
      true
    );
  });

  it('flags a process split in a "how" tree', () => {
    let doc = createDoc('How can we launch?', 0);
    doc = setTreeMode(doc, 'how');
    doc = addChild(doc, doc.rootId, 'Stage 1').doc;
    doc = addChild(doc, doc.rootId, 'Stage 2').doc;
    doc = setDecomposition(doc, doc.rootId, 'process');
    expect(cats(advisories(doc), 'tree-mode').some((a) => a.id.startsWith('mode-process'))).toBe(
      true
    );
  });

  it('does not flag when the mode is unset or the tree is consistent', () => {
    let unset = createDoc('Why is profit down?', 0);
    unset = addChild(unset, unset.rootId, 'How can we cut costs?').doc; // opposite, but no mode
    unset = addChild(unset, unset.rootId, 'Because volumes fell').doc;
    expect(cats(advisories(unset), 'tree-mode')).toHaveLength(0);

    let ok = createDoc('How can we grow?', 0);
    ok = setTreeMode(ok, 'how');
    ok = addChild(ok, ok.rootId, 'Enter new markets').doc;
    ok = addChild(ok, ok.rootId, 'Raise prices').doc;
    expect(cats(advisories(ok), 'tree-mode')).toHaveLength(0);
  });
});

describe('advisoriesFor', () => {
  it('returns only advisories targeting the given node', () => {
    const { doc, ids } = freeform(['Revenue', 'Costs']);
    const forRevenue = advisoriesFor(doc, ids[0] as NodeId);
    expect(forRevenue.every((a) => a.target.id === ids[0])).toBe(true);
    expect(forRevenue.some((a) => a.category === 'whole-sentence')).toBe(true);
  });
});

describe('evidence-consistency hints', () => {
  function judged(
    status: 'supported' | 'refuted',
    evidence: { supports: boolean; strength: 'anecdote' | 'indicative' | 'strong' }[]
  ) {
    const { doc: d0, ids } = freeform(['CSU slow at peak', 'Store line too thin']);
    let doc = d0;
    const id = ids[0] as NodeId;
    evidence.forEach((e, i) => {
      doc = addEvidence(doc, id, { id: `e${i}`, summary: `fact ${i}`, ...e });
    });
    doc = setStatus(doc, id, status);
    return { doc, id };
  }
  const evidenceHints = (doc: ReturnType<typeof judged>['doc']) =>
    cats(advisories(doc), 'evidence');

  it('flags a hypothesis judged with no evidence at all', () => {
    const { doc, id } = judged('refuted', []);
    const hints = evidenceHints(doc);
    expect(hints).toHaveLength(1);
    expect(hints[0]?.target).toEqual({ kind: 'node', id });
    expect(hints[0]?.message).toEqual({
      code: 'advisory.evidence.noEvidence',
      params: { status: 'refuted' },
    });
  });

  it('flags a hypothesis ruled out on anecdote alone', () => {
    const { doc } = judged('refuted', [{ supports: false, strength: 'anecdote' }]);
    expect(evidenceHints(doc)[0]?.message).toEqual({
      code: 'advisory.evidence.anecdoteOnly',
      params: { status: 'refuted' },
    });
  });

  it('flags a hypothesis ruled out while strong evidence still supports it', () => {
    // The CSU case: ruled out on server timings, then a neutral probe saw it slow.
    const { doc } = judged('refuted', [
      { supports: false, strength: 'indicative' },
      { supports: true, strength: 'strong' },
    ]);
    expect(evidenceHints(doc)[0]?.message).toEqual({
      code: 'advisory.evidence.strongAgainst',
      params: { status: 'refuted' },
    });
  });

  it('works the same way round for a supported hypothesis', () => {
    expect(
      evidenceHints(judged('supported', [{ supports: true, strength: 'anecdote' }]).doc)[0]?.message
        ?.code
    ).toBe('advisory.evidence.anecdoteOnly');
    expect(
      evidenceHints(
        judged('supported', [
          { supports: true, strength: 'strong' },
          { supports: false, strength: 'strong' },
        ]).doc
      )[0]?.message?.code
    ).toBe('advisory.evidence.strongAgainst');
  });

  it('stays quiet when the verdict is backed by non-anecdotal evidence and nothing strong opposes it', () => {
    const { doc } = judged('refuted', [
      { supports: false, strength: 'indicative' },
      { supports: true, strength: 'anecdote' },
    ]);
    expect(evidenceHints(doc)).toHaveLength(0);
  });

  it('ignores open and parked hypotheses, and the root', () => {
    let { doc } = freeform(['CSU slow at peak']);
    doc = setStatus(doc, doc.rootId, 'supported');
    expect(evidenceHints(doc)).toHaveLength(0);
  });

  it('raises at most one hint per node', () => {
    const { doc } = judged('refuted', [
      { supports: false, strength: 'anecdote' },
      { supports: true, strength: 'strong' },
    ]);
    expect(evidenceHints(doc)).toHaveLength(1);
  });
});
