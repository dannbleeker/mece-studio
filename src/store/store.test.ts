import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDoc } from '../domain/factory';
import {
  addChild,
  childrenOf,
  setDecomposition,
  setNodeValue,
  setOperator,
  splitOf,
} from '../domain/tree';
import { docName, loadDocById, saveDocById, saveLibrary } from '../services/storage';
import { useStore } from './index';

function makeLocalStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    clear: () => m.clear(),
    getItem: (k) => (m.has(k) ? (m.get(k) as string) : null),
    key: (i) => Array.from(m.keys())[i] ?? null,
    removeItem: (k) => {
      m.delete(k);
    },
    setItem: (k, v) => {
      m.set(k, String(v));
    },
  };
}

// The store is a singleton seeded at import; reset to that clean state per test,
// with a fresh in-memory localStorage so the persistence paths (switchDoc /
// deleteDoc) can load saved documents.
const FRESH = useStore.getState();
const s = () => useStore.getState();
beforeEach(() => {
  vi.stubGlobal('localStorage', makeLocalStorage());
  useStore.setState(FRESH, true);
  saveDocById(s().doc);
  saveLibrary({ activeId: s().activeId, docs: s().library });
});
afterEach(() => vi.unstubAllGlobals());

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

  it('setRootQuestion renames the root and syncs the library entry name', () => {
    s().setRootQuestion('Where is margin leaking?');
    expect(s().doc.nodes[s().doc.rootId]?.label).toBe('Where is margin leaking?');
    const entry = s().library.find((e) => e.id === s().activeId);
    expect(entry?.name).toBe('Where is margin leaking?');
  });

  it('setAmount sets a value, preserves the unit, then clears it', () => {
    const root = s().doc.rootId;
    s().setAmount(root, 100);
    expect(s().doc.nodes[root]?.value).toEqual({ amount: 100 });
    s().setUnit(root, 'DKK');
    expect(s().doc.nodes[root]?.value).toEqual({ amount: 100, unit: 'DKK' });
    s().setAmount(root, 250); // a new amount keeps the existing unit
    expect(s().doc.nodes[root]?.value).toEqual({ amount: 250, unit: 'DKK' });
    s().setAmount(root, undefined); // undefined clears the value entirely
    expect(s().doc.nodes[root]?.value).toBeUndefined();
  });

  it('setUnit is a no-op (no history entry) when the node has no amount', () => {
    s().addChild(s().doc.rootId, 'No value');
    const child = childrenOf(s().doc, s().doc.rootId)[0];
    if (!child) throw new Error('no child');
    const before = s().doc;
    s().setUnit(child.id, 'kg');
    expect(s().doc).toBe(before); // same reference — the apply() no-op guard held
    expect(s().doc.nodes[child.id]?.value).toBeUndefined();
  });

  it('setStatus and setPriority annotate a node, each undoable independently', () => {
    s().addChild(s().doc.rootId, 'Claim');
    const claim = childrenOf(s().doc, s().doc.rootId)[0];
    if (!claim) throw new Error('no child');
    s().setStatus(claim.id, 'supported');
    expect(s().doc.nodes[claim.id]?.status).toBe('supported');
    s().setPriority(claim.id, { impact: 'high', ease: 'high' });
    expect(s().doc.nodes[claim.id]?.priority).toEqual({ impact: 'high', ease: 'high' });
    s().undo(); // undo only the priority; status stays
    expect(s().doc.nodes[claim.id]?.priority).toBeUndefined();
    expect(s().doc.nodes[claim.id]?.status).toBe('supported');
  });

  it('adds, updates, and removes evidence on a node', () => {
    const root = s().doc.rootId;
    s().addEvidence(root, 'Survey n=200', true, 'strong');
    const added = s().doc.nodes[root]?.evidence ?? [];
    expect(added).toHaveLength(1);
    expect(added[0]).toMatchObject({ summary: 'Survey n=200', supports: true, strength: 'strong' });
    const id = added[0]?.id;
    if (!id) throw new Error('no evidence id');
    s().updateEvidence(root, id, { summary: 'Survey n=400', supports: false });
    expect(s().doc.nodes[root]?.evidence[0]).toMatchObject({
      summary: 'Survey n=400',
      supports: false,
    });
    s().removeEvidence(root, id);
    expect(s().doc.nodes[root]?.evidence ?? []).toHaveLength(0);
  });

  it('toggles collapse on one node and collapses / expands the whole tree', () => {
    s().addChild(s().doc.rootId, 'Parent');
    const parent = childrenOf(s().doc, s().doc.rootId)[0];
    if (!parent) throw new Error('no parent');
    s().addChild(parent.id, 'Kid'); // parent now has a child → it is collapsible
    expect(s().doc.nodes[parent.id]?.collapsed).toBeFalsy();
    s().toggleCollapse(parent.id);
    expect(s().doc.nodes[parent.id]?.collapsed).toBeTruthy();
    s().expandAll();
    expect(s().doc.nodes[parent.id]?.collapsed).toBeFalsy();
    s().collapseAll();
    expect(s().doc.nodes[parent.id]?.collapsed).toBeTruthy();
  });

  it('reorders a sibling up and back down', () => {
    s().addChild(s().doc.rootId, 'First');
    s().addChild(s().doc.rootId, 'Second');
    const labels = () => childrenOf(s().doc, s().doc.rootId).map((c) => c.label);
    expect(labels()).toEqual(['First', 'Second']);
    const second = childrenOf(s().doc, s().doc.rootId)[1];
    if (!second) throw new Error('no second');
    s().moveSibling(second.id, 'up');
    expect(labels()).toEqual(['Second', 'First']);
    s().moveSibling(second.id, 'down');
    expect(labels()).toEqual(['First', 'Second']);
  });

  it('decompose seeds starter children and sets the split type', () => {
    const root = s().doc.rootId;
    expect(childrenOf(s().doc, root)).toHaveLength(0);
    s().decompose(root, 'binary');
    expect(childrenOf(s().doc, root).length).toBeGreaterThan(0);
    expect(splitOf(s().doc, root)?.decomposition).toBe('binary');
  });

  it('sets the decomposition type and formula operator through the store', () => {
    const root = s().doc.rootId;
    s().addChild(root, 'A');
    s().addChild(root, 'B'); // a second child gives the root a real split
    s().setDecomposition(root, 'formula');
    expect(splitOf(s().doc, root)?.decomposition).toBe('formula');
    s().setOperator(root, 'product');
    expect(splitOf(s().doc, root)?.operator).toBe('product');
  });

  it('switchDoc loads another saved document and makes it active', () => {
    s().newDoc(); // creates + activates B (persisted)
    const b = s().activeId;
    const a = s().library.find((e) => e.id !== b)?.id ?? '';
    s().switchDoc(a);
    expect(s().activeId).toBe(a);
    expect(s().doc.id).toBe(a);
  });

  it('deleting the active document reopens another from the library', () => {
    s().newDoc(); // B active; library [A, B]
    const b = s().activeId;
    s().deleteDoc(b);
    expect(s().activeId).not.toBe(b);
    expect(s().library.some((e) => e.id === b)).toBe(false);
  });

  it('undo / redo are no-ops with empty history', () => {
    const doc = s().doc;
    expect(s().canUndo()).toBe(false);
    expect(s().canRedo()).toBe(false);
    s().undo();
    s().redo();
    expect(s().doc).toBe(doc);
  });

  it('renameDoc renames a non-active tree + its library entry, without switching to it', () => {
    s().newDoc(); // B active; library [A, B]
    const a = s().library.find((e) => e.id !== s().activeId)?.id ?? '';
    const activeBefore = s().activeId;
    s().renameDoc(a, 'Renamed offline');
    expect(docName(loadDocById(a) ?? s().doc)).toBe('Renamed offline');
    expect(s().library.find((e) => e.id === a)?.name).toBe('Renamed offline');
    expect(s().activeId).toBe(activeBefore); // the open tree is untouched
  });

  it('renameDoc on the active tree updates the live doc; empty name is a no-op', () => {
    s().renameDoc(s().activeId, 'Live rename');
    expect(s().doc.nodes[s().doc.rootId]?.label).toBe('Live rename');
    const before = s().doc;
    s().renameDoc(s().activeId, '   ');
    expect(s().doc).toBe(before);
  });

  it('duplicateDoc copies a tree into the library as "(copy)" without opening it', () => {
    const before = s().library.length;
    const activeBefore = s().activeId;
    s().duplicateDoc(s().activeId);
    expect(s().library).toHaveLength(before + 1);
    expect(s().activeId).toBe(activeBefore); // no switch
    expect(s().library.some((e) => e.name.endsWith('(copy)'))).toBe(true);
  });
});
