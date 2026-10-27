import { Dialog } from '@/components/Dialog';
import { explainsOf, factsOf } from '@/domain/diagnosis';
import { childrenOf } from '@/domain/tree';
import type { ExplainVerdict, IssueNode, IssueTreeDoc, NodeId } from '@/domain/types';
import { useEditorMessages } from '@/i18n/useEditorMessages';
import { useStore } from '@/store';

/** The click cycle for a cell: not judged → explains → partly → doesn't → not judged. */
const NEXT: Record<ExplainVerdict | 'none', ExplainVerdict | null> = {
  none: 'yes',
  yes: 'partly',
  partly: 'no',
  no: null,
};

const CELL_TONE: Record<ExplainVerdict | 'none', string> = {
  yes: 'bg-[#e3f0e6] text-[#2f6a44]',
  partly: 'bg-[#f6ecd9] text-[#8a5a14]',
  no: 'bg-[#f6e3e0] text-[#a23b2c]',
  none: 'bg-neutral-50 text-neutral-300',
};

/** Every non-root node in tree order, with its depth below the root. */
function hypothesesInOrder(doc: IssueTreeDoc): { node: IssueNode; depth: number }[] {
  const out: { node: IssueNode; depth: number }[] = [];
  const visit = (id: NodeId, depth: number) => {
    const node = doc.nodes[id];
    if (!node) return;
    if (id !== doc.rootId) out.push({ node, depth });
    for (const child of childrenOf(doc, id)) visit(child.id, depth + 1);
  };
  visit(doc.rootId, 0);
  return out;
}

/**
 * Every hypothesis against every "is / is not" fact, on one screen — the
 * Kepner-Tregoe test that a root cause must explain the whole pattern. The
 * user marks each cell; the last column reads the row back. Nothing here is
 * computed into a verdict on the hypothesis itself.
 */
export function MustExplainGrid({ onClose }: { onClose: () => void }) {
  const m = useEditorMessages();
  const doc = useStore((s) => s.doc);
  const setExplains = useStore((s) => s.setExplains);
  const locate = useStore((s) => s.locate);
  const facts = factsOf(doc);
  const rows = hypothesesInOrder(doc);

  return (
    <Dialog label={m.brief.gridTitle} subtitle={m.brief.gridSubtitle} wide onClose={onClose}>
      {facts.length === 0 ? (
        <p className="mt-5 text-[13px] text-neutral-500">{m.brief.gridNoFacts}</p>
      ) : (
        <div className="mt-5 max-h-[65vh] overflow-auto">
          <table className="w-full border-collapse text-[12px]">
            <thead className="sticky top-0 bg-white">
              <tr>
                <th className="py-1.5 pr-2 text-left font-medium text-neutral-500">
                  {m.brief.gridHypothesis}
                </th>
                {facts.map((f) => (
                  <th
                    key={f.id}
                    scope="col"
                    title={f.isNot ? `${f.is} — ${m.brief.factIsNotLabel}: ${f.isNot}` : f.is}
                    className="max-w-[8rem] px-1 py-1.5 text-left align-bottom font-medium text-neutral-500"
                  >
                    <span className="block text-[10px] text-neutral-400 uppercase tracking-wider">
                      {m.brief.factDimension[f.dimension]}
                    </span>
                    <span className="line-clamp-2">{f.is || m.content.untitled}</span>
                  </th>
                ))}
                <th className="py-1.5 pl-2 text-left font-medium text-neutral-500">
                  {m.brief.gridSummary}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ node, depth }) => {
                const verdicts = explainsOf(node);
                const judged = facts.filter((f) => f.id in verdicts).length;
                const failed = facts.filter((f) => verdicts[f.id] === 'no').length;
                const all = facts.every((f) => verdicts[f.id] === 'yes');
                const summary = all
                  ? m.brief.gridExplainsAll
                  : failed > 0
                    ? m.brief.gridFails({ count: failed })
                    : m.brief.gridOpen({ judged, total: facts.length });
                return (
                  <tr key={node.id} className="border-neutral-100 border-t">
                    <th scope="row" className="py-1 pr-2 text-left font-normal">
                      <button
                        type="button"
                        className="text-left text-neutral-700 hover:text-[#3f6fb0] hover:underline"
                        style={{ paddingLeft: `${(depth - 1) * 12}px` }}
                        onClick={() => {
                          locate(node.id);
                          onClose();
                        }}
                      >
                        {node.label || m.content.untitled}
                      </button>
                    </th>
                    {facts.map((f) => {
                      const v: ExplainVerdict | 'none' =
                        (verdicts[f.id] as ExplainVerdict | undefined) ?? 'none';
                      return (
                        <td key={f.id} className="px-1 py-1 text-center">
                          <button
                            type="button"
                            aria-label={m.brief.gridCellLabel({
                              hypothesis: node.label,
                              fact: f.is,
                              verdict: v === 'none' ? m.brief.verdictClear : m.brief.verdict[v],
                            })}
                            className={`h-6 w-8 rounded font-medium ${CELL_TONE[v]} hover:ring-1 hover:ring-[#3f6fb0]`}
                            onClick={() => setExplains(node.id, f.id, NEXT[v])}
                          >
                            {m.brief.verdictGlyph[v]}
                          </button>
                        </td>
                      );
                    })}
                    <td
                      className={`py-1 pl-2 ${
                        all ? 'text-[#2f6a44]' : failed > 0 ? 'text-[#a23b2c]' : 'text-neutral-400'
                      }`}
                    >
                      {summary}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Dialog>
  );
}
