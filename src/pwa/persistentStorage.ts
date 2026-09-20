/**
 * Outcomes of the persistent-storage request:
 *  - 'unsupported'       no Storage API (node, older Safari, a sandboxed frame)
 *  - 'already-persisted' the origin was already in the persistent bucket
 *  - 'persisted'         the browser granted the request just now
 *  - 'denied'            the browser declined; storage stays best-effort
 */
export type PersistentStorageResult = 'unsupported' | 'already-persisted' | 'persisted' | 'denied';

let pending: Promise<PersistentStorageResult> | null = null;

const ask = async (): Promise<PersistentStorageResult> => {
  const storage: StorageManager | undefined =
    typeof navigator === 'undefined' ? undefined : navigator.storage;
  if (!storage?.persist || !storage.persisted) return 'unsupported';
  try {
    // Asking again when already granted is wasted work, and in some browsers a
    // second persist() is the call that can surface a prompt.
    if (await storage.persisted()) return 'already-persisted';
    return (await storage.persist()) ? 'persisted' : 'denied';
  } catch {
    // Present but unusable (sandboxed iframe, some private modes). Practically
    // the same as absent, and a boot-time diagnostic must never throw.
    return 'unsupported';
  }
};

/**
 * Ask the browser to move this origin's storage into the persistent bucket.
 *
 * Both halves of "local-first" otherwise sit in evictable storage: the service
 * worker's precache (what makes the app open offline at all) and the user's
 * issue trees in localStorage. Chrome evicts a best-effort origin *whole* under
 * storage pressure, and iOS Safari clears one after roughly seven days without a
 * visit — which is what "it worked offline last month and now it doesn't" really
 * is. Persistent storage is only cleared by explicit user action.
 *
 * Diagnostic, not user-facing: the browser decides from its own heuristics
 * (installed, bookmarked, engaged) with nothing for the user to do about a
 * refusal, and several browsers resolve it without ever prompting. So the result
 * is returned for callers and tests and otherwise dropped — no toast, no
 * catalogue entry.
 *
 * Idempotent: the first call's promise is reused, so repeat or concurrent
 * callers share one round-trip through the Storage API.
 */
export const requestPersistentStorage = (): Promise<PersistentStorageResult> => {
  pending ??= ask();
  return pending;
};

// Test-only: drop the memoised result so each case starts from a fresh request.
export const __resetPersistentStorageForTest = (): void => {
  pending = null;
};
