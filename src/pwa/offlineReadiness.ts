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
  try {
    // `typeof caches` is inside the try on purpose: on a profile that blocks site
    // data the binding is a throwing getter, not `undefined`, so the guard itself
    // threw — rejecting this whole check and freezing the About panel on
    // "Checking…" forever, with an unhandled rejection at boot. The hook's own
    // contract is that every read swallows its failure; this is that contract.
    if (typeof caches === 'undefined' || typeof caches?.keys !== 'function') return null;
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
 * What the repair cannot do: `update()` reinstalls only when the fetched `sw.js`
 * differs byte-for-byte from the running one. If the origin has not redeployed
 * since the cache was lost, the check finds an identical script, aborts, and
 * repopulates nothing. That is why the count is re-read afterwards instead of
 * assumed — the caller is told what the cache actually holds now, not what the
 * attempt hoped for. A stronger repair (unregister and re-register) is possible
 * but would tear down a working worker to fix a cache, so it is not taken
 * unprompted.
 *
 * Returns data only — no strings, no toasts. The About panel owns the wording.
 */
export const checkOfflineReadiness = async (): Promise<OfflineReadiness> => {
  // Same throwing-accessor hazard as `caches` above: reading `navigator.serviceWorker`
  // can throw outright rather than yield undefined, and an unreadable API is
  // 'unsupported', not a crash.
  let sw: ServiceWorkerContainer | undefined;
  try {
    sw = typeof navigator === 'undefined' ? undefined : navigator.serviceWorker;
  } catch {
    sw = undefined;
  }
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

  if (!repairRequested) {
    return { worker, precacheEntries, ready: worker === 'active' && populated, repairRequested };
  }

  repairAttempted = true;
  try {
    await registration.update();
  } catch {
    // Nothing to fall back to — the next boot gets one more attempt, and the
    // readings below report the state either way.
  }

  // Re-read rather than assume. `update()` only reinstalls when the fetched
  // `sw.js` differs byte-for-byte from the running one, so on an origin that has
  // not redeployed since the precache was wiped it completes having done nothing
  // at all — the exact shape of the damage this repair targets. Returning the
  // pre-repair count would then have the panel describe a cache that the repair
  // silently failed to restore. The second count costs one Cache Storage sweep
  // and is the only way to say which of the two happened.
  const afterEntries = await countPrecacheEntries();
  const afterPopulated = afterEntries !== null && afterEntries >= MIN_HEALTHY_PRECACHE_ENTRIES;
  return {
    worker,
    precacheEntries: afterEntries,
    ready: worker === 'active' && afterPopulated,
    repairRequested,
  };
};

// Test-only: clear the once-per-session repair guard.
export const __resetOfflineReadinessForTest = (): void => {
  repairAttempted = false;
};
