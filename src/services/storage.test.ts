import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDoc } from '../domain/factory';
import {
  docName,
  loadDocById,
  loadSettings,
  loadWorkspace,
  parseDoc,
  removeDocById,
  saveDocById,
  saveLibrary,
  saveSettings,
} from './storage';

// In-memory localStorage so the persistence paths run in the node test env.
function makeLocalStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    clear: () => m.clear(),
    getItem: (k) => (m.has(k) ? (m.get(k) as string) : null),
    key: (i) => Array.from(m.keys())[i] ?? null,
    removeItem: (k) => {
      m.delete(k);
    },
    setItem: (k, v) => {
      m.set(k, String(v));
    },
  };
}

beforeEach(() => vi.stubGlobal('localStorage', makeLocalStorage()));
afterEach(() => vi.unstubAllGlobals());

describe('storage', () => {
  it('saves, loads, and removes a document by id', () => {
    const doc = createDoc('Q', 1);
    saveDocById(doc);
    expect(loadDocById(doc.id)?.rootId).toBe(doc.rootId);
    removeDocById(doc.id);
    expect(loadDocById(doc.id)).toBeNull();
  });

  it('persists and restores the workspace (library + active doc)', () => {
    const doc = createDoc('Root Q', 1);
    saveDocById(doc);
    saveLibrary({ activeId: doc.id, docs: [{ id: doc.id, name: docName(doc) }] });
    const ws = loadWorkspace();
    expect(ws?.doc?.rootId).toBe(doc.rootId);
    expect(ws?.library.docs).toHaveLength(1);
    expect(ws?.library.activeId).toBe(doc.id);
  });

  it('falls back to the first doc when the active id is stale', () => {
    const doc = createDoc('Q', 1);
    saveDocById(doc);
    saveLibrary({ activeId: 'gone', docs: [{ id: doc.id, name: 'Q' }] });
    expect(loadWorkspace()?.library.activeId).toBe(doc.id);
  });

  it('returns null when nothing is stored', () => {
    expect(loadWorkspace()).toBeNull();
  });

  it('loads an emptied library as an empty state, not a reseeded starter', () => {
    saveLibrary({ activeId: '', docs: [] });
    const ws = loadWorkspace();
    expect(ws).not.toBeNull();
    expect(ws?.library.docs).toHaveLength(0);
    expect(ws?.doc).toBeNull();
  });

  it('migrates a legacy single-document save into the library', () => {
    const legacy = createDoc('Legacy tree', 1);
    localStorage.setItem('mece-studio:doc:v1', JSON.stringify(legacy));
    const ws = loadWorkspace();
    expect(ws?.doc?.rootId).toBe(legacy.rootId);
    expect(ws?.library.docs).toHaveLength(1);
    expect(ws?.library.docs[0]?.id).toBe(legacy.id);
    expect(localStorage.getItem('mece-studio:doc:v1')).toBeNull(); // legacy key cleared
    expect(loadDocById(legacy.id)?.rootId).toBe(legacy.rootId); // re-saved under its own key
  });

  it('parses a valid document and rejects junk', () => {
    const doc = createDoc('Q', 1);
    expect(parseDoc(JSON.stringify(doc))?.rootId).toBe(doc.rootId);
    expect(parseDoc('{"not":"a doc"}')).toBeNull();
    expect(parseDoc('null')).toBeNull(); // parses to null → rejected by the null guard
    expect(parseDoc('not json')).toBeNull();
  });

  it('round-trips settings and falls back to defaults for bad values', () => {
    saveSettings({ sortSiblingsByPriority: true, strictOverlap: false, formulaTolerance: 0.02 });
    const s = loadSettings();
    expect(s.sortSiblingsByPriority).toBe(true);
    expect(s.formulaTolerance).toBe(0.02);

    localStorage.setItem('mece-studio:settings:v1', JSON.stringify({ formulaTolerance: 'bad' }));
    expect(loadSettings().formulaTolerance).toBe(0.005);
    expect(loadSettings().sortSiblingsByPriority).toBe(false);
  });

  it('names a document by its root label, with a blank fallback', () => {
    expect(docName(createDoc('My question', 1))).toBe('My question');
    expect(docName(createDoc('   ', 1))).toBe('Untitled tree');
  });
});
