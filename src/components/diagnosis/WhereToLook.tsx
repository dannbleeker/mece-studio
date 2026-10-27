import { Dialog } from '@/components/Dialog';
import { whereToLook } from '@/domain/nextLook';
import { useEditorMessages } from '@/i18n/useEditorMessages';
import { useStore } from '@/store';

/**
 * The open hypotheses worth testing first: impact × uncertainty, highest
 * first. Read-only: clicking a row locates the node so the user can act on it.
 */
export function WhereToLook({ onClose }: { onClose: () => void }) {
  const m = useEditorMessages();
  const doc = useStore((s) => s.doc);
  const locate = useStore((s) => s.locate);
  const rows = whereToLook(doc);

  return (
    <Dialog label={m.brief.lookTitle} subtitle={m.brief.lookSubtitle} wide onClose={onClose}>
      {rows.length === 0 ? (
        <p className="mt-5 text-[13px] text-neutral-500">{m.brief.lookEmpty}</p>
      ) : (
        <ol className="mt-5 flex max-h-[65vh] flex-col gap-1 overflow-auto">
          {rows.map((row, i) => {
            const node = doc.nodes[row.nodeId];
            if (!node) return null;
            return (
              <li key={row.nodeId}>
                <button
                  type="button"
                  className="flex w-full items-baseline gap-3 rounded-md px-2 py-1.5 text-left hover:bg-[#f2f6fb]"
                  onClick={() => {
                    locate(row.nodeId);
                    onClose();
                  }}
                >
                  <span className="w-5 shrink-0 text-right text-[12px] text-neutral-400 tabular-nums">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] text-neutral-800">
                      {node.label || m.content.untitled}
                    </span>
                    <span className="block text-[11px] text-neutral-500">
                      {[
                        m.brief.lookImpact({ level: row.impact }),
                        m.brief.uncertainty[row.uncertainty],
                        row.hasKillTest ? null : m.brief.lookNoKillTest,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] text-neutral-400 tabular-nums">
                    {m.brief.lookScore({ score: row.score })}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </Dialog>
  );
}
