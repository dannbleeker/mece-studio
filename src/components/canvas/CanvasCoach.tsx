import { useState } from 'react';

const DISMISS_KEY = 'mece-studio:coachDismissed:v1';

/**
 * A one-time coach card shown on the canvas while a tree is still just its root
 * (no splits yet) — the moment a first-timer has zero on-canvas guidance. It
 * points at the two moves that start a MECE tree (Tab to branch, then pick how a
 * split is cut) and is dismissable, remembered per device.
 */
export function CanvasCoach({ show }: { show: boolean }) {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });
  if (!show || dismissed) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // ignore — dismissing is best-effort
    }
    setDismissed(true);
  };

  return (
    <div className="pointer-events-auto max-w-sm rounded-lg border border-[#e7e4dc] bg-white/95 p-3 shadow-md">
      <div className="flex items-start gap-2">
        <span aria-hidden="true" className="text-[#3f6fb0]">
          💡
        </span>
        <p className="text-[12px] text-neutral-600 leading-snug">
          <span className="font-medium text-neutral-800">Start your tree.</span> Select a node and
          press <kbd className="rounded border border-neutral-300 bg-neutral-50 px-1">Tab</kbd> to
          add a branch — then in the <span className="font-medium">Logic</span> panel choose how it
          splits (segment · binary · formula …) to turn on MECE checks.
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss tip"
          className="ml-1 shrink-0 text-neutral-400 hover:text-neutral-700"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
