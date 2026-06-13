import { beforeEach, describe, expect, it } from 'vitest';
import { createDoc } from '../domain/factory';
import {
  addChild,
  childrenOf,
  setDecomposition,
  setNodeValue,
  setOperator,
  splitOf,
} from '../domain/tree';
import { useStore } from './index';

// The store is a singleton seeded at import; reset to that clean state per test.
const FRESH = useStore.getState();
const s = () => useStore.getState();
beforeEach(() => {
  useStore.setState(FRESH, true);
});

// A formula split that misses reconciliation by 1% (60 + 39 vs 100).
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
  return setOperator(doc, doc.rootId, 'sum');
}

describe('store', () => {
  it('adds a child and undoes / redoes it', () => {
    const n = () => Object.keys(s().doc.nodes).length;
    const before = n();
    s().addChild(s().doc.rootId, 'Child');
    expect(n()).toBe(before + 1);
    expect(s().canUndo()).toBe(true);

    s().undo();
    expect(n()).toBe(before);
    expect(s().canRedo()).toBe(true);

    s().redo();
    expect(n()).toBe(before + 1);
  });

  it('re-evaluates the active doc when the formula tolerance changes', () => {
    s().openDoc(formulaDoc());
    const rootId = s().doc.rootId;
    const ce = () => splitOf(s().doc, rootId)?.mece.exhaustive.state;
    expect(ce()).toBe('warn'); // 1% off > default 0.5%
    s().setSettings({ formulaTolerance: 0.02 });
    expect(ce()).toBe('pass'); // now within 2%
    expect(s().settings.formulaTolerance).toBe(0.02);
  });

  it('toggles a settings flag', () => {
    expect(s().settings.sortSiblingsByPriority).toBe(false);
    s().setSettings({ sortSiblingsByPriority: true });
    expect(s().settings.sortSiblingsByPriority).toBe(true);
  });

  it('duplicates a subtree as a sibling and selects the copy', () => {
    s().addChild(s().doc.rootId, 'Original');
    const orig = childrenOf(s().doc, s().doc.rootId)[0];
    if (!orig) throw new Error('no child');
    s().duplicateNode(orig.id);
    expect(childrenOf(s().doc, s().doc.rootId)).toHaveLength(2);
    expect(s().selectedId).not.toBeNull();
    expect(s().selectedId).not.toBe(orig.id);
  });

  it('removes a node and clears the selection when it was selected', () => {
    s().addChild(s().doc.rootId, 'Doomed');
    const child = childrenOf(s().doc, s().doc.rootId)[0];
    if (!child) throw new Error('no child');
    s().select(child.id);
    s().removeNode(child.id);
    expect(childrenOf(s().doc, s().doc.rootId)).toHaveLength(0);
    expect(s().selectedId).toBeNull();
  });

  it('opens a new tree into the library and drops a non-active one', () => {
    const start = s().library.length;
    s().newDoc();
    expect(s().library).toHaveLength(start + 1);
    const activeId = s().activeId;
    const other = s().library.find((e) => e.id !== activeId);
    if (!other) throw new Error('expected a second doc');
    s().deleteDoc(other.id);
    expect(s().library).toHaveLength(start);
    expect(s().activeId).toBe(activeId); // the active doc is untouched
  });
});
