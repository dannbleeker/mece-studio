import { useMemo } from 'react';
import { recomputeMece } from '@/domain/mece';
import { meceOptions } from '@/domain/settings';
import type { IssueTreeDoc } from '@/domain/types';
import { type LibraryEntry, loadDocById } from '@/services/storage';
import { useStore } from '@/store';

export interface LibraryDoc {
  entry: LibraryEntry;
  doc: IssueTreeDoc;
}

/**
 * Every tree in the library as a full, freshly-evaluated document: the active one
 * comes straight from the store (authoritative + already recomputed), the rest
 * from localStorage — each re-evaluated under the CURRENT settings so a card's
 * MECE status matches what the canvas would show. Memoised on the inputs.
 */
export function useLibraryDocs(): LibraryDoc[] {
  const library = useStore((s) => s.library);
  const activeDoc = useStore((s) => s.doc);
  const settings = useStore((s) => s.settings);
  return useMemo(() => {
    const options = meceOptions(settings);
    const out: LibraryDoc[] = [];
    for (const entry of library) {
      const raw = entry.id === activeDoc.id ? activeDoc : loadDocById(entry.id);
      if (raw) out.push({ entry, doc: recomputeMece(raw, options) });
    }
    return out;
  }, [library, activeDoc, settings]);
}
