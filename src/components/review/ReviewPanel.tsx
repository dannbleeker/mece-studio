import { type FlaggedSplit, flaggedSplits } from '@/domain/meceStatus';
import { priorityBand, priorityScore } from '@/domain/priority';
import type { IssueTreeDoc, NodeId } from '@/domain/types';
import { useStore } from '@/store';

type Axis = 'ME' | 'CE';

const BAND_TONE: Record<'low' | 'medium' | 'high', string> = {
  high: 'bg-[#dbe7f5] text-[#2c517f]',
  medium: 'bg-[#f5ecd8] text-[#8a5a14]',
  low: 'bg-[#efeee9] text-[#7a766c]',
};

/** A flagged split's parent priority score (0 when unset) — for ranking the dock. */
function priorityOf(doc: IssueTreeDoc, nodeId: NodeId): number {
  const p = doc.nodes[nodeId]?.priority;
  return p ? priorityScore(p) : 0;
}

function ReviewCard({
  doc,
  row,
  axis,
  selected,
  onLocate,
  onReview,
  onRemedy,
}: {
  doc: IssueTreeDoc;
  row: FlaggedSplit;
  axis: Axis;
  selected: boolean;
  onLocate: () => void;
  onReview: () => void;
  onRemedy?: () => void;
}) {
  const priority = doc.nodes[row.nodeId]?.priority;
  const band = priority ? priorityBand(priority) : null;
  const message = axis === 'ME' ? row.exclusive : row.exhaustive;

  return (
    <div
      className={`mb-2 rounded-lg border p-3 ${selected ? 'border-[#3f6fb0]' : 'border-[#e7e4dc]'}`}
    >
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onLocate}
          className="min-w-0 flex-1 truncate text-left font-medium text-[13px] text-neutral-800 focus:outline-none focus-visible:underline"
        >
          {row.label}
        </button>
        {band && (
          <span className={`shrink-0 rounded px-1 py-px text-[9px] uppercase ${BAND_TONE[band]}`}>
            {band}
          </span>
        )}
        <button
          type="button"
          onClick={onLocate}
          aria-label="Locate on canvas"
          className="shrink-0 text-[11px] text-neutral-400 hover:text-neutral-700"
        >
          ◎
        </button>
      </div>
      <p className="mt-1 text-[12px] text-neutral-600 leading-snug">{message}</p>
      <div className="mt-2 flex gap-1.5">
        <button
          type="button"
          onClick={onReview}
          className="rounded-md border border-[#3f6fb0] px-2 py-1 font-medium text-[11px] text-[#3f6fb0] hover:bg-[#eef2f9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3f6fb0]/40"
        >
          Review logic →
        </button>
        {axis === 'CE' && onRemedy && (
          <button
            type="button"
            onClick={onRemedy}
            className="rounded-md bg-[#3f6fb0] px-2 py-1 font-medium text-[11px] text-white hover:bg-[#365f98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3f6fb0]/40"
          >
            {row.decomposition === 'segment' ? 'Add an “Other” bucket' : 'Add a sub-issue'}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * The tree-level MECE review dock: every flagged split, **grouped by axis**
 * (Overlaps / Gaps) and **ranked by the branch's priority** so the 80/20 flags
 * surface first. Each row locates the node (◎ / the label), jumps to the
 * inspector's Logic tab (**Review logic**, which closes the dock so the tab shows),
 * and CE gaps keep the one-click remedy.
 */
export function ReviewPanel() {
  const doc = useStore((s) => s.doc);
  const selectedId = useStore((s) => s.selectedId);
  const locate = useStore((s) => s.locate);
  const addChild = useStore((s) => s.addChild);
  const setReviewOpen = useStore((s) => s.setReviewOpen);

  const rows = flaggedSplits(doc);
  const byPriority = (a: FlaggedSplit, b: FlaggedSplit) =>
    priorityOf(doc, b.nodeId) - priorityOf(doc, a.nodeId);
  const overlaps = rows.filter((r) => r.exclusive).sort(byPriority);
  const gaps = rows.filter((r) => r.exhaustive).sort(byPriority);

  // Jump to the flagged node's Logic tab: select + centre, then close the dock so
  // the (auto-focusing) inspector Logic tab shows.
  const reviewLogic = (nodeId: NodeId) => {
    locate(nodeId);
    setReviewOpen(false);
  };

  return (
    <aside
      className="flex h-full w-full flex-col border-neutral-200 bg-white sm:w-80 sm:shrink-0 sm:border-l"
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
          <>
            {overlaps.length > 0 && (
              <>
                <h3 className="mb-1.5 font-medium text-[10px] text-neutral-400 uppercase tracking-wider">
                  Overlaps · not mutually exclusive
                </h3>
                {overlaps.map((row) => (
                  <ReviewCard
                    key={`me-${row.nodeId}`}
                    doc={doc}
                    row={row}
                    axis="ME"
                    selected={selectedId === row.nodeId}
                    onLocate={() => locate(row.nodeId)}
                    onReview={() => reviewLogic(row.nodeId)}
                  />
                ))}
              </>
            )}
            {gaps.length > 0 && (
              <>
                <h3 className="mt-3 mb-1.5 font-medium text-[10px] text-neutral-400 uppercase tracking-wider">
                  Gaps · not collectively exhaustive
                </h3>
                {gaps.map((row) => (
                  <ReviewCard
                    key={`ce-${row.nodeId}`}
                    doc={doc}
                    row={row}
                    axis="CE"
                    selected={selectedId === row.nodeId}
                    onLocate={() => locate(row.nodeId)}
                    onReview={() => reviewLogic(row.nodeId)}
                    onRemedy={() =>
                      addChild(row.nodeId, row.decomposition === 'segment' ? 'Other' : undefined)
                    }
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
