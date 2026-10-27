import { Dialog } from '@/components/Dialog';
import { advisoriesFor } from '@/domain/advisories';
import { FACT_DIMENSIONS, factsOf } from '@/domain/diagnosis';
import type { FactDimension, ProblemBrief, TreeMode } from '@/domain/types';
import { renderAdvisory } from '@/i18n/render';
import { useEditorMessages } from '@/i18n/useEditorMessages';
import { useStore } from '@/store';

type BriefField = keyof ProblemBrief;

/**
 * The brief fields, in reading order: Context → People → Scope. Only the shape
 * lives here — every label and hint comes from `m.brief.fields`.
 */
const FIELDS: { key: BriefField; area: boolean }[] = [
  { key: 'situation', area: true },
  { key: 'complication', area: true },
  { key: 'owner', area: false },
  { key: 'decisionMakers', area: false },
  { key: 'successCriteria', area: true },
  { key: 'inScope', area: true },
  { key: 'outOfScope', area: true },
  { key: 'desiredOutcome', area: true },
];

/** The tree-type choices, `undefined` being "no type set". */
const TREE_MODES: (TreeMode | undefined)[] = [undefined, 'why', 'how'];

const FIELD_CLS =
  'rounded-md border border-neutral-300 px-2 py-1.5 text-[13px] text-neutral-800 focus:border-[#3f6fb0] focus:outline-none';

/**
 * The doc-level **Problem brief** ("Problem Identity Card", after Minto /
 * Chevallier): situation, complication, people, and scope — the framing that
 * comes before the tree and flows into the synthesis intro. Every field is
 * optional and commits on blur, like the rest of the app.
 */
export function ProblemBriefDialog({ onClose }: { onClose: () => void }) {
  const m = useEditorMessages();
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
    <Dialog label={m.brief.title} subtitle={m.brief.subtitle} wide onClose={onClose}>
      <div className="mt-5 flex flex-col gap-4">
        <div className="rounded-md bg-[#f6f9fd] px-3 py-2">
          <span className="block font-medium text-[10px] text-[#3f6fb0] uppercase tracking-wider">
            {m.brief.keyQuestionLabel}
          </span>
          <span className="block text-[13px] text-neutral-800">
            {rootLabel || m.content.untitled}
          </span>
          {keyQuestionNotes.map((a) => (
            <span key={a.id} className="mt-1 block text-[12px] text-[#8a5a14] leading-snug">
              💡 {renderAdvisory(m, a.message)}
            </span>
          ))}
        </div>

        <div className="flex flex-col gap-1">
          <span className="font-medium text-[11px] text-neutral-400 uppercase tracking-wider">
            {m.brief.treeTypeLabel}
          </span>
          <div className="flex gap-1">
            {TREE_MODES.map((option) => {
              const active = mode === option;
              return (
                <button
                  key={option ?? 'none'}
                  type="button"
                  aria-pressed={active}
                  aria-label={
                    option
                      ? m.brief.treeTypeName({ mode: m.enums.treeMode[option] })
                      : m.brief.treeTypeDefaultName
                  }
                  className={`flex-1 rounded px-2 py-1 text-[11px] ${
                    active
                      ? 'bg-[#3f6fb0] text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                  onClick={() => setTreeMode(option)}
                >
                  {m.brief.treeTypeOption[option ?? 'none']}
                </button>
              );
            })}
          </div>
          <span className="text-[11px] text-neutral-400 leading-snug">{m.brief.treeTypeHint}</span>
        </div>

        {FIELDS.map((f) => {
          const fieldId = `brief-${f.key}`;
          const field = m.brief.fields[f.key];
          return (
            <div key={f.key} className="flex flex-col gap-1">
              <label
                htmlFor={fieldId}
                className="font-medium text-[11px] text-neutral-400 uppercase tracking-wider"
              >
                {field.label}
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
              <span className="text-[11px] text-neutral-400 leading-snug">{field.hint}</span>
            </div>
          );
        })}

        <FactsEditor />
      </div>
    </Dialog>
  );
}

/**
 * The "is / is not" facts (Kepner-Tregoe): what the problem IS against the
 * closest thing it IS NOT, on what / where / when / how much. Each row commits
 * on blur like the rest of the brief.
 */
function FactsEditor() {
  const m = useEditorMessages();
  const doc = useStore((s) => s.doc);
  const addFact = useStore((s) => s.addFact);
  const updateFact = useStore((s) => s.updateFact);
  const removeFact = useStore((s) => s.removeFact);
  const facts = factsOf(doc);

  return (
    <section className="flex flex-col gap-2 border-neutral-100 border-t pt-4">
      <span className="font-medium text-[11px] text-neutral-400 uppercase tracking-wider">
        {m.brief.factsHeading}
      </span>
      <span className="text-[11px] text-neutral-400 leading-snug">{m.brief.factsHint}</span>
      {facts.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {facts.map((f) => (
            <li key={f.id} className="grid grid-cols-[6rem_1fr_1fr_auto] items-center gap-1.5">
              <select
                aria-label={m.brief.factDimensionLabel}
                value={f.dimension}
                className={FIELD_CLS}
                onChange={(e) => updateFact(f.id, { dimension: e.target.value as FactDimension })}
              >
                {FACT_DIMENSIONS.map((d) => (
                  <option key={d} value={d}>
                    {m.brief.factDimension[d]}
                  </option>
                ))}
              </select>
              <input
                key={`${f.id}-is-${f.is}`}
                aria-label={m.brief.factIsLabel}
                defaultValue={f.is}
                placeholder={m.brief.factIsPlaceholder}
                className={FIELD_CLS}
                onBlur={(e) => updateFact(f.id, { is: e.target.value })}
              />
              <input
                key={`${f.id}-isnot-${f.isNot ?? ''}`}
                aria-label={m.brief.factIsNotLabel}
                defaultValue={f.isNot ?? ''}
                placeholder={m.brief.factIsNotPlaceholder}
                className={FIELD_CLS}
                onBlur={(e) => updateFact(f.id, { isNot: e.target.value })}
              />
              <button
                type="button"
                aria-label={m.brief.removeFact}
                title={m.brief.removeFact}
                className="px-1 text-neutral-300 hover:text-neutral-600"
                onClick={() => removeFact(f.id)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        className="self-start rounded-md bg-neutral-100 px-2 py-1 text-[11px] text-neutral-600 hover:bg-neutral-200"
        onClick={() => addFact('what')}
      >
        {m.brief.addFact}
      </button>
    </section>
  );
}
