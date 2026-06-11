import { create } from 'zustand';
import { createDoc, createEvidence } from '@/domain/factory';
import { recomputeMece } from '@/domain/mece';
import {
  addChild as addChildOp,
  addEvidence as addEvidenceOp,
  decompose as decomposeOp,
  removeEvidence as removeEvidenceOp,
  removeNode as removeNodeOp,
  renameNode as renameNodeOp,
  setDecomposition as setDecompositionOp,
  setDetail as setDetailOp,
  setNodeValue as setNodeValueOp,
  setPriority as setPriorityOp,
  setStatus as setStatusOp,
  updateEvidence as updateEvidenceOp,
} from '@/domain/tree';
import type {
  DecompositionType,
  EvidenceItem,
  EvidenceStrength,
  IssueTreeDoc,
  NodeId,
  NodeStatus,
  Priority,
} from '@/domain/types';
import { loadDoc, saveDoc } from '@/services/storage';

const HISTORY_LIMIT = 100;

function initialDoc(): IssueTreeDoc {
  const loaded = loadDoc();
  return recomputeMece(loaded ?? createDoc('Why is this happening?', Date.now()));
}

interface AppState {
  doc: IssueTreeDoc;
  past: IssueTreeDoc[];
  future: IssueTreeDoc[];
  selectedId: NodeId | null;

  select: (id: NodeId | null) => void;
  newDoc: () => void;
  openDoc: (doc: IssueTreeDoc) => void;
  setRootQuestion: (label: string) => void;
  addChild: (parentId: NodeId, label?: string) => void;
  renameNode: (id: NodeId, label: string) => void;
  setDetail: (id: NodeId, detail: string) => void;
  setAmount: (id: NodeId, amount: number | undefined) => void;
  setUnit: (id: NodeId, unit: string) => void;
  setPriority: (id: NodeId, priority: Priority | undefined) => void;
  setStatus: (id: NodeId, status: NodeStatus) => void;
  addEvidence: (
    nodeId: NodeId,
    summary: string,
    supports: boolean,
    strength?: EvidenceStrength
  ) => void;
  removeEvidence: (nodeId: NodeId, evidenceId: string) => void;
  updateEvidence: (nodeId: NodeId, evidenceId: string, patch: Partial<EvidenceItem>) => void;
  setDecomposition: (parentId: NodeId, decomposition: DecompositionType) => void;
  decompose: (parentId: NodeId, decomposition: DecompositionType) => void;
  removeNode: (id: NodeId) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const useStore = create<AppState>((set, get) => {
  /**
   * Run a pure doc transform, then snapshot history, recompute MECE, and
   * persist — the single path every mutation goes through. A no-op transform
   * (same doc reference) is ignored so it neither persists nor adds history.
   */
  function apply(transform: (doc: IssueTreeDoc) => IssueTreeDoc): void {
    set((s) => {
      const transformed = transform(s.doc);
      if (transformed === s.doc) return s;
      const doc = recomputeMece({ ...transformed, updatedAt: Date.now() });
      saveDoc(doc);
      return { doc, past: [...s.past, s.doc].slice(-HISTORY_LIMIT), future: [] };
    });
  }

  return {
    doc: initialDoc(),
    past: [],
    future: [],
    selectedId: null,

    select: (id) => set({ selectedId: id }),
    newDoc: () =>
      set((s) => {
        const doc = recomputeMece(createDoc('Why is this happening?', Date.now()));
        saveDoc(doc);
        return {
          doc,
          past: [...s.past, s.doc].slice(-HISTORY_LIMIT),
          future: [],
          selectedId: null,
        };
      }),
    openDoc: (incoming) =>
      set((s) => {
        const doc = recomputeMece({ ...incoming, updatedAt: Date.now() });
        saveDoc(doc);
        return {
          doc,
          past: [...s.past, s.doc].slice(-HISTORY_LIMIT),
          future: [],
          selectedId: null,
        };
      }),
    setRootQuestion: (label) => apply((doc) => renameNodeOp(doc, doc.rootId, label)),
    addChild: (parentId, label) =>
      apply((doc) => addChildOp(doc, parentId, label ?? 'New issue').doc),
    renameNode: (id, label) => apply((doc) => renameNodeOp(doc, id, label)),
    setDetail: (id, detail) => apply((doc) => setDetailOp(doc, id, detail)),
    setAmount: (id, amount) =>
      apply((doc) => {
        if (amount === undefined) return setNodeValueOp(doc, id, undefined);
        const unit = doc.nodes[id]?.value?.unit;
        return setNodeValueOp(doc, id, unit ? { amount, unit } : { amount });
      }),
    setUnit: (id, unit) =>
      apply((doc) => {
        const current = doc.nodes[id]?.value;
        if (!current) return doc; // a unit needs an amount to attach to
        return setNodeValueOp(
          doc,
          id,
          unit ? { amount: current.amount, unit } : { amount: current.amount }
        );
      }),
    setPriority: (id, priority) => apply((doc) => setPriorityOp(doc, id, priority)),
    setStatus: (id, status) => apply((doc) => setStatusOp(doc, id, status)),
    addEvidence: (nodeId, summary, supports, strength) =>
      apply((doc) => addEvidenceOp(doc, nodeId, createEvidence(summary, supports, strength))),
    removeEvidence: (nodeId, evidenceId) =>
      apply((doc) => removeEvidenceOp(doc, nodeId, evidenceId)),
    updateEvidence: (nodeId, evidenceId, patch) =>
      apply((doc) => updateEvidenceOp(doc, nodeId, evidenceId, patch)),
    setDecomposition: (parentId, decomposition) =>
      apply((doc) => setDecompositionOp(doc, parentId, decomposition)),
    decompose: (parentId, decomposition) =>
      apply((doc) => decomposeOp(doc, parentId, decomposition)),

    removeNode: (id) =>
      set((s) => {
        const transformed = removeNodeOp(s.doc, id);
        if (transformed === s.doc) return s;
        const doc = recomputeMece({ ...transformed, updatedAt: Date.now() });
        saveDoc(doc);
        return {
          doc,
          past: [...s.past, s.doc].slice(-HISTORY_LIMIT),
          future: [],
          selectedId: s.selectedId === id ? null : s.selectedId,
        };
      }),

    undo: () =>
      set((s) => {
        const prev = s.past[s.past.length - 1];
        if (!prev) return s;
        saveDoc(prev);
        return { doc: prev, past: s.past.slice(0, -1), future: [s.doc, ...s.future] };
      }),
    redo: () =>
      set((s) => {
        const next = s.future[0];
        if (!next) return s;
        saveDoc(next);
        return { doc: next, past: [...s.past, s.doc], future: s.future.slice(1) };
      }),
    canUndo: () => get().past.length > 0,
    canRedo: () => get().future.length > 0,
  };
});
