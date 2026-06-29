/**
 * Serialize an issue-tree document as JSON — the canonical, round-trippable
 * form that the file open path (`services/fileSystemAccess.ts`) reads back.
 * This is the single source of truth for the tree's on-disk JSON shape; the
 * file-save serializer delegates here.
 */

import type { IssueTreeDoc } from '@/domain/types';

/** The raw document as pretty-printed JSON. */
export function treeToJson(doc: IssueTreeDoc): string {
  return JSON.stringify(doc, null, 2);
}
