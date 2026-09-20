/**
 * Whether the browser currently believes it has a network connection.
 *
 * MECE Studio is local-first, so knowing this is not about degrading the app —
 * nothing here needs the network. It is about attribution: when the tab fails
 * to load something, the user should be told it is the connection, not the app.
 * Before this, `navigator.onLine` was read nowhere, so an offline failure was
 * indistinguishable from a broken build.
 *
 * `useSyncExternalStore` rather than state synced from an effect: the browser
 * *is* the store, so this reads it during render instead of keeping a copy that
 * is one commit stale and can tear between two components mounted a tick apart.
 */
import { useSyncExternalStore } from 'react';

/** Guarded so importing this module is safe in the node test environment. */
const hasWindow = (): boolean => typeof window !== 'undefined';

function subscribe(onChange: () => void): () => void {
  if (!hasWindow()) return () => undefined;
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
}

/**
 * Optimistic where there is nothing to ask (node, or a browser without the
 * property): "online" is the state that renders nothing, so an unknown
 * environment stays silent rather than crying wolf.
 */
function getSnapshot(): boolean {
  if (!hasWindow() || typeof navigator === 'undefined') return true;
  return navigator.onLine !== false;
}

/** `true` while online; re-renders on the window's `online` / `offline` events. */
export function useOnlineStatus(): boolean {
  // Same snapshot server-side: there is no navigator to ask, and "online"
  // renders nothing, so hydration matches.
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
