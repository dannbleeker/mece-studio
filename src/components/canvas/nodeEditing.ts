import { createContext, useContext } from 'react';

/** Inline label-editing state shared from the Canvas down to each node. */
export interface NodeEditing {
  editingId: string | null;
  start: (id: string) => void;
  commit: (id: string, label: string) => void;
  cancel: () => void;
}

const ignore = () => undefined;
const NOOP: NodeEditing = { editingId: null, start: ignore, commit: ignore, cancel: ignore };

export const NodeEditingContext = createContext<NodeEditing>(NOOP);
export const useNodeEditing = () => useContext(NodeEditingContext);
