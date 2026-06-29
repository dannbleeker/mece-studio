import type { IssueTreeDoc, NodeId } from './types';

/**
 * In-tree find. A node matches when its label contains the query as a
 * case-insensitive substring; a blank query matches nothing (so the canvas
 * doesn't ring every node). Pure, so it's unit-testable and shared by the
 * canvas projection (per-node highlight) and any future search panel.
 */

/** Whether `label` matches `query` (case-insensitive substring; blank → false). */
export function matchesQuery(label: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  return q !== '' && label.toLowerCase().includes(q);
}

/** The ids of every node whose label matches `query` (empty for a blank query). */
export function searchNodes(doc: IssueTreeDoc, query: string): NodeId[] {
  if (query.trim() === '') return [];
  return (Object.keys(doc.nodes) as NodeId[]).filter((id) =>
    matchesQuery(doc.nodes[id]?.label ?? '', query)
  );
}
