// @vitest-environment happy-dom
import 'fake-indexeddb/auto'; // registers a working global `indexedDB` for the round-trip
import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearFileHandle, getFileHandle, setFileHandle } from './fileHandles';
import type { TreeFileHandle } from './fileSystemAccess';

describe('fileHandles without IndexedDB', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('degrades to null / no-op when IndexedDB is unavailable', async () => {
    vi.stubGlobal('indexedDB', undefined);
    expect(await getFileHandle('id')).toBeNull();
    await expect(setFileHandle('id', {} as TreeFileHandle)).resolves.toBeUndefined();
    await expect(clearFileHandle('id')).resolves.toBeUndefined();
  });
});

describe('fileHandles round-trip (IndexedDB)', () => {
  // A stand-in handle — only `name` matters here; IndexedDB structured-clones it.
  const handle = (name: string) => ({ name }) as unknown as TreeFileHandle;

  it('stores, retrieves, overwrites, and clears a handle by document id', async () => {
    await setFileHandle('doc-rt', handle('first.json'));
    expect((await getFileHandle('doc-rt'))?.name).toBe('first.json');

    // A second set overwrites (the store is keyed by doc id).
    await setFileHandle('doc-rt', handle('second.json'));
    expect((await getFileHandle('doc-rt'))?.name).toBe('second.json');

    await clearFileHandle('doc-rt');
    expect(await getFileHandle('doc-rt')).toBeNull();
  });

  it('keeps handles for different documents independent', async () => {
    await setFileHandle('doc-a', handle('a.json'));
    await setFileHandle('doc-b', handle('b.json'));
    expect((await getFileHandle('doc-a'))?.name).toBe('a.json');
    expect((await getFileHandle('doc-b'))?.name).toBe('b.json');
    expect(await getFileHandle('doc-missing')).toBeNull();
  });
});
