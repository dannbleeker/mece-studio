import { type ReactNode, useEffect, useRef, useState } from 'react';

/** One entry in a header dropdown: an action button, or a visual divider. */
export type MenuEntry =
  | { key: string; divider: true }
  | {
      key: string;
      label: ReactNode;
      onClick: () => void;
      disabled?: boolean;
      /** Render in a danger style (e.g. "Delete tree") to mark it as destructive. */
      destructive?: boolean;
    };

/**
 * A lightweight header dropdown: a trigger button that toggles a popover of
 * plain action buttons. Closes on outside-click, on Escape, and after any item
 * runs. Items stay real buttons (not role="menuitem") so they keep their
 * accessible names — the trigger carries aria-haspopup / aria-expanded.
 */
export function HeaderMenu({
  triggerLabel,
  triggerContent,
  triggerClassName,
  items,
  align = 'right',
}: {
  /** Accessible name for the trigger (used when the trigger is icon-only). */
  triggerLabel: string;
  triggerContent: ReactNode;
  triggerClassName: string;
  items: MenuEntry[];
  align?: 'left' | 'right';
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={triggerLabel}
        onClick={() => setOpen((v) => !v)}
        className={triggerClassName}
      >
        {triggerContent}
      </button>
      {open && (
        <div
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full z-30 mt-1 min-w-44 overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 shadow-xl`}
        >
          {items.map((it) =>
            'divider' in it ? (
              <span key={it.key} className="my-1 block h-px bg-neutral-100" />
            ) : (
              <button
                key={it.key}
                type="button"
                disabled={it.disabled}
                onClick={() => {
                  it.onClick();
                  setOpen(false);
                }}
                className={`flex w-full items-center px-3 py-1.5 text-left text-[13px] disabled:cursor-not-allowed disabled:text-neutral-300 ${
                  it.destructive
                    ? 'text-[#bd4a3a] hover:bg-[#f6e9e7]'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                {it.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
