import { includesText } from './collation';
import type { IssueTreeDoc, LocaleCode, NodeId } from './types';

/**
 * In-tree find. A node matches when its label contains the query, compared in
 * the active locale rather than by raw code point — so a Danish user searching
 * "ø" matches "Øst" and, correctly, does *not* match "Ost". A blank query
 * matches nothing (so the canvas doesn't ring every node). Pure, so it's
 * unit-testable and shared by the canvas projection (per-node highlight) and any
 * future search panel.
 */

/** Whether `label` matches `query` in `locale` (accent/case-insensitive; blank → false). */
export function matchesQuery(label: string, query: string, locale: LocaleCode): boolean {
  return includesText(locale, label, query.trim());
}

/** The ids of every node whose label matches `query` (empty for a blank query). */
export function searchNodes(doc: IssueTreeDoc, query: string, locale: LocaleCode): NodeId[] {
  if (query.trim() === '') return [];
  return (Object.keys(doc.nodes) as NodeId[]).filter((id) =>
    matchesQuery(doc.nodes[id]?.label ?? '', query, locale)
  );
}
