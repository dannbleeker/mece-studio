import { registerSW } from 'virtual:pwa-register';
import { showToast } from '@/components/toast/toastStore';
import type { CoreMessages } from '@/i18n/types';

let registered = false;
// Deliberately typed without the plugin's `reloadPage` parameter: in prompt mode
// vite-plugin-pwa names it `_reloadPage` and never reads it, so a signature that
// advertises it invites exactly the assumption that cost us the reload below.
let cachedUpdateSW: (() => Promise<void>) | null = null;

/**
 * Canonical "New version… Refresh now" prompt. Shared by the plugin's
 * onNeedRefresh callback and the manual-check already-waiting branch.
 *
 * This module runs outside React (it registers the service worker before the
 * app mounts), so it can't read the catalogue from context — the caller passes
 * it in, which also keeps the wording out of the PWA plumbing.
 */
/**
 * How long to wait for the new worker to take over before reloading regardless.
 * Long enough for a normal activation, short enough that the click still feels
 * like it did something.
 */
const RELOAD_FALLBACK_MS = 3000;

/**
 * Reload once the incoming worker takes over — and reload anyway if it never does.
 *
 * MECE owns this rather than leaning on the plugin, because the plugin's reload is
 * unreachable from *both* of our prompt paths. It lives in a `controlling` listener
 * that vite-plugin-pwa attaches inside its private `showSkipWaitingPrompt`, gated on
 * workbox's `isUpdate` — which is `Boolean(navigator.serviceWorker.controller)`
 * sampled at register time. So a page the worker is not serving (a hard reload
 * bypasses it for that navigation) fails the gate, and never receives a
 * `controllerchange` either: `registerType: 'prompt'` means no `clientsClaim`, and a
 * worker only claims clients it already controls. The manual "Check for updates"
 * path re-surfaces the prompt itself, so when `reg.waiting` was set by another tab
 * that listener was never attached in this page at all. Either way the toast's one
 * job silently did not happen, and the user stayed on the old build believing they
 * had refreshed.
 *
 * Reloading twice is harmless — the first navigation wins — but the latch keeps the
 * timer from firing into a reload that already started.
 */
const reloadWhenWorkerTakesOver = (): void => {
  let reloaded = false;
  const reload = (): void => {
    if (reloaded) return;
    reloaded = true;
    window.location.reload();
  };
  const sw = typeof navigator === 'undefined' ? undefined : navigator.serviceWorker;
  if (typeof sw?.addEventListener === 'function') {
    sw.addEventListener('controllerchange', reload, { once: true });
  }
  setTimeout(reload, RELOAD_FALLBACK_MS);
};

const showUpdateAvailableToast = (m: CoreMessages): void => {
  const refresh = cachedUpdateSW;
  showToast('info', m.app.updateAvailable, {
    // Refresh is the whole point of this toast — long dwell so the user can decide.
    action: refresh
      ? {
          label: m.app.refreshNow,
          run: () => {
            // Arm the reload before asking the worker to skip waiting, so a fast
            // handover cannot fire `controllerchange` before anyone is listening.
            reloadWhenWorkerTakesOver();
            void refresh().catch(() => {
              // The reload is armed either way; a failed skip-waiting still leaves
              // the user better off on a fresh load than on a dismissed toast.
            });
          },
        }
      : undefined,
    durationMs: 15000,
  });
};

export const initPwaUpdateToast = (m: CoreMessages): void => {
  if (registered || typeof window === 'undefined') return;
  registered = true;
  // registerSW() registers the generated SW and returns updateSW(reload?). We hoist
  // that fn to module scope (cachedUpdateSW) so the manual "Check for updates" path
  // can drive it too.
  cachedUpdateSW = registerSW({
    onNeedRefresh: () => showUpdateAvailableToast(m),
    onOfflineReady: () => showToast('success', m.app.offlineReady),
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
 *  - 'check-failed'    we could not complete the check — `update()` needs the
 *                      network, and a managed profile can reject the registration
 *                      lookup itself. A worker is still installed and serving.
 *  - 'up-to-date'      check completed, no new worker
 */
export type UpdateCheckResult =
  | 'unsupported'
  | 'check-failed'
  | 'already-pending'
  | 'newly-found'
  | 'up-to-date';

/** Force a SW update check (the browser otherwise checks on each load + ~24h). */
export const checkForUpdate = async (m: CoreMessages): Promise<UpdateCheckResult> => {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return 'unsupported';
  // A locked-down or managed profile rejects the lookup outright rather than
  // resolving null — `checkOfflineReadiness` already guards the same call for the
  // same reason. Unguarded, this rejected into `void onCheckForUpdate()` in the
  // About dialog: an unhandled rejection, and a button that visibly did nothing.
  let reg: ServiceWorkerRegistration | null;
  try {
    reg = (await navigator.serviceWorker.getRegistration()) ?? null;
  } catch {
    return 'check-failed';
  }
  if (!reg) return 'unsupported';
  // Already waiting — the user likely dismissed the earlier prompt. Re-surface it
  // rather than firing a second, redundant "found an update" message.
  if (reg.waiting) {
    showUpdateAvailableToast(m);
    return 'already-pending';
  }
  // Offline, or a captive portal: `update()` re-fetches the worker script over
  // the network, so it rejects with no connection. That is NOT 'unsupported' —
  // a registration was resolved two lines above, so a worker provably exists and
  // is the very thing serving this page. Reporting it as "no service worker
  // running" made the toast contradict the readiness panel directly below it,
  // and pointed a user at reinstalling or clearing site data — which would take
  // their locally stored trees with it.
  try {
    await reg.update();
  } catch {
    return 'check-failed';
  }
  if (reg.installing || reg.waiting) return 'newly-found';
  return 'up-to-date';
};

// Test-only: clear the module guard so the first-call branch can be re-exercised.
export const __resetPwaUpdateForTest = (): void => {
  registered = false;
  cachedUpdateSW = null;
};
