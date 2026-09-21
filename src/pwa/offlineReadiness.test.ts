import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { __resetOfflineReadinessForTest, checkOfflineReadiness } from './offlineReadiness';

/** A Workbox-shaped precache holding `count` entries. */
const cachesWith = (count: number, name = 'workbox-precache-v2-https://mece.test/') => ({
  keys: async () => [name],
  open: async () => ({ keys: async () => Array.from({ length: count }, (_, i) => `/asset-${i}`) }),
});

const stubEnv = (opts: {
  registration?: unknown;
  caches?: unknown;
  online?: boolean;
  serviceWorker?: unknown;
}): void => {
  vi.stubGlobal('navigator', {
    onLine: opts.online ?? true,
    serviceWorker:
      'serviceWorker' in opts
        ? opts.serviceWorker
        : { getRegistration: async () => opts.registration },
  });
  vi.stubGlobal('caches', opts.caches);
};

/** An installed, activated registration whose update() we can count. */
const activeRegistration = () => {
  const update = vi.fn(async () => {});
  return { reg: { active: {}, update }, update };
};

beforeEach(() => __resetOfflineReadinessForTest());
afterEach(() => vi.unstubAllGlobals());

describe('checkOfflineReadiness', () => {
  it("reports 'unsupported' without a Service Worker API", async () => {
    stubEnv({ serviceWorker: undefined, caches: cachesWith(26) });
    expect(await checkOfflineReadiness()).toEqual({
      worker: 'unsupported',
      precacheEntries: null,
      ready: false,
      repairRequested: false,
    });
  });

  it("reports 'none' with no registration, and does not try to repair", async () => {
    stubEnv({ registration: undefined, caches: cachesWith(0) });
    const result = await checkOfflineReadiness();
    expect(result.worker).toBe('none');
    expect(result.ready).toBe(false);
    expect(result.repairRequested).toBe(false);
  });

  it('is ready when an active worker sits over a populated precache', async () => {
    const { reg, update } = activeRegistration();
    stubEnv({ registration: reg, caches: cachesWith(26) });
    expect(await checkOfflineReadiness()).toEqual({
      worker: 'active',
      precacheEntries: 26,
      ready: true,
      repairRequested: false,
    });
    expect(update).not.toHaveBeenCalled();
  });

  it('repairs exactly once when the precache was wiped under an active worker', async () => {
    const { reg, update } = activeRegistration();
    stubEnv({ registration: reg, caches: cachesWith(0) });
    const first = await checkOfflineReadiness();
    expect(first).toMatchObject({ worker: 'active', precacheEntries: 0, ready: false });
    expect(first.repairRequested).toBe(true);
    expect(update).toHaveBeenCalledTimes(1);

    // Same session, still broken: report it, but never spin on update().
    const second = await checkOfflineReadiness();
    expect(second.repairRequested).toBe(false);
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('treats a missing precache the same as an empty one', async () => {
    const { reg, update } = activeRegistration();
    stubEnv({
      registration: reg,
      caches: {
        keys: async () => ['some-other-cache'],
        open: async () => ({ keys: async () => ['/x'] }),
      },
    });
    const result = await checkOfflineReadiness();
    expect(result).toMatchObject({ precacheEntries: 0, ready: false, repairRequested: true });
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('does not repair while the worker is still installing', async () => {
    const update = vi.fn(async () => {});
    stubEnv({ registration: { active: null, update }, caches: cachesWith(0) });
    const result = await checkOfflineReadiness();
    expect(result).toMatchObject({ worker: 'pending', ready: false, repairRequested: false });
    expect(update).not.toHaveBeenCalled();
  });

  it('touches nothing on the network while offline', async () => {
    const { reg, update } = activeRegistration();
    stubEnv({ registration: reg, caches: cachesWith(0), online: false });
    const result = await checkOfflineReadiness();
    expect(result).toMatchObject({ worker: 'active', precacheEntries: 0, repairRequested: false });
    expect(update).not.toHaveBeenCalled();
  });

  it('reports null entries and stays hands-off when Cache Storage rejects', async () => {
    const { reg, update } = activeRegistration();
    stubEnv({
      registration: reg,
      caches: {
        keys: async () => {
          throw new Error('blocked by policy');
        },
      },
    });
    const result = await checkOfflineReadiness();
    expect(result).toMatchObject({
      worker: 'active',
      precacheEntries: null,
      ready: false,
      repairRequested: false,
    });
    expect(update).not.toHaveBeenCalled();
  });

  it('reports null entries with no Cache Storage API at all', async () => {
    const { reg } = activeRegistration();
    stubEnv({ registration: reg, caches: undefined });
    expect((await checkOfflineReadiness()).precacheEntries).toBeNull();
  });

  it('never throws when getRegistration() rejects', async () => {
    stubEnv({
      serviceWorker: {
        getRegistration: async () => {
          throw new Error('blocked by policy');
        },
      },
      caches: cachesWith(26),
    });
    await expect(checkOfflineReadiness()).resolves.toMatchObject({ worker: 'none' });
  });

  it('swallows a rejecting update() rather than failing the boot', async () => {
    const update = vi.fn(async () => {
      throw new Error('network');
    });
    stubEnv({ registration: { active: {}, update }, caches: cachesWith(0) });
    await expect(checkOfflineReadiness()).resolves.toMatchObject({ repairRequested: true });
    expect(update).toHaveBeenCalledTimes(1);
  });

  // The repair calls registration.update(), which only reinstalls when the fetched
  // sw.js differs byte-for-byte from the running one. On an origin that has not
  // redeployed since the cache was wiped it completes having done nothing — the
  // exact shape of the damage the repair targets — so the reading must come from
  // a second look at the cache, not from the assumption that the attempt worked.
  it('reports the precache as still empty when the repair changes nothing', async () => {
    const { reg, update } = activeRegistration();
    stubEnv({ registration: reg, caches: cachesWith(0) });
    const result = await checkOfflineReadiness();
    expect(update).toHaveBeenCalledTimes(1);
    expect(result.repairRequested).toBe(true);
    expect(result.precacheEntries).toBe(0);
    expect(result.ready).toBe(false);
  });

  it('reports the repopulated count when the repair does reinstall', async () => {
    let entries = 0;
    const update = vi.fn(async () => {
      entries = 26; // a new build landed, so this update really did reinstall
    });
    vi.stubGlobal('navigator', {
      onLine: true,
      serviceWorker: { getRegistration: async () => ({ active: {}, update }) },
    });
    vi.stubGlobal('caches', {
      keys: async () => ['workbox-precache-v2-https://mece.test/'],
      open: async () => ({
        keys: async () => Array.from({ length: entries }, (_, i) => `/asset-${i}`),
      }),
    });
    const result = await checkOfflineReadiness();
    expect(result.precacheEntries).toBe(26);
    expect(result.ready).toBe(true);
    expect(result.repairRequested).toBe(true);
  });

  // A profile that blocks site data hands back throwing getters rather than
  // undefined, so the `typeof` guards themselves threw. That rejected the whole
  // check — an unhandled rejection at boot, and an About panel frozen on
  // "Checking…", which is the unactionable non-answer the panel exists to replace.
  it('survives a `caches` accessor that throws', async () => {
    vi.stubGlobal('navigator', {
      onLine: true,
      serviceWorker: { getRegistration: async () => ({ active: {} }) },
    });
    Object.defineProperty(globalThis, 'caches', {
      configurable: true,
      get() {
        throw new Error('blocked by policy');
      },
    });
    const result = await checkOfflineReadiness();
    expect(result.worker).toBe('active');
    expect(result.precacheEntries).toBeNull(); // "could not tell", not "empty"
    expect(result.ready).toBe(false);
    Reflect.deleteProperty(globalThis, 'caches');
  });

  it('survives a `navigator.serviceWorker` accessor that throws', async () => {
    vi.stubGlobal('caches', cachesWith(26));
    vi.stubGlobal('navigator', {
      onLine: true,
      get serviceWorker(): never {
        throw new Error('blocked by policy');
      },
    });
    expect((await checkOfflineReadiness()).worker).toBe('unsupported');
  });
});
