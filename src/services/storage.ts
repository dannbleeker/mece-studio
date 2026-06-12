import type { IssueTreeDoc } from '@/domain/types';

const LIBRARY_KEY = 'mece-studio:library:v1';
const LEGACY_DOC_KEY = 'mece-studio:doc:v1';
const docKey = (id: string) => `mece-studio:doc:${id}`;

/** One entry in the document library — enough to list it without loading it. */
export interface LibraryEntry {
  id: string;
  name: string;
}

/** The set of saved trees and which one is open. */
export interface Library {
  activeId: string;
  docs: LibraryEntry[];
}

/** localStorage if it's available (guarded for SSR / node test env). */
function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** Light structural guard — enough to reject obviously stale/corrupt JSON. */
function isDoc(value: unknown): value is IssueTreeDoc {
  if (typeof value !== 'object' || value === null) return false;
  const d = value as Record<string, unknown>;
  return (
    typeof d.rootId === 'string' &&
    typeof d.nodes === 'object' &&
    d.nodes !== null &&
    typeof d.splits === 'object' &&
    d.splits !== null
  );
}

function isLibrary(value: unknown): value is Library {
  if (typeof value !== 'object' || value === null) return false;
  const l = value as Record<string, unknown>;
  return typeof l.activeId === 'string' && Array.isArray(l.docs);
}

function readJson<T>(key: string, guard: (v: unknown) => v is T): T | null {
  const s = storage();
  if (!s) return null;
  try {
    const raw = s.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return guard(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  const s = storage();
  if (!s) return;
  try {
    s.setItem(key, JSON.stringify(value));
  } catch {
    // Quota / serialization errors are non-fatal for a local-first app.
  }
}

/** Parse + validate a JSON string as a document (for file import). */
export function parseDoc(json: string): IssueTreeDoc | null {
  try {
    const parsed: unknown = JSON.parse(json);
    return isDoc(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** The display name for a document — its root question. */
export function docName(doc: IssueTreeDoc): string {
  return doc.nodes[doc.rootId]?.label?.trim() || 'Untitled tree';
}

export function loadDocById(id: string): IssueTreeDoc | null {
  return readJson(docKey(id), isDoc);
}

export function saveDocById(doc: IssueTreeDoc): void {
  writeJson(docKey(doc.id), doc);
}

export function removeDocById(id: string): void {
  storage()?.removeItem(docKey(id));
}

function loadLibrary(): Library | null {
  return readJson(LIBRARY_KEY, isLibrary);
}

export function saveLibrary(library: Library): void {
  writeJson(LIBRARY_KEY, library);
}

/**
 * Load the persisted library and its active document, migrating a legacy
 * single-document save (`mece-studio:doc:v1`) into the library on first run.
 * Returns null if there is nothing usable stored (the store then seeds a fresh tree).
 */
export function loadWorkspace(): { library: Library; doc: IssueTreeDoc } | null {
  const s = storage();
  if (!s) return null;

  let library = loadLibrary();
  if (!library) {
    const legacy = readJson(LEGACY_DOC_KEY, isDoc);
    if (legacy) {
      saveDocById(legacy);
      s.removeItem(LEGACY_DOC_KEY);
      library = { activeId: legacy.id, docs: [{ id: legacy.id, name: docName(legacy) }] };
      saveLibrary(library);
    }
  }
  if (!library || library.docs.length === 0) return null;

  // Fall back to the first doc if the active id is stale.
  const activeId = library.docs.some((d) => d.id === library.activeId)
    ? library.activeId
    : (library.docs[0]?.id ?? '');
  const doc = loadDocById(activeId);
  if (!doc) return null;
  return { library: { ...library, activeId }, doc };
}
