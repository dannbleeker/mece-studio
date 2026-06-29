/**
 * Persist a File System Access handle per document, so reopening a tree and
 * pressing "Save" can write straight back to the file it came from — even
 * across reloads.
 *
 * Handles are live objects that survive a structured clone but not JSON, so
 * they can't live in localStorage; we keep them in IndexedDB keyed by document
 * id. Every operation is best-effort: if IndexedDB is unavailable (private
 * mode, SSR, the node test env) the helpers degrade to a no-op / `null` rather
 * than throwing. Mirrors TP Studio's `storage/fileHandles.ts`.
 */

import type { TreeFileHandle } from '@/services/fileSystemAccess';

const DB_NAME = 'mece-studio';
const DB_VERSION = 1;
const STORE = 'file-handles';

function idb(): IDBFactory | null {
  try {
    return typeof indexedDB === 'undefined' ? null : indexedDB;
  } catch {
    return null;
  }
}

/** Open (and lazily create) the handle store. Resolves to `null` if unavailable. */
function openDb(): Promise<IDBDatabase | null> {
  const factory = idb();
  if (!factory) return Promise.resolve(null);
  return new Promise((resolve) => {
    let request: IDBOpenDBRequest;
    try {
      request = factory.open(DB_NAME, DB_VERSION);
    } catch {
      resolve(null);
      return;
    }
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });
}

/** Run `body` within a transaction on the handle store, resolving its request. */
function withStore<T>(
  mode: IDBTransactionMode,
  body: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T | null> {
  return openDb().then(
    (db) =>
      new Promise<T | null>((resolve) => {
        if (!db) {
          resolve(null);
          return;
        }
        try {
          const request = body(db.transaction(STORE, mode).objectStore(STORE));
          request.onsuccess = () => resolve(request.result ?? null);
          request.onerror = () => resolve(null);
        } catch {
          resolve(null);
        } finally {
          db.close();
        }
      })
  );
}

/** The handle previously associated with `docId`, or `null` if none/unavailable. */
export async function getFileHandle(docId: string): Promise<TreeFileHandle | null> {
  const result = await withStore<TreeFileHandle>('readonly', (store) => store.get(docId));
  return result;
}

/** Remember `handle` as the file backing `docId`. No-op if IndexedDB is unavailable. */
export async function setFileHandle(docId: string, handle: TreeFileHandle): Promise<void> {
  await withStore('readwrite', (store) => store.put(handle, docId));
}

/** Forget any handle associated with `docId` (e.g. when the tree is deleted). */
export async function clearFileHandle(docId: string): Promise<void> {
  await withStore('readwrite', (store) => store.delete(docId));
}
