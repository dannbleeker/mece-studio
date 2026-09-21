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

  // The old version of this test asserted `__getUpdateCalls()` equalled `[true]`,
  // i.e. that we passed `reloadPage: true`. That argument is named `_reloadPage`
  // in vite-plugin-pwa's prompt-mode `updateServiceWorker` and never read, so the
  // assertion pinned a value with no runtime effect and could not have failed on
  // the actual defect: the page never reloaded. What matters is the reload, so
  // that is what these two assert.
  it('onNeedRefresh shows a "Refresh now" toast that asks the worker to take over', () => {
    initPwaUpdateToast(en);
    __triggerNeedRefresh();
    const { toasts } = useToastStore.getState();
    expect(toasts).toHaveLength(1);
    expect(toasts[0]?.message).toBe(en.app.updateAvailable);
    expect(toasts[0]?.action?.label).toBe(en.app.refreshNow);
    toasts[0]?.action?.run();
    expect(__getUpdateCalls()).toHaveLength(1);
  });

  it('reloads when the new worker takes over', () => {
    const reload = vi.fn();
    const listeners: Array<() => void> = [];
    vi.stubGlobal('window', { location: { reload } });
    vi.stubGlobal('navigator', {
      serviceWorker: { addEventListener: (_e: string, fn: () => void) => listeners.push(fn) },
    });
    initPwaUpdateToast(en);
    __triggerNeedRefresh();
    useToastStore.getState().toasts[0]?.action?.run();
    expect(reload).not.toHaveBeenCalled(); // not before the handover
    for (const fn of listeners) fn(); // controllerchange
    expect(reload).toHaveBeenCalledTimes(1);
  });

  // The case the plugin's own reload cannot reach: a page no worker is serving
  // gets no `controllerchange` at all, so without the timer the click is inert.
  it('reloads anyway when no controllerchange ever arrives', async () => {
    vi.useFakeTimers();
    const reload = vi.fn();
    vi.stubGlobal('window', { location: { reload } });
    vi.stubGlobal('navigator', { serviceWorker: {} }); // no addEventListener
    initPwaUpdateToast(en);
    __triggerNeedRefresh();
    useToastStore.getState().toasts[0]?.action?.run();
    expect(reload).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(3000);
    expect(reload).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('reloads only once when the handover and the fallback both fire', async () => {
    vi.useFakeTimers();
    const reload = vi.fn();
    const listeners: Array<() => void> = [];
    vi.stubGlobal('window', { location: { reload } });
    vi.stubGlobal('navigator', {
      serviceWorker: { addEventListener: (_e: string, fn: () => void) => listeners.push(fn) },
    });
    initPwaUpdateToast(en);
    __triggerNeedRefresh();
    useToastStore.getState().toasts[0]?.action?.run();
    for (const fn of listeners) fn();
    await vi.advanceTimersByTimeAsync(5000);
    expect(reload).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
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

  // A managed or locked-down profile rejects the registration lookup outright.
  // Unguarded this rejected out of `void onCheckForUpdate()` in the About dialog:
  // an unhandled rejection, and a button that visibly did nothing at all.
  it("returns 'check-failed' when getRegistration() itself rejects", async () => {
    vi.stubGlobal('navigator', {
      serviceWorker: {
        getRegistration: async () => {
          throw new Error('blocked by policy');
        },
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
