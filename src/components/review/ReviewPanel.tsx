import { type FlaggedSplit, flaggedSplits } from '@/domain/meceStatus';
import { useStore } from '@/store';

function ReviewLine({ tier, msg }: { tier: string; msg: string }) {
  return (
    <div className="mt-1.5">
      <div className="font-medium text-[10px] text-[#bd842c] uppercase tracking-wide">{tier}</div>
      <p className="text-[12px] text-neutral-600 leading-snug">{msg}</p>
    </div>
  );
}

function ReviewCard({
  row,
  selected,
  onLocate,
  onRemedy,
}: {
  row: FlaggedSplit;
  selected: boolean;
  onLocate: () => void;
  onRemedy: () => void;
}) {
  return (
    <div
      className={`mb-2 rounded-lg border p-3 ${selected ? 'border-[#3f6fb0]' : 'border-[#e7e4dc]'}`}
    >
      <button
        type="button"
        onClick={onLocate}
        className="flex w-full items-center gap-1.5 text-left focus:outline-none focus-visible:underline"
      >
        <span className="truncate font-medium text-[13px] text-neutral-800">{row.label}</span>
        <span className="ml-auto shrink-0 text-[11px] text-neutral-400">◎ locate</span>
      </button>
      {row.exclusive && <ReviewLine tier="Mutually exclusive" msg={row.exclusive} />}
      {row.exhaustive && <ReviewLine tier="Collectively exhaustive" msg={row.exhaustive} />}
      {row.exhaustive && (
        <button
          type="button"
          onClick={onRemedy}
          className="mt-2 rounded-md bg-[#3f6fb0] px-2 py-1 font-medium text-[11px] text-white hover:bg-[#365f98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3f6fb0]/40"
        >
          {row.decomposition === 'segment' ? 'Add an “Other” bucket' : 'Add a sub-issue'}
        </button>
      )}
    </div>
  );
}

/**
 * The tree-level MECE review dock (right side, mutually exclusive with the
 * inspector). Lists every flagged split; a row locates the node on the canvas,
 * and CE gaps get a one-click remedy (an "Other" bucket for segments, otherwise a
 * fresh sub-issue) that re-runs the engine and clears the row when it's fixed.
 */
export function ReviewPanel() {
  const doc = useStore((s) => s.doc);
  const selectedId = useStore((s) => s.selectedId);
  const locate = useStore((s) => s.locate);
  const addChild = useStore((s) => s.addChild);
  const setReviewOpen = useStore((s) => s.setReviewOpen);
  const rows = flaggedSplits(doc);

  return (
    <aside
      className="flex w-80 shrink-0 flex-col border-neutral-200 border-l bg-white"
      aria-label="MECE review"
    >
      <div className="flex items-center gap-2 border-neutral-100 border-b px-4 py-3">
        <span aria-hidden="true" className="text-[#bd842c]">
          ⚠
        </span>
        <span className="font-semibold text-[14px] text-neutral-800">MECE review</span>
        <span className="rounded-full bg-[#f8efdd] px-2 py-0.5 font-medium text-[#bd842c] text-[11px]">
          {rows.length} open
        </span>
        <button
          type="button"
          onClick={() => setReviewOpen(false)}
          aria-label="Close review"
          className="ml-auto rounded px-1 text-neutral-400 text-sm hover:text-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3f6fb0]/40"
        >
          ✕
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {rows.length === 0 ? (
          <p className="px-1 py-6 text-center text-[13px] text-neutral-500 leading-relaxed">
            Every split is MECE clean — nothing to review.
          </p>
        ) : (
          rows.map((row) => (
            <ReviewCard
              key={row.nodeId}
              row={row}
              selected={selectedId === row.nodeId}
              onLocate={() => locate(row.nodeId)}
              onRemedy={() =>
                addChild(row.nodeId, row.decomposition === 'segment' ? 'Other' : undefined)
              }
            />
          ))
        )}
      </div>
    </aside>
  );
}
