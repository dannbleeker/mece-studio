import type { Level, NodeStatus } from '@/domain/types';
import { useStore } from '@/store';

const STATUSES: NodeStatus[] = ['open', 'supported', 'refuted', 'parked'];
const STATUS_TONE: Record<NodeStatus, string> = {
  open: 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
  supported: 'bg-[#eaf2ea] text-[#2f6a44] hover:bg-[#dcebdc]',
  refuted: 'bg-[#f6e9e7] text-[#a23b2c] hover:bg-[#f0ddda]',
  parked: 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200',
};
const LEVELS: [Level, string][] = [
  ['high', 'H'],
  ['medium', 'M'],
  ['low', 'L'],
];

/**
 * A floating action bar for a multi-node selection — shown only when 2+ nodes
 * are selected (⌘/Ctrl/Shift-click). Each action runs over the whole selection
 * in one undoable step; the inspector still edits the primary node.
 */
export function SelectionBar() {
  const selectedIds = useStore((s) => s.selectedIds);
  const setStatusMany = useStore((s) => s.setStatusMany);
  const setPriorityMany = useStore((s) => s.setPriorityMany);
  const removeNodes = useStore((s) => s.removeNodes);
  const select = useStore((s) => s.select);

  if (selectedIds.length < 2) return null;

  return (
    <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-[#e7e4dc] bg-white/95 px-3 py-1.5 shadow-lg">
      <span className="font-medium text-[12px] text-neutral-700">
        {selectedIds.length} selected
      </span>
      <span className="h-4 w-px bg-neutral-200" />
      <span className="flex gap-1">
        {STATUSES.map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusMany(selectedIds, st)}
            className={`rounded px-1.5 py-0.5 text-[11px] capitalize ${STATUS_TONE[st]}`}
          >
            {st}
          </button>
        ))}
      </span>
      <span className="h-4 w-px bg-neutral-200" />
      <span className="flex items-center gap-1">
        <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Priority</span>
        {LEVELS.map(([lvl, abbr]) => (
          <button
            key={lvl}
            type="button"
            title={lvl}
            aria-label={`Set priority ${lvl}`}
            onClick={() => setPriorityMany(selectedIds, { impact: lvl, ease: lvl })}
            className="rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] text-neutral-600 hover:bg-neutral-200"
          >
            {abbr}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPriorityMany(selectedIds, undefined)}
          className="rounded px-1 text-[11px] text-neutral-400 hover:text-neutral-700"
        >
          clear
        </button>
      </span>
      <span className="h-4 w-px bg-neutral-200" />
      <button
        type="button"
        onClick={() => removeNodes(selectedIds)}
        className="rounded-md bg-[#bd4a3a] px-2 py-0.5 font-medium text-[11px] text-white hover:bg-[#a53f31]"
      >
        Delete
      </button>
      <button
        type="button"
        onClick={() => select(null)}
        className="rounded px-1.5 text-[11px] text-neutral-500 hover:text-neutral-800"
      >
        Clear
      </button>
    </div>
  );
}
