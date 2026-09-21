/**
 * The four readings behind the About dialog's offline-readiness panel.
 *
 * This exists because of a report we could not reproduce: a user's installed
 * app showed the browser's own "No internet access" page. Mirroring the
 * production bytes proved the shell serves fine offline, so the best-fitting
 * explanation is eviction — Chrome drops a best-effort origin *whole*, taking
 * the precache, IndexedDB and localStorage (the user's trees) with it. Nothing
 * in the app could tell the two apart, so the next report is a screenshot of
 * these readings instead of a guess.
 *
 * The worker + precache half is not re-derived here: `checkOfflineReadiness`
 * (`pwa/offlineReadiness`) is the same check the app runs at boot, so the panel
 * reports exactly what the app acted on rather than a second opinion. This hook
 * adds the two storage readings that explain *why* a precache went missing, and
 * owns the React lifecycle.
 *
 * Every read is guarded and swallows its own failure: all of these APIs are
 * absent in the node test environment, restricted on plain `http://`, and a
 * private or managed profile can reject them. An unreadable value stays `null`
 * — "we could not ask" is a different diagnosis from "no", and conflating them
 * is what made the original report unactionable.
 */
import { useEffect, useState } from 'react';
import { checkOfflineReadiness, type OfflineReadiness } from '@/pwa/offlineReadiness';

export interface OfflineDiagnostics {
  /** Service worker + precache, from the check the app runs at boot. */
  readiness: OfflineReadiness;
  /** `navigator.storage.persisted()`; `null` when unsupported or refused. */
  persisted: boolean | null;
  /** `navigator.storage.estimate().usage`, in bytes; `null` when unavailable. */
  usageBytes: number | null;
  /** False until the reads settle, so the panel can say "checking" rather than "no". */
  settled: boolean;
}

/** `navigator.storage`, or `undefined` where there is no navigator to ask. */
const storageManager = (): StorageManager | undefined =>
  typeof navigator === 'undefined' ? undefined : navigator.storage;

async function readPersisted(): Promise<boolean | null> {
  const storage = storageManager();
  if (typeof storage?.persisted !== 'function') return null;
  try {
    return await storage.persisted();
  } catch {
    return null;
  }
}

async function readUsage(): Promise<number | null> {
  const storage = storageManager();
  if (typeof storage?.estimate !== 'function') return null;
  try {
    return (await storage.estimate()).usage ?? null;
  } catch {
    return null;
  }
}

/** What every reading is before it has been taken: nothing known, nothing claimed. */
const UNREAD: OfflineDiagnostics = {
  readiness: { worker: 'unsupported', precacheEntries: null, ready: false, repairRequested: false },
  persisted: null,
  usageBytes: null,
  settled: false,
};

/**
 * Read the offline-readiness signals once, on mount. Deliberately not live: it
 * renders inside a dialog the user opens, so "when you opened it" is the honest
 * reading, and polling Cache Storage costs more than it tells.
 */
export function useOfflineDiagnostics(): OfflineDiagnostics {
  const [diagnostics, setDiagnostics] = useState<OfflineDiagnostics>(UNREAD);

  useEffect(() => {
    let live = true;
    void (async () => {
      const [readiness, persisted, usageBytes] = await Promise.all([
        // The readiness check guards its own reads, but a guard is a claim and this
        // panel is the one surface that must never make one it cannot keep: if it
        // ever rejects, `settled` would stay false and every row would read
        // "Checking…" forever — the unactionable non-answer this panel exists to
        // replace. Falling back to the unread readiness reports "unsupported",
        // which is at least a diagnosis the user can screenshot.
        checkOfflineReadiness().catch(() => UNREAD.readiness),
        readPersisted(),
        readUsage(),
      ]);
      if (live) setDiagnostics({ readiness, persisted, usageBytes, settled: true });
    })();
    return () => {
      live = false;
    };
  }, []);

  return diagnostics;
}
