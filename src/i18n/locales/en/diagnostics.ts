/**
 * English wording for the offline-readiness panel in the About dialog.
 *
 * **Editor wording, not core.** About opens from the workspace header and from
 * nowhere else, so nothing outside `Workspace`'s import graph reads these —
 * which is the rule `en-core.ts` states. The offline *indicator*, which renders
 * at the app root and shows on Start too, is core and lives in `app` instead.
 *
 * `pwa/offlineReadiness` returns states and raw counts and no prose at all;
 * every sentence the panel shows is here. Each one says what the reading means
 * for the user rather than echoing an API name, because the panel exists to be
 * screenshotted by someone who has never opened DevTools.
 */
import { num, plur } from './_locale';

export const diagnostics = {
  /** The panel's own framing. */
  heading: 'Offline readiness',
  hint: 'What this browser would serve with the network off. Include this if the app ever fails to open offline.',
  /** Stands in for every reading until the checks settle. */
  checking: 'Checking…',

  /** Is a service worker installed and in charge of this page? */
  serviceWorkerLabel: 'Service worker',
  swActive: 'Active',
  swPending: 'Installing…',
  swNone: 'Not registered — this app will not open offline',
  swUnsupported: 'Not supported in this browser',

  /**
   * Did the precache actually populate? An *active* worker over an empty
   * precache is the signature of an eviction, and it is exactly what reads to
   * the user as "no internet access". A cache that could not be *read* is
   * worded as unknown instead: telling someone their cache is empty when we
   * merely could not look would be the same bug in a new place.
   */
  offlineReadyLabel: 'Offline ready',
  offlineReadyYes: ({ count }: { count: number }) =>
    plur(count, {
      one: `Yes — ${num(count)} file cached`,
      other: `Yes — ${num(count)} files cached`,
    }),
  offlineReadyEmpty: 'No — the cache is empty, so this app will not open offline',
  offlineReadyPartial: ({ count }: { count: number }) =>
    plur(count, {
      one: `No — only ${num(count)} file cached, so the app shell is incomplete`,
      other: `No — only ${num(count)} files cached, so the app shell is incomplete`,
    }),
  offlineReadyUnknown: 'Cannot tell — cache storage could not be read',

  /**
   * Has the browser promised not to evict this origin under storage pressure?
   * Without that promise an eviction takes the cache, IndexedDB *and*
   * localStorage together — so the user's saved trees go with the offline
   * cache, and the wording says so rather than talking about files.
   */
  persistedLabel: 'Storage persisted',
  persistedYes: 'Yes — the browser will keep this app and its trees',
  persistedNo: 'No — the browser may clear this app, and your saved trees, to free space',
  persistedUnknown: 'Cannot tell — not supported in this browser',

  /** How much this origin is using; an eviction shows up here as a collapse. */
  sizeLabel: 'Cached size',
  sizeValue: ({ bytes }: { bytes: number }) =>
    num(bytes / 1_048_576, { style: 'unit', unit: 'megabyte', maximumFractionDigits: 1 }),
  sizeUnknown: 'Cannot tell',
};
