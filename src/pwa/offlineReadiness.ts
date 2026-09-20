/**
 * Whether a service worker is registered for this origin, and how far along.
 * Module-local: it is reachable as `OfflineReadiness['worker']`, so exporting it
 * separately would only add an export nothing imports.
 */
type OfflineWorkerState =
  /** No Service Worker API at all — node, a plain `http://` origin, a locked profile. */
  | 'unsupported'
  /** API present, nothing registered: a first visit, or site data was wiped. */
  | 'none'
  /** Registered but not yet `active` — installing or waiting. */
  | 'pending'
  /** Registered and activated; it is serving fetches. */
  | 'active';

export type OfflineReadiness = {
  worker: OfflineWorkerState;
  /** Entries across Workbox's precaches, or null when Cache Storage is unreadable. */
  precacheEntries: number | null;
  /** An active worker over a populated precache — the app should open offline. */
  ready: boolean;
  /** This boot asked the worker to reinstall because the precache was gone. */
  repairRequested: boolean;
};

/** Workbox names every precache `<prefix>-precache-<suffix>`; match on the stable middle. */
const PRECACHE_NAME_TOKEN = 'precache';

/**
 * A healthy precache holds the whole app shell — production sits around 26
 * entries. The threshold is deliberately a floor rather than an exact count so
 * it does not go red every time the build emits one more chunk; anything below
 * it is not a precache that could serve the app, it is wreckage.
 */
const MIN_HEALTHY_PRECACHE_ENTRIES = 5;

/** Once-per-session guard: a genuinely broken origin must not spin on update(). */
let repairAttempted = false;

/**
 * Total entries across every Workbox precache, or null when Cache Storage is
 * unreadable. Null is "we could not tell", which is deliberately different from
 * 0 ("we looked, there is nothing") — managed Chrome and private windows reject
 * these calls, and a rejection must not be read as a wiped cache.
 */
const countPrecacheEntries = async (): Promise<number | null> => {
  if (typeof caches === 'undefined' || typeof caches?.keys !== 'function') return null;
  try {
    let total = 0;
    for (const name of await caches.keys()) {
      if (!name.includes(PRECACHE_NAME_TOKEN)) continue;
      const cache = await caches.open(name);
      total += (await cache.keys()).length;
    }
    return total;
  } catch {
    return null;
  }
};

/**
 * Measure whether offline access actually works right now, and repair it if it
 * visibly does not.
 *
 * The failure this exists for: the app installs fine, then the origin's service
 * worker or Cache Storage disappears underneath it — evicted under quota
 * pressure, or cleared on exit by enterprise policy — and the next offline open
 * is the browser's "No internet access" page. The registration can outlive the
 * cache, so "a worker is registered" is not evidence that anything is cached;
 * only counting the precache is.
 *
 * An *active* worker over an empty precache is the signature of an install that
 * failed or of site data wiped mid-life, and `registration.update()` drives a
 * fresh install that repopulates it. Three conditions narrow that to cases where
 * it can actually help: the worker must be active (a `pending` one is already
 * installing, so a first visit is not mistaken for damage), we must have *read*
 * the cache (null means the API refused us, not that the cache is gone), and we
 * must be online. It runs at most once per session either way.
 *
 * Returns data only — no strings, no toasts. The About panel owns the wording.
 */
export const checkOfflineReadiness = async (): Promise<OfflineReadiness> => {
  const sw = typeof navigator === 'undefined' ? undefined : navigator.serviceWorker;
  if (typeof sw?.getRegistration !== 'function') {
    return { worker: 'unsupported', precacheEntries: null, ready: false, repairRequested: false };
  }

  let registration: ServiceWorkerRegistration | null = null;
  try {
    registration = (await sw.getRegistration()) ?? null;
  } catch {
    // Locked-down profiles reject the lookup outright; that reads as "none".
    registration = null;
  }

  const precacheEntries = await countPrecacheEntries();
  const populated = precacheEntries !== null && precacheEntries >= MIN_HEALTHY_PRECACHE_ENTRIES;

  if (!registration) {
    return { worker: 'none', precacheEntries, ready: false, repairRequested: false };
  }

  const worker: OfflineWorkerState = registration.active ? 'active' : 'pending';
  const online = typeof navigator !== 'undefined' && navigator.onLine === true;
  const repairRequested =
    worker === 'active' && precacheEntries !== null && !populated && !repairAttempted && online;

  if (repairRequested) {
    repairAttempted = true;
    try {
      await registration.update();
    } catch {
      // Nothing to fall back to — the next boot gets one more attempt, and the
      // About panel reports the state either way.
    }
  }

  return { worker, precacheEntries, ready: worker === 'active' && populated, repairRequested };
};

// Test-only: clear the once-per-session repair guard.
export const __resetOfflineReadinessForTest = (): void => {
  repairAttempted = false;
};
