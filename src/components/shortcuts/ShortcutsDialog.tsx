import { useModalFocus } from '@/components/useModalFocus';

interface ShortcutsDialogProps {
  onClose: () => void;
}

// Mirrors the "Keyboard reference" table in USER_GUIDE.md — keep the two in sync.
const SHORTCUTS: { keys: string[]; action: string }[] = [
  { keys: ['Tab'], action: 'Add a child to the selected node and edit it' },
  { keys: ['Enter', 'F2'], action: "Edit the selected node's label" },
  { keys: ['Double-click'], action: "Edit a node's label inline" },
  { keys: ['Escape'], action: 'Cancel an edit · close a dialog' },
  { keys: ['Delete', 'Backspace'], action: 'Remove the selected node and its subtree' },
  { keys: ['Ctrl / ⌘ + Z'], action: 'Undo' },
  { keys: ['Ctrl / ⌘ + Y', 'Ctrl / ⌘ + Shift + Z'], action: 'Redo' },
  { keys: ['Enter'], action: 'Zoom to matches (in the Find box)' },
  { keys: ['?'], action: 'Show this shortcuts list' },
];

const KBD =
  'rounded border border-neutral-300 border-b-2 bg-neutral-50 px-1.5 py-0.5 font-mono text-[11px] text-neutral-700';

export function ShortcutsDialog({ onClose }: ShortcutsDialogProps) {
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
        aria-label="Keyboard shortcuts"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-[#3f6fb0] text-lg tracking-tight">
              Keyboard shortcuts
            </h2>
            <p className="mt-1 text-[13px] text-neutral-500 leading-relaxed">
              These work on the canvas — they're ignored while you're typing in a field.
            </p>
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

        <table className="mt-5 w-full">
          <tbody>
            {SHORTCUTS.map((s) => (
              <tr key={s.action} className="border-neutral-100 border-b last:border-0">
                <td className="py-1.5 pr-4 text-[13px] text-neutral-700">{s.action}</td>
                <td className="whitespace-nowrap py-1.5 text-right">
                  {s.keys.map((k, i) => (
                    <span key={k}>
                      {i > 0 && <span className="mx-1 text-[11px] text-neutral-400">or</span>}
                      <kbd className={KBD}>{k}</kbd>
                    </span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
