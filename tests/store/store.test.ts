import { beforeEach, describe, expect, it } from 'vitest';
import { createDoc } from '@/domain/factory';
import { recomputeMece } from '@/domain/mece';
import { childrenOf, splitOf } from '@/domain/tree';
import { saveDocById } from '@/services/storage';
import { useStore } from '@/store';

beforeEach(() => {
  // In-memory localStorage so the document library persists under the node test env.
  const mem = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => {
      mem.set(k, v);
    },
    removeItem: (k: string) => {
      mem.delete(k);
    },
    clear: () => mem.clear(),
    key: () => null,
    length: 0,
  } as Storage;

  const doc = recomputeMece(createDoc('Root', 1000));
  saveDocById(doc);
  useStore.setState({
    doc,
    library: [{ id: doc.id, name: 'Root' }],
    activeId: doc.id,
    past: [],
    future: [],
    selectedId: null,
  });
});

describe('store', () => {
  it('addChild adds a child and records undo history', () => {
    const { doc, addChild } = useStore.getState();
    addChild(doc.rootId, 'Revenue');
    const after = useStore.getState();
    expect(childrenOf(after.doc, doc.rootId).map((n) => n.label)).toEqual(['Revenue']);
    expect(after.canUndo()).toBe(true);
  });

  it('undo and redo move through history', () => {
    const root = useStore.getState().doc.rootId;
    useStore.getState().addChild(root, 'A');
    useStore.getState().addChild(root, 'B');
    expect(childrenOf(useStore.getState().doc, root)).toHaveLength(2);

    useStore.getState().undo();
    expect(childrenOf(useStore.getState().doc, root)).toHaveLength(1);

    useStore.getState().redo();
    expect(childrenOf(useStore.getState().doc, root)).toHaveLength(2);
  });

  it('recomputes MECE after a mutation', () => {
    const root = useStore.getState().doc.rootId;
    useStore.getState().addChild(root, 'A');
    useStore.getState().addChild(root, 'not-A');
    useStore.getState().setDecomposition(root, 'binary');
    expect(splitOf(useStore.getState().doc, root)?.mece.exhaustive.state).toBe('pass');
  });

  it('clears selection when the selected node is removed', () => {
    const root = useStore.getState().doc.rootId;
    useStore.getState().addChild(root, 'A');
    const childId = splitOf(useStore.getState().doc, root)?.childIds[0];
    if (!childId) throw new Error('expected a child');
    useStore.getState().select(childId);
    useStore.getState().removeNode(childId);
    expect(useStore.getState().selectedId).toBeNull();
  });

  it('setAmount preserves an existing unit', () => {
    const root = useStore.getState().doc.rootId;
    useStore.getState().setAmount(root, 100);
    useStore.getState().setUnit(root, 'DKK');
    expect(useStore.getState().doc.nodes[root]?.value).toEqual({ amount: 100, unit: 'DKK' });
    useStore.getState().setAmount(root, 250);
    expect(useStore.getState().doc.nodes[root]?.value).toEqual({ amount: 250, unit: 'DKK' });
  });

  it('setUnit without an amount is a no-op (records no history)', () => {
    const root = useStore.getState().doc.rootId;
    useStore.getState().setUnit(root, 'DKK');
    expect(useStore.getState().doc.nodes[root]?.value).toBeUndefined();
    expect(useStore.getState().canUndo()).toBe(false);
  });

  it('setAmount(undefined) clears the value; empty setUnit clears just the unit', () => {
    const root = useStore.getState().doc.rootId;
    useStore.getState().setAmount(root, 100);
    useStore.getState().setUnit(root, 'DKK');
    useStore.getState().setUnit(root, '');
    expect(useStore.getState().doc.nodes[root]?.value).toEqual({ amount: 100 });
    useStore.getState().setAmount(root, undefined);
    expect(useStore.getState().doc.nodes[root]?.value).toBeUndefined();
  });

  it('newDoc creates a new document and switches to it, keeping the old in the library', () => {
    const firstId = useStore.getState().doc.id;
    useStore.getState().addChild(useStore.getState().doc.rootId, 'A');
    useStore.getState().newDoc();

    const s = useStore.getState();
    expect(s.activeId).not.toBe(firstId);
    expect(childrenOf(s.doc, s.doc.rootId)).toHaveLength(0); // fresh tree
    expect(s.library).toHaveLength(2);
    expect(s.library.map((e) => e.id)).toContain(firstId); // old tree still there
  });

  it('openDoc imports a doc as a new library entry with a fresh id', () => {
    const firstId = useStore.getState().doc.id;
    const incoming = recomputeMece(createDoc('Imported question', 2000));
    useStore.getState().openDoc(incoming);

    const s = useStore.getState();
    expect(s.doc.nodes[s.doc.rootId]?.label).toBe('Imported question');
    expect(s.activeId).not.toBe(firstId);
    expect(s.activeId).not.toBe(incoming.id); // fresh id assigned on import
    expect(s.library).toHaveLength(2);
  });

  it('switchDoc loads another saved tree and back', () => {
    const firstId = useStore.getState().doc.id;
    useStore.getState().addChild(useStore.getState().doc.rootId, 'Branch');
    useStore.getState().newDoc();
    const secondId = useStore.getState().activeId;

    useStore.getState().switchDoc(firstId);
    expect(useStore.getState().activeId).toBe(firstId);
    expect(
      childrenOf(useStore.getState().doc, useStore.getState().doc.rootId).map((n) => n.label)
    ).toEqual(['Branch']);

    useStore.getState().switchDoc(secondId);
    expect(childrenOf(useStore.getState().doc, useStore.getState().doc.rootId)).toHaveLength(0);
  });

  it('deleteDoc removes a tree; deleting the active one opens another', () => {
    const firstId = useStore.getState().doc.id;
    useStore.getState().newDoc();
    const secondId = useStore.getState().activeId;
    expect(useStore.getState().library).toHaveLength(2);

    useStore.getState().deleteDoc(secondId);
    expect(useStore.getState().library).toHaveLength(1);
    expect(useStore.getState().activeId).toBe(firstId);
  });

  it('deleting the last tree seeds a fresh one', () => {
    const onlyId = useStore.getState().doc.id;
    useStore.getState().deleteDoc(onlyId);
    expect(useStore.getState().library).toHaveLength(1);
    expect(useStore.getState().activeId).not.toBe(onlyId);
  });
});
