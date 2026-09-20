import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useToastStore } from '@/components/toast/toastStore';
import { en } from '@/i18n/locales/en';
// The same stub the VITEST alias points `virtual:pwa-register` at, so firing these
// drives the callbacks pwaUpdate registered.
import {
  __getLastRegisterSWOptions,
  __getRegisterCount,
  __getUpdateCalls,
  __resetPwaRegisterStub,
  __triggerNeedRefresh,
  __triggerOfflineReady,
} from '../../tests/stubs/virtual-pwa-register';
import { __resetPwaUpdateForTest, checkForUpdate, initPwaUpdateToast } from './pwaUpdate';

beforeEach(() => {
  __resetPwaUpdateForTest();
  __resetPwaRegisterStub();
  useToastStore.setState({ toasts: [] });
  vi.stubGlobal('window', {}); // node env has no window; init guards on it
});
afterEach(() => vi.unstubAllGlobals());

describe('initPwaUpdateToast', () => {
  it('registers both SW lifecycle callbacks', () => {
    initPwaUpdateToast(en);
    const opts = __getLastRegisterSWOptions();
    expect(opts?.onNeedRefresh).toBeTypeOf('function');
    expect(opts?.onOfflineReady).toBeTypeOf('function');
  });

  it('onNeedRefresh shows a "Refresh now" toast whose action calls updateSW(true)', () => {
    initPwaUpdateToast(en);
    __triggerNeedRefresh();
    const { toasts } = useToastStore.getState();
    expect(toasts).toHaveLength(1);
    expect(toasts[0]?.message).toBe(en.app.updateAvailable);
    expect(toasts[0]?.action?.label).toBe(en.app.refreshNow);
    toasts[0]?.action?.run();
    expect(__getUpdateCalls()).toEqual([true]);
  });

  it('onOfflineReady shows the offline-ready toast', () => {
    initPwaUpdateToast(en);
    __triggerOfflineReady();
    expect(useToastStore.getState().toasts[0]?.message).toBe(en.app.offlineReady);
  });

  it('is idempotent — repeated calls register the SW once', () => {
    initPwaUpdateToast(en);
    initPwaUpdateToast(en);
    expect(__getRegisterCount()).toBe(1);
  });
});

describe('checkForUpdate', () => {
  it("returns 'unsupported' without a serviceWorker API", async () => {
    vi.stubGlobal('navigator', {});
    expect(await checkForUpdate(en)).toBe('unsupported');
  });

  it("returns 'unsupported' with no registration", async () => {
    vi.stubGlobal('navigator', { serviceWorker: { getRegistration: async () => undefined } });
    expect(await checkForUpdate(en)).toBe('unsupported');
  });

  it("re-surfaces the prompt and returns 'already-pending' when a worker is waiting", async () => {
    initPwaUpdateToast(en);
    vi.stubGlobal('navigator', {
      serviceWorker: { getRegistration: async () => ({ waiting: {} }) },
    });
    expect(await checkForUpdate(en)).toBe('already-pending');
    expect(useToastStore.getState().toasts).toHaveLength(1);
  });

  it("returns 'newly-found' when update() turns up an installing worker", async () => {
    const reg: { waiting: unknown; installing: unknown; update: () => Promise<void> } = {
      waiting: null,
      installing: null,
      update: async () => {
        reg.installing = {};
      },
    };
    vi.stubGlobal('navigator', { serviceWorker: { getRegistration: async () => reg } });
    expect(await checkForUpdate(en)).toBe('newly-found');
  });

  it("returns 'up-to-date' when nothing new is found", async () => {
    vi.stubGlobal('navigator', {
      serviceWorker: {
        getRegistration: async () => ({ waiting: null, installing: null, update: async () => {} }),
      },
    });
    expect(await checkForUpdate(en)).toBe('up-to-date');
  });

  // `update()` re-fetches the worker script over the network, so it rejects when
  // there is no connection. This used to report 'unsupported', which the About
  // dialog words as "no service worker running" — while the readiness panel
  // directly below it reported the worker as active. Two contradictory claims in
  // one dialog, and the false one was the one a user would screenshot. This test
  // previously asserted 'unsupported', pinning the defect rather than catching it.
  it("returns 'check-failed' when update() rejects because the network is gone", async () => {
    vi.stubGlobal('navigator', {
      serviceWorker: {
        getRegistration: async () => ({
          waiting: null,
          installing: null,
          update: async () => {
            throw new Error('network');
          },
        }),
      },
    });
    expect(await checkForUpdate(en)).toBe('check-failed');
  });

  // The two cases that genuinely mean "unsupported" must stay distinguishable
  // from the one above, or the honest wording has nothing to attach to.
  it("reserves 'unsupported' for a missing API and a missing registration", async () => {
    vi.stubGlobal('navigator', {});
    expect(await checkForUpdate(en)).toBe('unsupported');

    vi.stubGlobal('navigator', { serviceWorker: { getRegistration: async () => undefined } });
    expect(await checkForUpdate(en)).toBe('unsupported');
  });
});
