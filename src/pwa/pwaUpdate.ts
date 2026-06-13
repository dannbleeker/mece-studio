import { registerSW } from 'virtual:pwa-register';
import { showToast } from '@/components/toast/toastStore';

let registered = false;
let cachedUpdateSW: ((reloadPage?: boolean) => Promise<void>) | null = null;

/**
 * Canonical "New version… Refresh now" prompt. Shared by the plugin's
 * onNeedRefresh callback and the manual-check already-waiting branch.
 */
const showUpdateAvailableToast = (): void => {
  const refresh = cachedUpdateSW;
  showToast('info', 'A new version is available.', {
    // Refresh is the whole point of this toast — long dwell so the user can decide.
    action: refresh ? { label: 'Refresh now', run: () => void refresh(true) } : undefined,
    durationMs: 15000,
  });
};

export const initPwaUpdateToast = (): void => {
  if (registered || typeof window === 'undefined') return;
  registered = true;
  // registerSW() registers the generated SW and returns updateSW(reload?). We hoist
  // that fn to module scope (cachedUpdateSW) so the manual "Check for updates" path
  // can drive it too.
  cachedUpdateSW = registerSW({
    onNeedRefresh: () => showUpdateAvailableToast(),
    onOfflineReady: () => showToast('success', 'Ready to use offline.'),
  });
};

/**
 * Outcomes of a manual update check:
 *  - 'unsupported'     no SW API / no registration yet (node, plain http://, a
 *                      fresh first visit before the SW lands)
 *  - 'already-pending' an update was already waiting; we re-surfaced the
 *                      "Refresh now" prompt, so the caller adds nothing
 *  - 'newly-found'     update() fetched a new SW (installing/waiting); the
 *                      onNeedRefresh hook will prompt when install completes
 *  - 'up-to-date'      check completed, no new worker
 */
export type UpdateCheckResult = 'unsupported' | 'already-pending' | 'newly-found' | 'up-to-date';

/** Force a SW update check (the browser otherwise checks on each load + ~24h). */
export const checkForUpdate = async (): Promise<UpdateCheckResult> => {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return 'unsupported';
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return 'unsupported';
  // Already waiting — the user likely dismissed the earlier prompt. Re-surface it
  // rather than firing a second, redundant "found an update" message.
  if (reg.waiting) {
    showUpdateAvailableToast();
    return 'already-pending';
  }
  try {
    await reg.update();
  } catch {
    return 'unsupported';
  }
  if (reg.installing || reg.waiting) return 'newly-found';
  return 'up-to-date';
};

// Test-only: clear the module guard so the first-call branch can be re-exercised.
export const __resetPwaUpdateForTest = (): void => {
  registered = false;
  cachedUpdateSW = null;
};
