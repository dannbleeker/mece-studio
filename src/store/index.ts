import { create } from 'zustand';
import { createDoc } from '@/domain/factory';
import type { IssueTreeDoc } from '@/domain/types';

interface AppState {
  doc: IssueTreeDoc;
  /** Replace the root question's label. */
  setRootQuestion: (label: string) => void;
}

export const useStore = create<AppState>((set) => ({
  doc: createDoc('Why is this happening?', Date.now()),
  setRootQuestion: (label) =>
    set((s) => {
      const root = s.doc.nodes[s.doc.rootId];
      return {
        doc: {
          ...s.doc,
          nodes: { ...s.doc.nodes, [s.doc.rootId]: { ...root, label } },
          updatedAt: Date.now(),
        },
      };
    }),
}));
