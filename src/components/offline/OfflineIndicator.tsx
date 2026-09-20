import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useMessages } from '@/i18n/useMessages';

/**
 * A standing notice while the browser reports no connection.
 *
 * Local-first means an offline app is the normal case, not a degraded one — so
 * this is deliberately small and says so, rather than warning. Its job is
 * attribution: if something does fail while the network is gone, the user knows
 * which of the two to blame.
 *
 * The live region is mounted whether or not there is anything in it. A
 * `role="status"` element inserted at the moment its text appears is announced
 * inconsistently; one that already exists and gains text is announced reliably.
 * Empty, it draws nothing and takes no space — `fixed` and childless.
 */
export function OfflineIndicator() {
  const m = useMessages();
  const online = useOnlineStatus();
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 left-4 z-[100]"
    >
      {!online && (
        <span className="inline-flex items-center gap-2 rounded-full border border-[#e7e4dc] bg-white px-3 py-1.5 text-[12px] text-neutral-600 shadow-sm">
          <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-[#bd4a3a]" />
          {m.app.offlineNotice}
        </span>
      )}
    </div>
  );
}
