import { nanoid } from 'nanoid';
import { create } from 'zustand';
import { createDoc, createEvidence } from '@/domain/factory';
import { type MeceOptions, recomputeMece } from '@/domain/mece';
import { meceOptions, type Settings } from '@/domain/settings';
import {
  addChild as addChildOp,
  addEvidence as addEvidenceOp,
  decompose as decomposeOp,
  duplicateNode as duplicateNodeOp,
  moveNode as moveNodeOp,
  moveSibling as moveSiblingOp,
  removeEvidence as removeEvidenceOp,
  removeNode as removeNodeOp,
  renameNode as renameNodeOp,
  setAllCollapsed as setAllCollapsedOp,
  setDecomposition as setDecompositionOp,
  setDetail as setDetailOp,
  setNodeValue as setNodeValueOp,
  setOperator as setOperatorOp,
  setPriority as setPriorityOp,
  setStatus as setStatusOp,
  toggleCollapse as toggleCollapseOp,
  updateEvidence as updateEvidenceOp,
} from '@/domain/tree';
import type {
  DecompositionType,
  DocId,
  EvidenceItem,
  EvidenceStrength,
  FormulaOperator,
  IssueTreeDoc,
  NodeId,
  NodeStatus,
  Priority,
} from '@/domain/types';
import {
  docName,
  type LibraryEntry,
  loadDocById,
  loadSettings,
  loadWorkspace,
  removeDocById,
  saveDocById,
  saveLibrary,
  saveSettings,
} from '@/services/storage';

const HISTORY_LIMIT = 100;
const STARTER_QUESTION = 'Why is this happening?';

/** Which top-level surface is showing: the Start workspace shell, or a tree on the canvas. */
type AppView = 'start' | 'workspace';

function freshDoc(options: MeceOptions, question: string = STARTER_QUESTION): IssueTreeDoc {
  return recomputeMece(createDoc(question.trim() || STARTER_QUESTION, Date.now()), options);
}

function entryFor(doc: IssueTreeDoc): LibraryEntry {
  return { id: doc.id, name: docName(doc) };
}

/** Seed the workspace from storage, migrating a legacy single-doc save, or start fresh. */
function initialState(): {
  doc: IssueTreeDoc;
  library: LibraryEntry[];
  activeId: string;
  settings: Settings;
} {
  const settings = loadSettings();
  const options = meceOptions(settings);
  const ws = loadWorkspace();
  if (ws) {
    return {
      doc: recomputeMece(ws.doc, options),
      library: ws.library.docs,
      activeId: ws.library.activeId,
      settings,
    };
  }
  const doc = freshDoc(options);
  saveDocById(doc);
  const library = [entryFor(doc)];
  saveLibrary({ activeId: doc.id, docs: library });
  return { doc, library, activeId: doc.id, settings };
}

/** Keep the active doc's library name in sync with its root question; persist on change. */
function syncLibraryName(library: LibraryEntry[], doc: IssueTreeDoc): LibraryEntry[] {
  const name = docName(doc);
  const existing = library.find((e) => e.id === doc.id);
  if (!existing || existing.name === name) return library;
  const next = library.map((e) => (e.id === doc.id ? { ...e, name } : e));
  saveLibrary({ activeId: doc.id, docs: next });
  return next;
}

/**
 * Make `doc` the active document under `docs`: persist both, reset history +
 * selection, and enter the canvas workspace (every entry point — new / open /
 * switch / delete-and-reopen — opens the tree for editing).
 */
function activate(doc: IssueTreeDoc, docs: LibraryEntry[]) {
  saveDocById(doc);
  saveLibrary({ activeId: doc.id, docs });
  return {
    doc,
    library: docs,
    activeId: doc.id,
    past: [],
    future: [],
    selectedId: null,
    view: 'workspace' as const,
    reviewOpen: false,
  };
}

interface AppState {
  doc: IssueTreeDoc;
  /** All saved trees (for the document picker). */
  library: LibraryEntry[];
  activeId: string;
  past: IssueTreeDoc[];
  future: IssueTreeDoc[];
  selectedId: NodeId | null;
  settings: Settings;
  /** Which top-level surface is showing: the Start shell or a tree on the canvas. */
  view: AppView;
  /** Editor right dock shows the tree-level MECE review panel (XOR the inspector). */
  reviewOpen: boolean;
  /** Bumped by `locate` to ask the canvas to centre the (now-selected) node. */
  locateNonce: number;

  select: (id: NodeId | null) => void;
  setView: (view: AppView) => void;
  setReviewOpen: (open: boolean) => void;
  /** Select a node and ask the canvas to centre it (used by the review dock). */
  locate: (id: NodeId) => void;
  setSettings: (patch: Partial<Settings>) => void;
  /** Create a fresh tree (optionally seeding the root question) and open it. */
  newDoc: (question?: string) => void;
  switchDoc: (id: string) => void;
  deleteDoc: (id: string) => void;
  /** Rename a tree (its root question) by id, without leaving the current view. */
  renameDoc: (id: string, label: string) => void;
  /** Copy a whole tree into the library as a new document, without opening it. */
  duplicateDoc: (id: string) => void;
  openDoc: (doc: IssueTreeDoc) => void;
  setRootQuestion: (label: string) => void;
  addChild: (parentId: NodeId, label?: string) => void;
  renameNode: (id: NodeId, label: string) => void;
  setDetail: (id: NodeId, detail: string) => void;
  setAmount: (id: NodeId, amount: number | undefined) => void;
  setUnit: (id: NodeId, unit: string) => void;
  setPriority: (id: NodeId, priority: Priority | undefined) => void;
  setStatus: (id: NodeId, status: NodeStatus) => void;
  toggleCollapse: (id: NodeId) => void;
  collapseAll: () => void;
  expandAll: () => void;
  addEvidence: (
    nodeId: NodeId,
    summary: string,
    supports: boolean,
    strength?: EvidenceStrength
  ) => void;
  removeEvidence: (nodeId: NodeId, evidenceId: string) => void;
  updateEvidence: (nodeId: NodeId, evidenceId: string, patch: Partial<EvidenceItem>) => void;
  setDecomposition: (parentId: NodeId, decomposition: DecompositionType) => void;
  setOperator: (parentId: NodeId, operator: FormulaOperator) => void;
  decompose: (parentId: NodeId, decomposition: DecompositionType) => void;
  moveNode: (id: NodeId, newParentId: NodeId) => void;
  moveSibling: (id: NodeId, direction: 'up' | 'down') => void;
  duplicateNode: (id: NodeId) => void;
  removeNode: (id: NodeId) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const useStore = create<AppState>((set, get) => {
  /**
   * Run a pure doc transform on the active doc, then snapshot history, recompute
   * MECE, and persist — the single path every mutation goes through. A no-op
   * transform (same doc reference) is ignored.
   */
  function apply(
    transform: (doc: IssueTreeDoc) => IssueTreeDoc,
    extras?: (newDoc: IssueTreeDoc, prev: AppState) => Partial<AppState>
  ): void {
    set((s) => {
      const transformed = transform(s.doc);
      if (transformed === s.doc) return s;
      const doc = recomputeMece({ ...transformed, updatedAt: Date.now() }, meceOptions(s.settings));
      saveDocById(doc);
      return {
        doc,
        library: syncLibraryName(s.library, doc),
        past: [...s.past, s.doc].slice(-HISTORY_LIMIT),
        future: [],
        ...extras?.(doc, s),
      };
    });
  }

  const init = initialState();

  return {
    doc: init.doc,
    library: init.library,
    activeId: init.activeId,
    settings: init.settings,
    past: [],
    future: [],
    selectedId: null,
    // Land on the Start shell; opening or creating a tree switches to 'workspace'.
    view: 'start',
    reviewOpen: false,
    locateNonce: 0,

    select: (id) => set({ selectedId: id }),
    setView: (view) => set({ view }),
    setReviewOpen: (open) => set({ reviewOpen: open }),
    locate: (id) => set((s) => ({ selectedId: id, locateNonce: s.locateNonce + 1 })),
    setSettings: (patch) =>
      set((s) => {
        const settings = { ...s.settings, ...patch };
        saveSettings(settings);
        // Re-evaluate the active doc's MECE under the new options (tolerance / overlap).
        const doc = recomputeMece(s.doc, meceOptions(settings));
        saveDocById(doc);
        return { settings, doc };
      }),

    newDoc: (question) =>
      set((s) => {
        const doc = freshDoc(meceOptions(s.settings), question);
        return activate(doc, [...s.library, entryFor(doc)]);
      }),

    switchDoc: (id) =>
      set((s) => {
        if (id === s.activeId) return s;
        const target = loadDocById(id);
        if (!target) return s;
        return activate(recomputeMece(target, meceOptions(s.settings)), s.library);
      }),

    deleteDoc: (id) =>
      set((s) => {
        if (!s.library.some((e) => e.id === id)) return s;
        removeDocById(id);
        const docs = s.library.filter((e) => e.id !== id);
        const opts = meceOptions(s.settings);

        // Deleting a non-active doc: just drop it from the library.
        if (id !== s.activeId) {
          saveLibrary({ activeId: s.activeId, docs });
          return { library: docs };
        }
        // Deleting the active doc: open another, or seed a fresh one if none remain.
        if (docs.length === 0) {
          const doc = freshDoc(opts);
          return activate(doc, [entryFor(doc)]);
        }
        return activate(
          recomputeMece(loadDocById(docs[0]?.id ?? '') ?? freshDoc(opts), opts),
          docs
        );
      }),

    renameDoc: (id, label) =>
      set((s) => {
        const name = label.trim();
        if (!name) return s;
        const base = id === s.activeId ? s.doc : loadDocById(id);
        if (!base) return s;
        const renamed = renameNodeOp(base, base.rootId, name);
        if (renamed === base) return s; // unchanged → no-op
        const doc = { ...renamed, updatedAt: Date.now() };
        saveDocById(doc);
        const library = s.library.map((e) => (e.id === id ? { ...e, name: docName(doc) } : e));
        saveLibrary({ activeId: s.activeId, docs: library });
        // Reflect the rename in the live doc too if it's the one currently open.
        return id === s.activeId ? { doc, library } : { library };
      }),

    duplicateDoc: (id) =>
      set((s) => {
        const base = id === s.activeId ? s.doc : loadDocById(id);
        if (!base) return s;
        const now = Date.now();
        const cloned = recomputeMece(
          { ...base, id: nanoid() as DocId, createdAt: now, updatedAt: now },
          meceOptions(s.settings)
        );
        const copy = renameNodeOp(cloned, cloned.rootId, `${docName(cloned)} (copy)`);
        saveDocById(copy);
        const library = [...s.library, entryFor(copy)];
        saveLibrary({ activeId: s.activeId, docs: library });
        return { library };
      }),

    openDoc: (incoming) =>
      set((s) => {
        // Import as a NEW document (fresh id) so it can't clobber an existing one.
        const doc = recomputeMece(
          { ...incoming, id: nanoid() as DocId, updatedAt: Date.now() },
          meceOptions(s.settings)
        );
        return activate(doc, [...s.library, entryFor(doc)]);
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
    toggleCollapse: (id) => apply((doc) => toggleCollapseOp(doc, id)),
    collapseAll: () => apply((doc) => setAllCollapsedOp(doc, true)),
    expandAll: () => apply((doc) => setAllCollapsedOp(doc, false)),
    addEvidence: (nodeId, summary, supports, strength) =>
      apply((doc) => addEvidenceOp(doc, nodeId, createEvidence(summary, supports, strength))),
    removeEvidence: (nodeId, evidenceId) =>
      apply((doc) => removeEvidenceOp(doc, nodeId, evidenceId)),
    updateEvidence: (nodeId, evidenceId, patch) =>
      apply((doc) => updateEvidenceOp(doc, nodeId, evidenceId, patch)),
    setDecomposition: (parentId, decomposition) =>
      apply((doc) => setDecompositionOp(doc, parentId, decomposition)),
    setOperator: (parentId, operator) => apply((doc) => setOperatorOp(doc, parentId, operator)),
    decompose: (parentId, decomposition) =>
      apply((doc) => decomposeOp(doc, parentId, decomposition)),
    moveNode: (id, newParentId) => apply((doc) => moveNodeOp(doc, id, newParentId)),
    moveSibling: (id, direction) => apply((doc) => moveSiblingOp(doc, id, direction)),
    // Both go through `apply` (the single mutation path); they differ only in the
    // selection side-effect — duplicate selects the copy, remove clears a deleted
    // selection — expressed via apply's `extras`.
    duplicateNode: (id) => {
      let newId: NodeId | null = null;
      apply(
        (doc) => {
          const result = duplicateNodeOp(doc, id);
          newId = result.newId;
          return result.doc;
        },
        () => (newId ? { selectedId: newId } : {})
      );
    },

    removeNode: (id) =>
      apply(
        (doc) => removeNodeOp(doc, id),
        (_doc, prev) => (prev.selectedId === id ? { selectedId: null } : {})
      ),

    undo: () =>
      set((s) => {
        const prev = s.past[s.past.length - 1];
        if (!prev) return s;
        saveDocById(prev);
        return {
          doc: prev,
          library: syncLibraryName(s.library, prev),
          past: s.past.slice(0, -1),
          future: [s.doc, ...s.future],
        };
      }),
    redo: () =>
      set((s) => {
        const next = s.future[0];
        if (!next) return s;
        saveDocById(next);
        return {
          doc: next,
          library: syncLibraryName(s.library, next),
          past: [...s.past, s.doc],
          future: s.future.slice(1),
        };
      }),
    canUndo: () => get().past.length > 0,
    canRedo: () => get().future.length > 0,
  };
});
