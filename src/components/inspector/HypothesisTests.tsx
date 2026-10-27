import { explainsOf, factsOf } from '@/domain/diagnosis';
import type { ExplainVerdict, IssueNode } from '@/domain/types';
import { useEditorMessages } from '@/i18n/useEditorMessages';
import { useStore } from '@/store';

const LABEL_CLS = 'font-medium text-[11px] text-neutral-400 uppercase tracking-wider';
const AREA_CLS =
  'resize-none rounded-md border border-neutral-300 px-2 py-1.5 text-[12px] text-neutral-800 focus:border-[#3f6fb0] focus:outline-none';

const VERDICTS: ExplainVerdict[] = ['yes', 'partly', 'no'];
const VERDICT_ACTIVE: Record<ExplainVerdict, string> = {
  yes: 'bg-[#3f7d54] text-white',
  partly: 'bg-[#b07a2a] text-white',
  no: 'bg-[#bd4a3a] text-white',
};

/**
 * Hypothesis-driven testing for one node: the result that would prove it
 * wrong, what we expect if it's right, and — when the brief lists "is / is
 * not" facts — whether it explains each one. Not shown on the root: the root
 * is the question, not a hypothesis.
 */
export function HypothesisTests({ node }: { node: IssueNode }) {
  const m = useEditorMessages();
  const doc = useStore((s) => s.doc);
  const setKillTest = useStore((s) => s.setKillTest);
  const setPrediction = useStore((s) => s.setPrediction);
  const setExplains = useStore((s) => s.setExplains);
  const facts = factsOf(doc);
  const verdicts = explainsOf(node);

  return (
    <section className="flex flex-col gap-2 border-neutral-100 border-t pt-3">
      <label className="flex flex-col gap-1">
        <span className={LABEL_CLS}>{m.inspector.killTestLabel}</span>
        <textarea
          key={`${node.id}-kill-${node.killTest ?? ''}`}
          defaultValue={node.killTest ?? ''}
          rows={2}
          placeholder={m.inspector.killTestPlaceholder}
          className={AREA_CLS}
          onBlur={(e) => setKillTest(node.id, e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className={LABEL_CLS}>{m.inspector.predictionLabel}</span>
        <textarea
          key={`${node.id}-prediction-${node.prediction ?? ''}`}
          defaultValue={node.prediction ?? ''}
          rows={2}
          placeholder={m.inspector.predictionPlaceholder}
          className={AREA_CLS}
          onBlur={(e) => setPrediction(node.id, e.target.value)}
        />
      </label>

      {facts.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className={LABEL_CLS}>{m.inspector.explainsHeading}</span>
          <ul className="flex flex-col gap-1">
            {facts.map((f) => (
              <li key={f.id} className="flex items-center gap-1.5 text-[12px]">
                <span className="min-w-0 flex-1 truncate text-neutral-700" title={f.is}>
                  <span className="text-neutral-400">{m.brief.factDimension[f.dimension]}:</span>{' '}
                  {f.is || m.content.untitled}
                </span>
                <span className="flex shrink-0 gap-0.5">
                  {VERDICTS.map((v) => {
                    const active = verdicts[f.id] === v;
                    return (
                      <button
                        key={v}
                        type="button"
                        aria-pressed={active}
                        aria-label={m.brief.gridCellLabel({
                          hypothesis: node.label,
                          fact: f.is,
                          verdict: m.brief.verdict[v],
                        })}
                        title={m.brief.verdict[v]}
                        className={`w-6 rounded py-0.5 text-[11px] ${
                          active
                            ? VERDICT_ACTIVE[v]
                            : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                        }`}
                        onClick={() => setExplains(node.id, f.id, active ? null : v)}
                      >
                        {m.brief.verdictGlyph[v]}
                      </button>
                    );
                  })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
