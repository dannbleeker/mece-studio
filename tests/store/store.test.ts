import { beforeEach, describe, expect, it } from 'vitest';
import { createDoc } from '@/domain/factory';
import { recomputeMece } from '@/domain/mece';
import { childrenOf, splitOf } from '@/domain/tree';
import { useStore } from '@/store';

beforeEach(() => {
  useStore.setState({
    doc: recomputeMece(createDoc('Root', 1000)),
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

  it('newDoc resets to a fresh root and keeps the old tree in undo', () => {
    const root = useStore.getState().doc.rootId;
    useStore.getState().addChild(root, 'A');
    useStore.getState().newDoc();

    expect(childrenOf(useStore.getState().doc, useStore.getState().doc.rootId)).toHaveLength(0);
    expect(useStore.getState().doc.rootId).not.toBe(root);

    useStore.getState().undo();
    expect(useStore.getState().doc.rootId).toBe(root);
  });
});
