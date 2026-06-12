import { beforeEach, describe, expect, it } from 'vitest';
import { createDoc } from '@/domain/factory';
import { docName, loadWorkspace, parseDoc, saveDocById, saveLibrary } from '@/services/storage';

describe('parseDoc', () => {
  it('round-trips a valid document', () => {
    const doc = createDoc('Why is revenue down?', 1);
    const parsed = parseDoc(JSON.stringify(doc));
    expect(parsed?.rootId).toBe(doc.rootId);
  });

  it('rejects malformed JSON', () => {
    expect(parseDoc('{ not json')).toBeNull();
  });

  it('rejects JSON that is not a document', () => {
    expect(parseDoc(JSON.stringify({ foo: 1 }))).toBeNull();
    expect(parseDoc(JSON.stringify(null))).toBeNull();
  });
});

describe('workspace storage', () => {
  beforeEach(() => {
    const mem = new Map<string, string>();
    globalThis.localStorage = {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => {
        mem.set(k, v);
      },
      removeItem: (k: string) => {
        mem.delete(k);
      },
      clear: () => mem.clear(),
      key: () => null,
      length: 0,
    } as Storage;
  });

  it('returns null when nothing is stored', () => {
    expect(loadWorkspace()).toBeNull();
  });

  it('round-trips a library + its active doc', () => {
    const doc = createDoc('Q', 1);
    saveDocById(doc);
    saveLibrary({ activeId: doc.id, docs: [{ id: doc.id, name: docName(doc) }] });

    const ws = loadWorkspace();
    expect(ws?.doc.id).toBe(doc.id);
    expect(ws?.library.activeId).toBe(doc.id);
    expect(ws?.library.docs).toHaveLength(1);
  });

  it('migrates a legacy single-doc save into a library', () => {
    const doc = createDoc('Legacy question', 1);
    localStorage.setItem('mece-studio:doc:v1', JSON.stringify(doc));

    const ws = loadWorkspace();
    expect(ws?.doc.id).toBe(doc.id);
    expect(ws?.library.docs[0]?.name).toBe('Legacy question');
    expect(localStorage.getItem('mece-studio:doc:v1')).toBeNull(); // legacy key migrated away
    expect(loadWorkspace()?.doc.id).toBe(doc.id); // second load reads the migrated library
  });

  it('docName uses the root question', () => {
    expect(docName(createDoc('Why?', 1))).toBe('Why?');
  });
});
