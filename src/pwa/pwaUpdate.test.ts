import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useToastStore } from '@/components/toast/toastStore';
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
    initPwaUpdateToast();
    const opts = __getLastRegisterSWOptions();
    expect(opts?.onNeedRefresh).toBeTypeOf('function');
    expect(opts?.onOfflineReady).toBeTypeOf('function');
  });

  it('onNeedRefresh shows a "Refresh now" toast whose action calls updateSW(true)', () => {
    initPwaUpdateToast();
    __triggerNeedRefresh();
    const { toasts } = useToastStore.getState();
    expect(toasts).toHaveLength(1);
    expect(toasts[0]?.message).toMatch(/new version/i);
    expect(toasts[0]?.action?.label).toBe('Refresh now');
    toasts[0]?.action?.run();
    expect(__getUpdateCalls()).toEqual([true]);
  });

  it('onOfflineReady shows the offline-ready toast', () => {
    initPwaUpdateToast();
    __triggerOfflineReady();
    expect(useToastStore.getState().toasts[0]?.message).toMatch(/offline/i);
  });

  it('is idempotent — repeated calls register the SW once', () => {
    initPwaUpdateToast();
    initPwaUpdateToast();
    expect(__getRegisterCount()).toBe(1);
  });
});

describe('checkForUpdate', () => {
  it("returns 'unsupported' without a serviceWorker API", async () => {
    vi.stubGlobal('navigator', {});
    expect(await checkForUpdate()).toBe('unsupported');
  });

  it("returns 'unsupported' with no registration", async () => {
    vi.stubGlobal('navigator', { serviceWorker: { getRegistration: async () => undefined } });
    expect(await checkForUpdate()).toBe('unsupported');
  });

  it("re-surfaces the prompt and returns 'already-pending' when a worker is waiting", async () => {
    initPwaUpdateToast();
    vi.stubGlobal('navigator', {
      serviceWorker: { getRegistration: async () => ({ waiting: {} }) },
    });
    expect(await checkForUpdate()).toBe('already-pending');
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
    expect(await checkForUpdate()).toBe('newly-found');
  });

  it("returns 'up-to-date' when nothing new is found", async () => {
    vi.stubGlobal('navigator', {
      serviceWorker: {
        getRegistration: async () => ({ waiting: null, installing: null, update: async () => {} }),
      },
    });
    expect(await checkForUpdate()).toBe('up-to-date');
  });

  it("returns 'unsupported' when update() throws", async () => {
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
    expect(await checkForUpdate()).toBe('unsupported');
  });
});
