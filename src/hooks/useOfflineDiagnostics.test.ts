// @vitest-environment happy-dom
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { __resetOfflineReadinessForTest } from '@/pwa/offlineReadiness';
import { type OfflineDiagnostics, useOfflineDiagnostics } from './useOfflineDiagnostics';

/**
 * happy-dom ships none of these APIs, so the bare environment IS the
 * "unsupported browser" case and every other case is stubbed in.
 */
function stubNavigator(key: 'serviceWorker' | 'storage', value: unknown) {
  Object.defineProperty(navigator, key, { configurable: true, value });
}

/** A Cache Storage holding one Workbox precache with `entries` entries. */
function stubPrecache(entries: number) {
  vi.stubGlobal('caches', {
    keys: async () => ['workbox-precache-v2-https://mece'],
    open: async () => ({ keys: async () => Array.from({ length: entries }, () => ({})) }),
  });
}

/** Resolve once the reads have settled — every assertion is about that state. */
async function settled(): Promise<OfflineDiagnostics> {
  const { result } = renderHook(() => useOfflineDiagnostics());
  await waitFor(() => expect(result.current.settled).toBe(true));
  return result.current;
}

beforeEach(__resetOfflineReadinessForTest);

afterEach(() => {
  Reflect.deleteProperty(navigator, 'serviceWorker');
  Reflect.deleteProperty(navigator, 'storage');
  vi.unstubAllGlobals();
});

describe('useOfflineDiagnostics', () => {
  it('reports every reading as unavailable when the APIs are absent', async () => {
    expect(await settled()).toEqual({
      readiness: {
        worker: 'unsupported',
        precacheEntries: null,
        ready: false,
        repairRequested: false,
      },
      persisted: null,
      usageBytes: null,
      settled: true,
    });
  });

  it('surfaces an active worker over a populated precache, with storage state', async () => {
    stubNavigator('serviceWorker', { getRegistration: async () => ({ active: {} }) });
    stubNavigator('storage', {
      persisted: async () => true,
      estimate: async () => ({ usage: 620_000 }),
    });
    stubPrecache(26);

    const diagnostics = await settled();
    expect(diagnostics.readiness.worker).toBe('active');
    expect(diagnostics.readiness.precacheEntries).toBe(26);
    expect(diagnostics.readiness.ready).toBe(true);
    expect(diagnostics.persisted).toBe(true);
    expect(diagnostics.usageBytes).toBe(620_000);
  });

  // The reported symptom: the registration outlived its cache (an eviction).
  it('surfaces the eviction signature — an active worker over an empty precache', async () => {
    stubNavigator('serviceWorker', {
      getRegistration: async () => ({ active: {}, update: async () => undefined }),
    });
    stubNavigator('storage', { persisted: async () => false, estimate: async () => ({}) });
    stubPrecache(0);

    const diagnostics = await settled();
    expect(diagnostics.readiness.worker).toBe('active');
    expect(diagnostics.readiness.precacheEntries).toBe(0);
    expect(diagnostics.readiness.ready).toBe(false);
    expect(diagnostics.persisted).toBe(false);
    // Nothing to report as a size, and that is not the same as zero bytes.
    expect(diagnostics.usageBytes).toBeNull();
  });

  it('survives the storage APIs rejecting (a private or managed profile)', async () => {
    const refuse = () => Promise.reject(new Error('denied'));
    stubNavigator('storage', { persisted: refuse, estimate: refuse });

    const diagnostics = await settled();
    expect(diagnostics.persisted).toBeNull();
    expect(diagnostics.usageBytes).toBeNull();
    expect(diagnostics.settled).toBe(true);
  });

  it('treats an unreadable cache as unknown rather than as zero', async () => {
    stubNavigator('serviceWorker', { getRegistration: async () => ({ active: {} }) });
    vi.stubGlobal('caches', { keys: () => Promise.reject(new Error('blocked')) });

    expect((await settled()).readiness.precacheEntries).toBeNull();
  });
});
