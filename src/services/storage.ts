import { migrateToCurrent, type RawDocument } from '@/domain/migrations';
import { DEFAULT_SETTINGS, type Settings } from '@/domain/settings';
import type { IssueTreeDoc } from '@/domain/types';

const LIBRARY_KEY = 'mece-studio:library:v1';
const LEGACY_DOC_KEY = 'mece-studio:doc:v1';
const docKey = (id: string) => `mece-studio:doc:${id}`;
const SETTINGS_KEY = 'mece-studio:settings:v1';
const OPEN_TABS_KEY = 'mece-studio:tabs:v1';
const USER_TEMPLATES_KEY = 'mece-studio:userTemplates:v1';

/** A user-saved reusable template — a tree's structure with instance data stripped. */
export interface UserTemplate {
  id: string;
  name: string;
  doc: IssueTreeDoc;
}

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
  if (
    typeof d.rootId !== 'string' ||
    typeof d.nodes !== 'object' ||
    d.nodes === null ||
    typeof d.splits !== 'object' ||
    d.splits === null
  ) {
    return false;
  }
  // The root must be a real node — a doc whose `rootId` isn't a key in `nodes` is
  // a dead tree (empty canvas, every root-keyed op a no-op), so reject it.
  const rootNode = (d.nodes as Record<string, unknown>)[d.rootId];
  return typeof rootNode === 'object' && rootNode !== null;
}

function isLibrary(value: unknown): value is Library {
  if (typeof value !== 'object' || value === null) return false;
  const l = value as Record<string, unknown>;
  return typeof l.activeId === 'string' && Array.isArray(l.docs);
}

/**
 * Migrate an unvalidated, parsed value up to the current schema, then validate
 * its shape. Returns `null` for anything that isn't an object or fails the
 * structural guard after migration. This is the single seam every document
 * read — localStorage, the legacy key, and file import — passes through.
 */
function coerceDoc(parsed: unknown): IssueTreeDoc | null {
  if (typeof parsed !== 'object' || parsed === null) return null;
  const migrated = migrateToCurrent(parsed as RawDocument);
  return isDoc(migrated) ? migrated : null;
}

/** Read a stored document by key, migrating it before its shape is trusted. */
function readDoc(key: string): IssueTreeDoc | null {
  const s = storage();
  if (!s) return null;
  try {
    const raw = s.getItem(key);
    if (!raw) return null;
    return coerceDoc(JSON.parse(raw));
  } catch {
    return null;
  }
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
    return coerceDoc(JSON.parse(json));
  } catch {
    return null;
  }
}

/** The display name for a document — its root question. */
export function docName(doc: IssueTreeDoc): string {
  return doc.nodes[doc.rootId]?.label?.trim() || 'Untitled tree';
}

export function loadDocById(id: string): IssueTreeDoc | null {
  return readDoc(docKey(id));
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
 * Returns `null` only when there is no saved library at all (a first-ever run —
 * the store then seeds a fresh starter tree). A library the user emptied by
 * deleting every tree is a real, loadable state: it returns with `doc: null` so
 * the store keeps an empty library instead of reseeding a starter.
 */
export function loadWorkspace(): { library: Library; doc: IssueTreeDoc | null } | null {
  const s = storage();
  if (!s) return null;

  let library = loadLibrary();
  if (!library) {
    const legacy = readDoc(LEGACY_DOC_KEY);
    if (legacy) {
      saveDocById(legacy);
      s.removeItem(LEGACY_DOC_KEY);
      library = { activeId: legacy.id, docs: [{ id: legacy.id, name: docName(legacy) }] };
      saveLibrary(library);
    }
  }
  if (!library) return null; // never used → caller seeds the onboarding starter

  // A library the user emptied (deleted every tree) is an intentional empty
  // state, not a cold start — load it as empty rather than reseeding a starter.
  if (library.docs.length === 0) return { library: { activeId: '', docs: [] }, doc: null };

  // Fall back to the first doc if the active id is stale.
  const activeId = library.docs.some((d) => d.id === library.activeId)
    ? library.activeId
    : (library.docs[0]?.id ?? '');
  const doc = loadDocById(activeId);
  if (doc) return { library: { ...library, activeId }, doc };

  // The active blob is unreadable (e.g. a swallowed quota-save left it missing).
  // Returning null here would make the caller reseed and OVERWRITE the library,
  // orphaning every other saved tree — so fall back to any doc that still loads.
  for (const entry of library.docs) {
    const other = loadDocById(entry.id);
    if (other) return { library: { ...library, activeId: entry.id }, doc: other };
  }
  // Nothing loads: keep the library index (don't reseed over it); the caller seeds
  // a scratch doc while the entries survive for a later successful read.
  return { library: { ...library, activeId: '' }, doc: null };
}

/** Load global app settings, merged over defaults so unknown/absent keys degrade gracefully. */
export function loadSettings(): Settings {
  const raw = readJson<Record<string, unknown>>(
    SETTINGS_KEY,
    (v): v is Record<string, unknown> => typeof v === 'object' && v !== null
  );
  if (!raw) return { ...DEFAULT_SETTINGS };
  return {
    sortSiblingsByPriority:
      typeof raw.sortSiblingsByPriority === 'boolean'
        ? raw.sortSiblingsByPriority
        : DEFAULT_SETTINGS.sortSiblingsByPriority,
    strictOverlap:
      typeof raw.strictOverlap === 'boolean' ? raw.strictOverlap : DEFAULT_SETTINGS.strictOverlap,
    formulaTolerance:
      typeof raw.formulaTolerance === 'number' && raw.formulaTolerance > 0
        ? raw.formulaTolerance
        : DEFAULT_SETTINGS.formulaTolerance,
  };
}

export function saveSettings(settings: Settings): void {
  writeJson(SETTINGS_KEY, settings);
}

/** The ids of the trees the user had open in tabs (empty/absent on first run). */
export function loadOpenTabs(): string[] {
  const raw = readJson<unknown[]>(OPEN_TABS_KEY, Array.isArray);
  return raw ? raw.filter((id): id is string => typeof id === 'string') : [];
}

export function saveOpenTabs(ids: string[]): void {
  writeJson(OPEN_TABS_KEY, ids);
}

function isUserTemplateList(v: unknown): v is UserTemplate[] {
  return (
    Array.isArray(v) &&
    v.every(
      (t) =>
        typeof t === 'object' &&
        t !== null &&
        typeof (t as UserTemplate).id === 'string' &&
        typeof (t as UserTemplate).name === 'string' &&
        isDoc((t as UserTemplate).doc)
    )
  );
}

/** The user's saved custom templates (empty on first run). */
export function loadUserTemplates(): UserTemplate[] {
  return readJson(USER_TEMPLATES_KEY, isUserTemplateList) ?? [];
}

export function saveUserTemplates(list: UserTemplate[]): void {
  writeJson(USER_TEMPLATES_KEY, list);
}
