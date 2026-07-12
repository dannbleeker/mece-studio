import { Dialog } from '@/components/Dialog';
import { advisoriesFor } from '@/domain/advisories';
import type { ProblemBrief, TreeMode } from '@/domain/types';
import { useStore } from '@/store';

type BriefField = keyof ProblemBrief;

/** The brief fields, in reading order: Context → People → Scope. */
const FIELDS: { key: BriefField; label: string; hint: string; area: boolean }[] = [
  {
    key: 'situation',
    label: 'Situation',
    hint: 'The stable, agreed context — only the relevant key facts.',
    area: true,
  },
  {
    key: 'complication',
    label: 'Complication',
    hint: 'What changed or is under threat — why act now.',
    area: true,
  },
  { key: 'owner', label: 'Owner', hint: 'Who owns the problem.', area: false },
  {
    key: 'decisionMakers',
    label: 'Decision-makers',
    hint: 'Who is involved in making the decision.',
    area: false,
  },
  {
    key: 'successCriteria',
    label: 'Success criteria',
    hint: 'How a solution will be judged good.',
    area: true,
  },
  {
    key: 'inScope',
    label: 'In scope',
    hint: 'Deliverables / questions inside the boundary.',
    area: true,
  },
  {
    key: 'outOfScope',
    label: 'Out of scope',
    hint: 'What you decide upfront NOT to tackle.',
    area: true,
  },
  {
    key: 'desiredOutcome',
    label: 'Desired outcome',
    hint: 'What should be true at the end of the project.',
    area: true,
  },
];

const FIELD_CLS =
  'rounded-md border border-neutral-300 px-2 py-1.5 text-[13px] text-neutral-800 focus:border-[#3f6fb0] focus:outline-none';

/**
 * The doc-level **Problem brief** ("Problem Identity Card", after Minto /
 * Chevallier): situation, complication, people, and scope — the framing that
 * comes before the tree and flows into the synthesis intro. Every field is
 * optional and commits on blur, like the rest of the app.
 */
export function ProblemBriefDialog({ onClose }: { onClose: () => void }) {
  const doc = useStore((s) => s.doc);
  const setProblemBrief = useStore((s) => s.setProblemBrief);
  const setTreeMode = useStore((s) => s.setTreeMode);
  const brief = doc.problemBrief;
  const mode = doc.mode;
  const rootLabel = doc.nodes[doc.rootId]?.label ?? '';
  const keyQuestionNotes = advisoriesFor(doc, doc.rootId).filter(
    (a) => a.category === 'key-question'
  );

  const update = (key: BriefField, value: string) =>
    setProblemBrief({ [key]: value } as Partial<ProblemBrief>);

  return (
    <Dialog
      label="Problem brief"
      subtitle="Frame the problem before the tree — situation, complication, and scope. Optional; it leads the synthesis."
      wide
      onClose={onClose}
    >
      <div className="mt-5 flex flex-col gap-4">
        <div className="rounded-md bg-[#f6f9fd] px-3 py-2">
          <span className="block font-medium text-[10px] text-[#3f6fb0] uppercase tracking-wider">
            Key question
          </span>
          <span className="block text-[13px] text-neutral-800">{rootLabel || 'Untitled'}</span>
          {keyQuestionNotes.map((a) => (
            <span key={a.id} className="mt-1 block text-[12px] text-[#8a5a14] leading-snug">
              💡 {a.message}
            </span>
          ))}
        </div>

        <div className="flex flex-col gap-1">
          <span className="font-medium text-[11px] text-neutral-400 uppercase tracking-wider">
            Tree type
          </span>
          <div className="flex gap-1">
            {([undefined, 'why', 'how'] as (TreeMode | undefined)[]).map((m) => {
              const active = mode === m;
              const label =
                m === 'why' ? 'Why (diagnostic)' : m === 'how' ? 'How (prescriptive)' : '—';
              return (
                <button
                  key={m ?? 'none'}
                  type="button"
                  aria-pressed={active}
                  aria-label={m ? `Tree type ${m}` : 'Tree type default'}
                  className={`flex-1 rounded px-2 py-1 text-[11px] ${
                    active
                      ? 'bg-[#3f6fb0] text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                  onClick={() => setTreeMode(m)}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <span className="text-[11px] text-neutral-400 leading-snug">
            A "why" tree breaks a problem into causes; a "how" tree lays out alternative solutions.
          </span>
        </div>

        {FIELDS.map((f) => {
          const fieldId = `brief-${f.key}`;
          return (
            <div key={f.key} className="flex flex-col gap-1">
              <label
                htmlFor={fieldId}
                className="font-medium text-[11px] text-neutral-400 uppercase tracking-wider"
              >
                {f.label}
              </label>
              {f.area ? (
                <textarea
                  id={fieldId}
                  key={`${doc.id}-${f.key}`}
                  defaultValue={brief?.[f.key] ?? ''}
                  rows={2}
                  className={`resize-none ${FIELD_CLS}`}
                  onBlur={(e) => update(f.key, e.target.value)}
                />
              ) : (
                <input
                  id={fieldId}
                  key={`${doc.id}-${f.key}`}
                  type="text"
                  defaultValue={brief?.[f.key] ?? ''}
                  className={FIELD_CLS}
                  onBlur={(e) => update(f.key, e.target.value)}
                />
              )}
              <span className="text-[11px] text-neutral-400 leading-snug">{f.hint}</span>
            </div>
          );
        })}
      </div>
    </Dialog>
  );
}
