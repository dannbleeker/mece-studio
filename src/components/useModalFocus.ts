import { useEffect, useRef } from 'react';

/**
 * Accessibility for a modal dialog: move focus into the dialog when it opens,
 * keep Tab/Shift+Tab cycling inside it (so focus can't wander to the page
 * behind), close on Escape, and restore focus to the trigger when it closes.
 *
 * Attach the returned ref to the dialog card and give that element tabIndex={-1}
 * so it can receive the initial focus.
 */
export function useModalFocus<T extends HTMLElement>(onClose: () => void) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const restoreTo = document.activeElement as HTMLElement | null;
    const node = ref.current;
    node?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !node) return;
      const focusables = node.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === node)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      restoreTo?.focus?.();
    };
  }, [onClose]);

  return ref;
}
