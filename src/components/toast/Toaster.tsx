import { useEffect } from 'react';
import { type Toast, type ToastKind, useToastStore } from './toastStore';

// Accent dot per kind, drawn from the existing palette (brand / status colours).
const ACCENT: Record<ToastKind, string> = {
  info: '#3f6fb0',
  success: '#3f7d54',
  error: '#bd4a3a',
};

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss);
  useEffect(() => {
    const handle = window.setTimeout(() => dismiss(toast.id), toast.durationMs);
    return () => window.clearTimeout(handle);
  }, [toast.id, toast.durationMs, dismiss]);

  const action = toast.action;
  return (
    <div
      role="status"
      className="flex w-80 items-start gap-2.5 rounded-lg border border-[#e7e4dc] bg-white px-3.5 py-3 shadow-lg"
    >
      <span
        aria-hidden="true"
        className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
        style={{ background: ACCENT[toast.kind] }}
      />
      <span className="min-w-0 flex-1 text-[13px] text-neutral-700 leading-snug">
        {toast.message}
      </span>
      {action && (
        <button
          type="button"
          onClick={() => {
            action.run();
            dismiss(toast.id);
          }}
          className="shrink-0 rounded-md bg-[#3f6fb0] px-2.5 py-1 font-medium text-[12px] text-white hover:bg-[#365f98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3f6fb0]/40"
        >
          {action.label}
        </button>
      )}
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => dismiss(toast.id)}
        className="shrink-0 rounded px-1 text-neutral-400 text-sm hover:text-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3f6fb0]/40"
      >
        ✕
      </button>
    </div>
  );
}

/** Bottom-right transient notifications. Rendered once at the app root. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  if (toasts.length === 0) return null;
  return (
    <div className="fixed right-4 bottom-4 z-[100] flex flex-col gap-2" aria-live="polite">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
