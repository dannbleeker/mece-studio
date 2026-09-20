import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { __resetPersistentStorageForTest, requestPersistentStorage } from './persistentStorage';

/** Minimal StorageManager stand-in; the node env has no `navigator.storage`. */
const stubStorage = (storage: unknown): void => {
  vi.stubGlobal('navigator', { storage });
};

beforeEach(() => __resetPersistentStorageForTest());
afterEach(() => vi.unstubAllGlobals());

describe('requestPersistentStorage', () => {
  it("returns 'unsupported' without a navigator", async () => {
    vi.stubGlobal('navigator', undefined);
    expect(await requestPersistentStorage()).toBe('unsupported');
  });

  it("returns 'unsupported' when the Storage API is absent", async () => {
    stubStorage(undefined);
    expect(await requestPersistentStorage()).toBe('unsupported');
  });

  it("returns 'unsupported' when persist() is missing (older Safari)", async () => {
    stubStorage({ persisted: async () => false });
    expect(await requestPersistentStorage()).toBe('unsupported');
  });

  it("returns 'already-persisted' without re-requesting", async () => {
    const persist = vi.fn(async () => true);
    stubStorage({ persisted: async () => true, persist });
    expect(await requestPersistentStorage()).toBe('already-persisted');
    expect(persist).not.toHaveBeenCalled();
  });

  it("returns 'persisted' when the browser grants the request", async () => {
    stubStorage({ persisted: async () => false, persist: async () => true });
    expect(await requestPersistentStorage()).toBe('persisted');
  });

  it("returns 'denied' when the browser declines", async () => {
    stubStorage({ persisted: async () => false, persist: async () => false });
    expect(await requestPersistentStorage()).toBe('denied');
  });

  it("returns 'unsupported' rather than throwing when persisted() rejects", async () => {
    stubStorage({
      persisted: async () => {
        throw new Error('sandboxed');
      },
      persist: async () => true,
    });
    await expect(requestPersistentStorage()).resolves.toBe('unsupported');
  });

  it("returns 'unsupported' rather than throwing when persist() rejects", async () => {
    stubStorage({
      persisted: async () => false,
      persist: async () => {
        throw new Error('sandboxed');
      },
    });
    await expect(requestPersistentStorage()).resolves.toBe('unsupported');
  });

  it('is idempotent — repeat calls share one round-trip through the API', async () => {
    const persisted = vi.fn(async () => false);
    const persist = vi.fn(async () => true);
    stubStorage({ persisted, persist });
    const [a, b] = await Promise.all([requestPersistentStorage(), requestPersistentStorage()]);
    expect(await requestPersistentStorage()).toBe('persisted');
    expect([a, b]).toEqual(['persisted', 'persisted']);
    expect(persisted).toHaveBeenCalledTimes(1);
    expect(persist).toHaveBeenCalledTimes(1);
  });
});
