// Test stub for the build-time virtual module `virtual:pwa-register`, which the
// Vitest runner can't resolve. Aliased in vite.config.ts when process.env.VITEST
// is set. Lets tests fire the SW lifecycle callbacks deterministically.
export type RegisterSWOptions = {
  onNeedRefresh?: () => void;
  onOfflineReady?: () => void;
  onRegistered?: (r: ServiceWorkerRegistration | undefined) => void;
  onRegisterError?: (e: unknown) => void;
};
type UpdateSW = (reloadPage?: boolean) => Promise<void>;

let lastOptions: RegisterSWOptions | null = null;
let updateCalls: Array<boolean | undefined> = [];
let registerCount = 0;

export const registerSW = (options: RegisterSWOptions = {}): UpdateSW => {
  lastOptions = options;
  registerCount += 1;
  return async (reloadPage?: boolean) => {
    updateCalls.push(reloadPage);
  };
};

export const __getLastRegisterSWOptions = (): RegisterSWOptions | null => lastOptions;
export const __getUpdateCalls = (): Array<boolean | undefined> => updateCalls;
export const __getRegisterCount = (): number => registerCount;
export const __resetPwaRegisterStub = (): void => {
  lastOptions = null;
  updateCalls = [];
  registerCount = 0;
};
export const __triggerNeedRefresh = (): void => lastOptions?.onNeedRefresh?.();
export const __triggerOfflineReady = (): void => lastOptions?.onOfflineReady?.();
