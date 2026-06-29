// @vitest-environment happy-dom
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

describe('fileHandles round-trip', () => {
  // happy-dom may not implement IndexedDB; skip the round-trip rather than fail.
  const hasIdb = typeof indexedDB !== 'undefined';

  it.runIf(hasIdb)('stores, retrieves, and clears a handle by document id', async () => {
    const handle = { name: 'tree.json' } as unknown as TreeFileHandle;
    await setFileHandle('doc-rt', handle);
    expect((await getFileHandle('doc-rt'))?.name).toBe('tree.json');
    await clearFileHandle('doc-rt');
    expect(await getFileHandle('doc-rt')).toBeNull();
  });
});
