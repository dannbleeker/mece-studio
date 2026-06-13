import type { ReactNode } from 'react';
import { useModalFocus } from '@/components/useModalFocus';

interface DialogProps {
  /** Accessible name for the dialog (its `aria-label`). */
  label: string;
  /** Visible heading; defaults to `label` when the two match. */
  heading?: string;
  /** Optional sub-heading line under the title. */
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}

/**
 * The shared modal shell for About / Keyboard / Settings: a dimmed backdrop, a
 * centred card, a title + close button, and the focus-trap (focus in on open,
 * Tab/Shift+Tab cycle inside, Escape closes, focus restored on unmount). Each
 * dialog supplies its own body as children.
 */
export function Dialog({ label, heading, subtitle, onClose, children }: DialogProps) {
  const ref = useModalFocus<HTMLDivElement>(onClose);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-neutral-900/30"
      />
      <div
        ref={ref}
        tabIndex={-1}
        className="relative w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-xl outline-none"
        role="dialog"
        aria-modal="true"
        aria-label={label}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-[#3f6fb0] text-lg tracking-tight">
              {heading ?? label}
            </h2>
            {subtitle && (
              <p className="mt-1 text-[13px] text-neutral-500 leading-relaxed">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-md px-2 py-1 text-neutral-400 text-sm hover:bg-neutral-100 hover:text-neutral-700"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
