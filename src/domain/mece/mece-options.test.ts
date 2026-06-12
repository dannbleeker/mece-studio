import { describe, expect, it } from 'vitest';
import { createDoc } from '../factory';
import { addChild, setDecomposition, setNodeValue, setOperator, splitOf } from '../tree';
import { recomputeMece } from './engine';

// A formula split where the children (60 + 39 = 99) miss the parent (100) by 1%.
function formulaDoc() {
  let doc = createDoc('Profit', 0);
  doc = setNodeValue(doc, doc.rootId, { amount: 100 });
  const a = addChild(doc, doc.rootId, 'A');
  doc = a.doc;
  const b = addChild(doc, doc.rootId, 'B');
  doc = b.doc;
  doc = setNodeValue(doc, a.childId, { amount: 60 });
  doc = setNodeValue(doc, b.childId, { amount: 39 });
  doc = setDecomposition(doc, doc.rootId, 'formula');
  doc = setOperator(doc, doc.rootId, 'sum');
  return doc;
}

describe('MECE options — formula tolerance', () => {
  it('a 1%-off split warns at the default 0.5% tolerance', () => {
    const doc = recomputeMece(formulaDoc());
    expect(splitOf(doc, doc.rootId)?.mece.exhaustive.state).toBe('warn');
  });
  it('the same split passes when tolerance is widened to 2%', () => {
    const doc = recomputeMece(formulaDoc(), { formulaTolerance: 0.02, strictOverlap: false });
    expect(splitOf(doc, doc.rootId)?.mece.exhaustive.state).toBe('pass');
  });
});

describe('MECE options — strict overlap', () => {
  // Two segments sharing a 3-letter content word ("tax").
  function overlapDoc() {
    let doc = createDoc('Q', 0);
    const a = addChild(doc, doc.rootId, 'Tax burden');
    doc = a.doc;
    const b = addChild(doc, doc.rootId, 'Tax relief');
    doc = b.doc;
    doc = setDecomposition(doc, doc.rootId, 'segment');
    return doc;
  }
  it('ignores a shared 3-letter word by default (min length 4)', () => {
    const doc = recomputeMece(overlapDoc());
    expect(splitOf(doc, doc.rootId)?.mece.exclusive.state).not.toBe('warn');
  });
  it('flags the shared 3-letter word in strict mode', () => {
    const doc = recomputeMece(overlapDoc(), { formulaTolerance: 0.005, strictOverlap: true });
    expect(splitOf(doc, doc.rootId)?.mece.exclusive.state).toBe('warn');
  });
});
