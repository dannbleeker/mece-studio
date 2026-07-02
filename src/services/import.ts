/**
 * Import an issue tree from pasted text, dispatching on format.
 *
 * Scoped to the two formats that make sense for an issue tree:
 *  - **JSON** — a document exported by MECE Studio. Goes through `parseDoc`, so
 *    it runs the schema migration runner (Phase 1) and structural validation;
 *    round-trips with the JSON export.
 *  - **Markdown** — a pasted outline, parsed structurally into a fresh tree.
 *
 * Mirrors the spirit of TP Studio's import dispatch, narrowed to these formats.
 */

import { markdownToDoc } from '@/domain/markdownImport';
import type { IssueTreeDoc } from '@/domain/types';
import { opmlToDoc } from '@/services/opmlImport';
import { parseDoc } from '@/services/storage';

type ImportFormat = 'json' | 'markdown' | 'opml';

export interface ImportedTree {
  doc: IssueTreeDoc;
  format: ImportFormat;
}

/**
 * Parse `text` as an issue tree. Text that looks like a JSON object is read as a
 * document (and rejected if it isn't a valid one); anything else is parsed as a
 * Markdown outline. Returns `null` when neither yields a tree.
 */
export function importText(text: string, now: number): ImportedTree | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('{')) {
    const doc = parseDoc(trimmed);
    return doc ? { doc, format: 'json' } : null;
  }

  // OPML / XML (outliners, mind-mappers): try structured parse; fall through if it
  // isn't valid OPML (so a stray '<' in prose still parses as a Markdown outline).
  if (trimmed.startsWith('<')) {
    const doc = opmlToDoc(trimmed, now);
    if (doc) return { doc, format: 'opml' };
  }

  const doc = markdownToDoc(trimmed, now);
  return doc ? { doc, format: 'markdown' } : null;
}
