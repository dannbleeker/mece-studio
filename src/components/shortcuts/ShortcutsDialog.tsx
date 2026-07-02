import { Dialog } from '@/components/Dialog';

// Mirrors the "Keyboard reference" table in USER_GUIDE.md — keep the two in sync.
const SHORTCUTS: { keys: string[]; action: string }[] = [
  { keys: ['Tab'], action: 'Add a child to the selected node and edit it' },
  { keys: ['Enter', 'F2'], action: "Edit the selected node's label" },
  { keys: ['Double-click'], action: "Edit a node's label inline" },
  { keys: ['Escape'], action: 'Cancel an edit · close a dialog' },
  { keys: ['Delete', 'Backspace'], action: 'Remove the selected node and its subtree' },
  { keys: ['P'], action: "Bump the selected node's priority (none → low → medium → high)" },
  { keys: ['Ctrl / ⌘ + Z'], action: 'Undo' },
  { keys: ['Ctrl / ⌘ + Y', 'Ctrl / ⌘ + Shift + Z'], action: 'Redo' },
  { keys: ['Enter'], action: 'Zoom to matches (in the Find box)' },
  { keys: ['?'], action: 'Show this shortcuts list' },
];

const KBD =
  'rounded border border-neutral-300 border-b-2 bg-neutral-50 px-1.5 py-0.5 font-mono text-[11px] text-neutral-700';

export function ShortcutsDialog({ onClose }: { onClose: () => void }) {
  return (
    <Dialog
      label="Keyboard shortcuts"
      subtitle="These work on the canvas — they're ignored while you're typing in a field."
      onClose={onClose}
    >
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
    </Dialog>
  );
}
