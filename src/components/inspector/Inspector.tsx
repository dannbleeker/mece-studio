import { Fragment, useEffect, useMemo, useState } from 'react';
import { CHECK_STATE_COLOR, CHECK_STATE_GLYPH } from '@/components/checkColors';
import { advisoriesFor } from '@/domain/advisories';
import { decomposePrompt } from '@/domain/aiPrompts';
import { DECOMPOSITION_TYPES } from '@/domain/constants';
import { priorityBand } from '@/domain/priority';
import { rollUpValue } from '@/domain/rollup';
import { sensitivity } from '@/domain/sensitivity';
import { splitOf } from '@/domain/tree';
import type {
  CheckResult,
  DecompositionType,
  EvidenceStrength,
  FormulaOperator,
  Level,
  NodeStatus,
  SplitLogic,
  SplitOrder,
} from '@/domain/types';
import { renderAdvisory, renderMece } from '@/i18n/render';
import { useMessages } from '@/i18n/useMessages';
import { copyToClipboard } from '@/services/download';
import { useStore } from '@/store';

// Shared Tailwind class strings — named so the inspector's many labels/inputs can't drift.
const LABEL_CLS = 'font-medium text-[11px] text-neutral-400 uppercase tracking-wider';
const INPUT_CLS =
  'rounded-md border border-neutral-300 px-2 py-1.5 text-[13px] text-neutral-800 focus:border-[#3f6fb0] focus:outline-none';

/** Evidence strengths, weakest → strongest — used by the draft + per-item pickers. */
const STRENGTHS: EvidenceStrength[] = ['anecdote', 'indicative', 'strong'];

/** How a formula split's children combine, in the order the picker offers them. */
const OPERATORS: FormulaOperator[] = ['sum', 'product', 'difference'];

const STATUS_ACTIVE: Record<NodeStatus, string> = {
  open: 'bg-[#3f6fb0] text-white',
  supported: 'bg-[#3f7d54] text-white',
  refuted: 'bg-[#bd4a3a] text-white',
  parked: 'bg-neutral-500 text-white',
};

/** The inspector facets, shown one at a time. */
type TabId = 'issue' | 'logic' | 'evidence' | 'value';

function MeceRow({ label, result }: { label: string; result: CheckResult }) {
  const m = useMessages();
  const finding = result.message
    ? renderMece(m, result.message)
    : result.state === 'unknown'
      ? m.inspector.notYetChecked
      : '';
  return (
    <div className="flex gap-2 py-1">
      <span
        aria-hidden="true"
        className="mt-px shrink-0 font-bold text-[13px] leading-none"
        style={{ color: CHECK_STATE_COLOR[result.state] }}
        title={m.inspector.axisState({ axis: label, state: m.enums.checkState[result.state] })}
      >
        {CHECK_STATE_GLYPH[result.state]}
      </span>
      <span className="text-[12px] text-neutral-600 leading-snug">
        <span className="font-medium text-neutral-800">
          {m.inspector.axisLead({ axis: label })}
        </span>{' '}
        {finding}
      </span>
    </div>
  );
}

export function Inspector() {
  const m = useMessages();
  const doc = useStore((s) => s.doc);
  const selectedId = useStore((s) => s.selectedId);
  const selectedIds = useStore((s) => s.selectedIds);
  const setRootQuestion = useStore((s) => s.setRootQuestion);
  const renameNode = useStore((s) => s.renameNode);
  const setDetail = useStore((s) => s.setDetail);
  const setAmount = useStore((s) => s.setAmount);
  const setUnit = useStore((s) => s.setUnit);
  const setDecomposition = useStore((s) => s.setDecomposition);
  const setOperator = useStore((s) => s.setOperator);
  const setDimension = useStore((s) => s.setDimension);
  const setSplitLogic = useStore((s) => s.setSplitLogic);
  const setSplitSummary = useStore((s) => s.setSplitSummary);
  const setSplitOrder = useStore((s) => s.setSplitOrder);
  const decompose = useStore((s) => s.decompose);
  const captureChildren = useStore((s) => s.captureChildren);
  const setPriority = useStore((s) => s.setPriority);
  const setStatus = useStore((s) => s.setStatus);
  const addEvidence = useStore((s) => s.addEvidence);
  const removeEvidence = useStore((s) => s.removeEvidence);
  const updateEvidence = useStore((s) => s.updateEvidence);
  const addChild = useStore((s) => s.addChild);
  const removeNode = useStore((s) => s.removeNode);
  const duplicateNode = useStore((s) => s.duplicateNode);
  const moveSibling = useStore((s) => s.moveSibling);
  const [evidenceDraft, setEvidenceDraft] = useState('');
  const [draftStrength, setDraftStrength] = useState<EvidenceStrength>('indicative');
  const [aiPaste, setAiPaste] = useState('');

  // Coaching advisories for the selected node (never MECE findings — see advisories.ts).
  const nodeAdvisories = useMemo(
    () => (selectedId ? advisoriesFor(doc, selectedId) : []),
    [doc, selectedId]
  );

  const node = selectedId ? doc.nodes[selectedId] : undefined;
  const split = selectedId ? splitOf(doc, selectedId) : undefined;
  const flagged = split
    ? split.mece.exclusive.state === 'warn' || split.mece.exhaustive.state === 'warn'
    : false;

  const [tab, setTab] = useState<TabId>(() => (flagged ? 'logic' : 'issue'));
  // On switching to another node, open Logic when its split needs a MECE review,
  // else Issue. Reads fresh store state so `flagged` needn't be a dependency (which
  // would re-fire the jump on every recompute, fighting the user's tab choice).
  useEffect(() => {
    const sp = selectedId ? splitOf(useStore.getState().doc, selectedId) : undefined;
    const fl = sp
      ? sp.mece.exclusive.state === 'warn' || sp.mece.exhaustive.state === 'warn'
      : false;
    setTab(fl ? 'logic' : 'issue');
  }, [selectedId]);

  if (!selectedId || !node) {
    return (
      <aside className="h-full w-full border-neutral-200 bg-white p-5 sm:w-80 sm:shrink-0 sm:border-l">
        <p className="text-[13px] text-neutral-500 leading-relaxed">
          {m.inspector.emptyLead} <span className="font-medium">{m.inspector.emptyAction}</span>{' '}
          {m.inspector.emptyTail}
        </p>
      </aside>
    );
  }

  const isRoot = selectedId === doc.rootId;
  const rollup = split?.decomposition === 'formula' ? rollUpValue(doc, selectedId) : undefined;
  const drivers = split?.decomposition === 'formula' ? sensitivity(doc, selectedId) : [];
  const evCount = node.evidence.length;

  const TABS: { id: TabId; label: string; dot?: boolean; count?: number }[] = [
    { id: 'issue', label: m.inspector.tabs.issue },
    { id: 'logic', label: m.inspector.tabs.logic, dot: flagged },
    { id: 'evidence', label: m.inspector.tabs.evidence, count: evCount },
    { id: 'value', label: m.inspector.tabs.value },
  ];

  return (
    <aside className="flex h-full w-full flex-col border-neutral-200 bg-white sm:w-80 sm:shrink-0 sm:border-l">
      {selectedIds.length > 1 && (
        <div className="border-[#e7e4dc] border-b bg-[#f6f9fd] px-5 py-1.5 text-[11px] text-[#3f6fb0]">
          {m.inspector.multiSelected({ count: selectedIds.length })}
        </div>
      )}
      <div className="flex items-center gap-2 px-5 pt-4 pb-2">
        <span className="truncate font-semibold text-[14px] text-neutral-800">
          {node.label || m.content.untitled}
        </span>
        {split && (
          <span className="shrink-0 rounded bg-[#eef2f9] px-1.5 py-0.5 font-medium text-[#3f6fb0] text-[10px] capitalize">
            {m.enums.decomposition[split.decomposition]}
          </span>
        )}
      </div>

      <div className="flex gap-0.5 border-neutral-100 border-b px-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px flex items-center gap-1 border-b-2 px-2.5 py-2 font-medium text-[12px] transition ${
              tab === t.id
                ? 'border-[#3f6fb0] text-[#3f6fb0]'
                : 'border-transparent text-neutral-400 hover:text-neutral-600'
            }`}
          >
            {t.label}
            {t.count ? (
              <span className="rounded-full bg-neutral-100 px-1 text-[10px] text-neutral-500">
                {t.count}
              </span>
            ) : null}
            {t.dot ? (
              <span
                className="h-1.5 w-1.5 rounded-full bg-[#bd842c]"
                title={m.review.needsReview}
              />
            ) : null}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
        {nodeAdvisories.length > 0 && (
          <section className="flex flex-col gap-1 rounded-md border border-[#e8dcc0] bg-[#fbf6ea] px-3 py-2">
            <span className="font-medium text-[#8a5a14] text-[11px] uppercase tracking-wider">
              {m.inspector.coachingHeading}
            </span>
            <ul className="flex flex-col gap-1">
              {nodeAdvisories.map((a) => (
                <li key={a.id} className="flex gap-1.5 text-[12px] text-[#7a5a1e] leading-snug">
                  <span aria-hidden="true">💡</span>
                  <span>{renderAdvisory(m, a.message)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {tab === 'issue' && (
          <>
            <label className="flex flex-col gap-1">
              <span className={LABEL_CLS}>
                {isRoot ? m.inspector.keyQuestionLabel : m.inspector.issueLabel}
              </span>
              <textarea
                key={selectedId}
                defaultValue={node.label}
                rows={2}
                className={`resize-none ${INPUT_CLS}`}
                onBlur={(e) =>
                  isRoot ? setRootQuestion(e.target.value) : renameNode(selectedId, e.target.value)
                }
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className={LABEL_CLS}>{m.inspector.notesLabel}</span>
              <textarea
                key={`${selectedId}-detail`}
                defaultValue={node.detail ?? ''}
                rows={2}
                placeholder={m.inspector.notesPlaceholder}
                className={`resize-none ${INPUT_CLS}`}
                onBlur={(e) => setDetail(selectedId, e.target.value)}
              />
            </label>

            <section className="flex flex-col gap-1.5 border-neutral-100 border-t pt-3">
              <span className={LABEL_CLS}>{m.inspector.statusLabel}</span>
              <div className="flex flex-wrap gap-1">
                {(['open', 'supported', 'refuted', 'parked'] as NodeStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    className={`rounded px-2 py-0.5 text-[11px] capitalize ${
                      node.status === st
                        ? STATUS_ACTIVE[st]
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                    onClick={() => setStatus(selectedId, st)}
                  >
                    {m.enums.status[st]}
                  </button>
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-2 border-neutral-100 border-t pt-3">
              <div className="flex items-center justify-between">
                <span className={LABEL_CLS}>{m.inspector.priorityLabel}</span>
                {node.priority && (
                  <span className="rounded bg-[#eef2f9] px-1.5 py-0.5 font-medium text-[#3f6fb0] text-[10px] capitalize">
                    {m.enums.level[priorityBand(node.priority)]}
                  </span>
                )}
              </div>
              {/* impact (rows, high→low) × ease (cols, low→high) — one click sets both axes. */}
              <div className="grid grid-cols-[2.5rem_repeat(3,1fr)] items-center gap-0.5">
                <span />
                {(['low', 'medium', 'high'] as Level[]).map((ea) => (
                  <span key={ea} className="text-center text-[9px] text-neutral-400 capitalize">
                    {m.enums.level[ea]}
                  </span>
                ))}
                {(['high', 'medium', 'low'] as Level[]).map((imp) => (
                  <Fragment key={imp}>
                    <span className="pr-1 text-right text-[9px] text-neutral-400 capitalize">
                      {m.enums.level[imp]}
                    </span>
                    {(['low', 'medium', 'high'] as Level[]).map((ea) => {
                      const active = node.priority?.impact === imp && node.priority?.ease === ea;
                      const band = priorityBand({ impact: imp, ease: ea });
                      const tone =
                        band === 'high'
                          ? 'bg-[#dbe7f5]'
                          : band === 'medium'
                            ? 'bg-[#f5ecd8]'
                            : 'bg-[#efeee9]';
                      return (
                        <button
                          key={ea}
                          type="button"
                          aria-label={m.inspector.priorityCellLabel({
                            impact: m.enums.level[imp],
                            ease: m.enums.level[ea],
                          })}
                          title={m.inspector.priorityCellTitle({
                            impact: m.enums.level[imp],
                            ease: m.enums.level[ea],
                            band: m.enums.level[band],
                          })}
                          onClick={() => setPriority(selectedId, { impact: imp, ease: ea })}
                          className={`grid h-6 place-items-center rounded ${tone} ${
                            active ? 'ring-2 ring-[#3f6fb0]' : 'hover:brightness-95'
                          }`}
                        >
                          {active && <span className="text-[#3f6fb0] text-[11px]">●</span>}
                        </button>
                      );
                    })}
                  </Fragment>
                ))}
              </div>
              <div className="flex items-center justify-between text-[9px] text-neutral-400">
                <span>{m.inspector.priorityAxes}</span>
                {node.priority && (
                  <button
                    type="button"
                    className="text-neutral-400 hover:text-neutral-700 hover:underline"
                    onClick={() => setPriority(selectedId, undefined)}
                  >
                    {m.inspector.clearPriority}
                  </button>
                )}
              </div>
            </section>
          </>
        )}

        {tab === 'logic' &&
          (split ? (
            <section className="flex flex-col gap-2">
              <label className="flex flex-col gap-1">
                <span className={LABEL_CLS}>{m.inspector.decompositionLabel}</span>
                <select
                  value={split.decomposition}
                  className={INPUT_CLS}
                  onChange={(e) =>
                    setDecomposition(selectedId, e.target.value as DecompositionType)
                  }
                >
                  {DECOMPOSITION_TYPES.map((d) => (
                    <option key={d} value={d}>
                      {m.enums.decomposition[d]}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-neutral-400 leading-snug">
                  {m.enums.decompositionHint[split.decomposition]}
                </span>
              </label>

              <label className="flex flex-col gap-1">
                <span className={LABEL_CLS}>{m.inspector.dimensionLabel}</span>
                <input
                  key={`${selectedId}-dim-${split.dimension ?? ''}`}
                  type="text"
                  defaultValue={split.dimension ?? ''}
                  placeholder={m.inspector.dimensionPlaceholder}
                  className={INPUT_CLS}
                  onBlur={(e) => setDimension(selectedId, e.target.value)}
                />
                <div className="flex flex-wrap gap-1">
                  {m.inspector.commonAxes.map((axis) => (
                    <button
                      key={axis}
                      type="button"
                      className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-500 capitalize hover:bg-neutral-200"
                      onClick={() => setDimension(selectedId, axis)}
                    >
                      {axis}
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-neutral-400 leading-snug">
                  {m.inspector.dimensionHint}
                </span>
              </label>

              <section className="flex flex-col gap-1.5">
                <span className={LABEL_CLS}>{m.inspector.splitLogicLabel}</span>
                <div className="flex gap-1">
                  {(['inductive', 'deductive'] as SplitLogic[]).map((lg) => {
                    const active = (split.logic ?? 'inductive') === lg;
                    return (
                      <button
                        key={lg}
                        type="button"
                        aria-pressed={active}
                        className={`flex-1 rounded px-2 py-1 text-[11px] capitalize ${
                          active
                            ? 'bg-[#3f6fb0] text-white'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        }`}
                        onClick={() => setSplitLogic(selectedId, lg)}
                      >
                        {m.enums.splitLogic[lg]}
                      </button>
                    );
                  })}
                </div>
                <span className="text-[11px] text-neutral-400 leading-snug">
                  {m.inspector.splitLogicHint[split.logic ?? 'inductive']}
                </span>
              </section>

              <label className="flex flex-col gap-1">
                <span className={LABEL_CLS}>{m.inspector.summaryLabel}</span>
                <input
                  key={`${selectedId}-sum-${split.summary ?? ''}`}
                  type="text"
                  defaultValue={split.summary ?? ''}
                  placeholder={m.inspector.summaryPlaceholder}
                  className={INPUT_CLS}
                  onBlur={(e) => setSplitSummary(selectedId, e.target.value)}
                />
                <span className="text-[11px] text-neutral-400 leading-snug">
                  {m.inspector.summaryHint}
                </span>
              </label>

              <section className="flex flex-col gap-1.5">
                <span className={LABEL_CLS}>{m.inspector.orderLabel}</span>
                <div className="flex gap-1">
                  {(
                    [undefined, 'importance', 'time', 'structure'] as (SplitOrder | undefined)[]
                  ).map((ord) => {
                    const active = split.order === ord;
                    return (
                      <button
                        key={ord ?? 'none'}
                        type="button"
                        aria-pressed={active}
                        aria-label={
                          ord
                            ? m.inspector.orderOptionLabel({ order: m.enums.splitOrder[ord] })
                            : m.inspector.orderDefaultLabel
                        }
                        className={`flex-1 rounded px-1.5 py-1 text-[11px] capitalize ${
                          active
                            ? 'bg-[#3f6fb0] text-white'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        }`}
                        onClick={() => setSplitOrder(selectedId, ord)}
                      >
                        {ord ? m.enums.splitOrder[ord] : '—'}
                      </button>
                    );
                  })}
                </div>
                <span className="text-[11px] text-neutral-400 leading-snug">
                  {m.inspector.orderHint}
                </span>
              </section>

              {split.decomposition === 'formula' && (
                <label className="flex flex-col gap-1">
                  <span className={LABEL_CLS}>{m.inspector.operatorLabel}</span>
                  <select
                    value={split.operator ?? 'sum'}
                    className={INPUT_CLS}
                    onChange={(e) => setOperator(selectedId, e.target.value as FormulaOperator)}
                  >
                    {OPERATORS.map((op) => (
                      <option key={op} value={op}>
                        {m.enums.formulaOperator[op]}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <div className="rounded-md bg-neutral-50 px-3 py-2">
                <MeceRow label={m.inspector.exclusiveAxis} result={split.mece.exclusive} />
                <MeceRow label={m.inspector.exhaustiveAxis} result={split.mece.exhaustive} />
              </div>
              {rollup !== undefined && (
                <button
                  type="button"
                  className="self-start rounded-md bg-neutral-100 px-2 py-1 text-[11px] text-neutral-600 hover:bg-neutral-200"
                  onClick={() => setAmount(selectedId, rollup)}
                >
                  {m.inspector.rollUpAction({ value: rollup })}
                </button>
              )}
              {drivers.length >= 2 && (
                <div className="flex flex-col gap-1 rounded-md bg-neutral-50 px-3 py-2">
                  <span className={LABEL_CLS}>{m.inspector.sensitivityLabel}</span>
                  {drivers.map((d) => (
                    <div key={d.id} className="flex items-center gap-2 text-[11px]">
                      <span className="w-20 shrink-0 truncate text-neutral-700" title={d.label}>
                        {d.label || m.content.untitled}
                      </span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded bg-neutral-200">
                        <span
                          className="block h-full rounded bg-[#3f6fb0]"
                          style={{ width: `${(d.swing / (drivers[0]?.swing || 1)) * 100}%` }}
                        />
                      </span>
                      <span className="w-12 shrink-0 text-right text-neutral-500 tabular-nums">
                        {m.inspector.driverSwing({ value: d.swing })}
                      </span>
                    </div>
                  ))}
                  <span className="text-[10px] text-neutral-400 leading-snug">
                    {m.inspector.sensitivityHint}
                  </span>
                </div>
              )}
            </section>
          ) : (
            <section className="flex flex-col gap-2">
              <span className={LABEL_CLS}>{m.inspector.decomposeHeading}</span>
              <div className="grid grid-cols-2 gap-1.5">
                {DECOMPOSITION_TYPES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    title={m.enums.decompositionHint[d]}
                    className="rounded-md border border-neutral-200 px-2 py-1.5 text-left text-[12px] text-neutral-700 hover:border-[#3f6fb0] hover:bg-neutral-50"
                    onClick={() => decompose(selectedId, d)}
                  >
                    {m.enums.decomposition[d]}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-neutral-400 leading-snug">
                {m.inspector.decomposeHint}
              </span>
              <button
                type="button"
                className="self-start text-[11px] text-[#3f6fb0] hover:underline"
                title={m.inspector.aiPromptTitle}
                onClick={() => void copyToClipboard(decomposePrompt(doc, selectedId, m))}
              >
                {m.inspector.aiPromptAction}
              </button>
              <details className="mt-1">
                <summary className="cursor-pointer text-[11px] text-neutral-400 hover:text-neutral-600">
                  {m.inspector.aiPasteSummary}
                </summary>
                <textarea
                  value={aiPaste}
                  onChange={(e) => setAiPaste(e.target.value)}
                  rows={4}
                  placeholder={m.inspector.aiPastePlaceholder}
                  className="mt-1.5 w-full resize-y rounded-md border border-neutral-300 p-2 font-mono text-[11px] text-neutral-800 focus:border-[#3f6fb0] focus:outline-none"
                />
                <button
                  type="button"
                  disabled={!aiPaste.trim()}
                  className="mt-1.5 rounded-md bg-[#3f6fb0] px-2 py-1 font-medium text-[11px] text-white hover:bg-[#365f98] disabled:opacity-50"
                  onClick={() => {
                    captureChildren(selectedId, aiPaste);
                    setAiPaste('');
                  }}
                >
                  {m.inspector.aiPasteAction}
                </button>
              </details>
            </section>
          ))}

        {tab === 'evidence' && (
          <section className="flex flex-col gap-2">
            <span className={LABEL_CLS}>{m.inspector.evidenceHeading}</span>
            {node.evidence.length > 0 && (
              <ul className="flex flex-col gap-1.5">
                {node.evidence.map((e) => {
                  const stance = e.supports ? 'supports' : 'contradicts';
                  return (
                    <li key={e.id} className="flex items-start gap-1.5 text-[12px]">
                      <button
                        type="button"
                        className="mt-0.5 font-semibold"
                        style={{ color: e.supports ? '#3f7d54' : '#bd4a3a' }}
                        title={m.inspector.stanceTitle[stance]}
                        aria-label={m.inspector.stanceLabel[stance]}
                        onClick={() => updateEvidence(selectedId, e.id, { supports: !e.supports })}
                      >
                        {e.supports ? '✓' : '✗'}
                      </button>
                      <input
                        defaultValue={e.summary}
                        aria-label={m.inspector.evidenceTextLabel}
                        className="min-w-0 flex-1 rounded-sm border border-transparent bg-transparent px-1 py-0.5 text-neutral-700 leading-snug hover:border-neutral-200 focus:border-[#3f6fb0] focus:bg-white focus:outline-none"
                        onBlur={(ev) => {
                          const next = ev.target.value.trim();
                          if (!next || next === e.summary) {
                            ev.target.value = e.summary;
                            return;
                          }
                          updateEvidence(selectedId, e.id, { summary: next });
                        }}
                        onKeyDown={(ev) => {
                          if (ev.key === 'Enter') {
                            ev.preventDefault();
                            ev.currentTarget.blur();
                          }
                        }}
                      />
                      <span className="flex shrink-0 gap-0.5">
                        {STRENGTHS.map((st) => (
                          <button
                            key={st}
                            type="button"
                            title={m.enums.evidenceStrength[st]}
                            aria-label={m.inspector.strengthOptionLabel({
                              strength: m.enums.evidenceStrength[st],
                            })}
                            className={`rounded px-1 text-[10px] uppercase ${
                              e.strength === st
                                ? 'bg-[#3f6fb0] text-white'
                                : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                            }`}
                            onClick={() => updateEvidence(selectedId, e.id, { strength: st })}
                          >
                            {m.enums.evidenceStrength[st].charAt(0)}
                          </button>
                        ))}
                      </span>
                      <button
                        type="button"
                        title={m.inspector.removeTitle}
                        aria-label={m.inspector.removeEvidenceLabel}
                        className="text-neutral-300 hover:text-neutral-600"
                        onClick={() => removeEvidence(selectedId, e.id)}
                      >
                        ×
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <input
              value={evidenceDraft}
              placeholder={m.inspector.evidencePlaceholder}
              className="rounded-md border border-neutral-300 px-2 py-1.5 text-[12px] text-neutral-800 focus:border-[#3f6fb0] focus:outline-none"
              onChange={(e) => setEvidenceDraft(e.target.value)}
            />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider">
                {m.inspector.strengthLabel}
              </span>
              {STRENGTHS.map((st) => (
                <button
                  key={st}
                  type="button"
                  className={`rounded px-1.5 py-0.5 text-[10px] capitalize ${
                    draftStrength === st
                      ? 'bg-[#3f6fb0] text-white'
                      : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                  }`}
                  onClick={() => setDraftStrength(st)}
                >
                  {m.enums.evidenceStrength[st]}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                disabled={!evidenceDraft.trim()}
                className="flex-1 rounded-md bg-[#eaf2ea] px-2 py-1 text-[12px] text-[#2f6a44] hover:bg-[#dcebdc] disabled:opacity-50"
                onClick={() => {
                  addEvidence(selectedId, evidenceDraft.trim(), true, draftStrength);
                  setEvidenceDraft('');
                }}
              >
                {m.inspector.addSupports}
              </button>
              <button
                type="button"
                disabled={!evidenceDraft.trim()}
                className="flex-1 rounded-md bg-[#f6e9e7] px-2 py-1 text-[12px] text-[#a23b2c] hover:bg-[#f0ddda] disabled:opacity-50"
                onClick={() => {
                  addEvidence(selectedId, evidenceDraft.trim(), false, draftStrength);
                  setEvidenceDraft('');
                }}
              >
                {m.inspector.addContradicts}
              </button>
            </div>
          </section>
        )}

        {tab === 'value' && (
          <div className="flex flex-col gap-1">
            <span className={LABEL_CLS}>{m.inspector.valueLabel}</span>
            <div className="flex gap-1.5">
              <input
                key={`${selectedId}-value`}
                type="number"
                defaultValue={node.value?.amount ?? ''}
                placeholder={m.inspector.amountPlaceholder}
                className={`w-0 flex-1 ${INPUT_CLS}`}
                onBlur={(e) => {
                  const raw = e.target.value.trim();
                  const amount = Number(raw);
                  setAmount(selectedId, raw === '' || Number.isNaN(amount) ? undefined : amount);
                }}
              />
              <input
                key={`${selectedId}-unit`}
                type="text"
                defaultValue={node.value?.unit ?? ''}
                placeholder={m.inspector.unitPlaceholder}
                title={m.inspector.unitTitle}
                className={`w-16 ${INPUT_CLS}`}
                onBlur={(e) => setUnit(selectedId, e.target.value.trim())}
              />
            </div>
            <span className="text-[11px] text-neutral-400 leading-snug">
              {m.inspector.valueHint}
            </span>
          </div>
        )}

        <div className="mt-auto flex flex-col gap-2 border-neutral-100 border-t pt-3">
          <button
            type="button"
            className="rounded-md bg-[#3f6fb0] px-3 py-2 font-medium text-[13px] text-white hover:bg-[#365f98]"
            onClick={() => addChild(selectedId)}
          >
            {m.inspector.addSubIssue}
          </button>
          {!isRoot && (
            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-md px-3 py-1.5 text-[12px] text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                onClick={() => moveSibling(selectedId, 'up')}
              >
                {m.inspector.moveUp}
              </button>
              <button
                type="button"
                className="flex-1 rounded-md px-3 py-1.5 text-[12px] text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                onClick={() => moveSibling(selectedId, 'down')}
              >
                {m.inspector.moveDown}
              </button>
            </div>
          )}
          {!isRoot && (
            <button
              type="button"
              className="rounded-md px-3 py-2 text-[13px] text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
              onClick={() => duplicateNode(selectedId)}
            >
              {m.inspector.duplicateSubtree}
            </button>
          )}
          {!isRoot && (
            <button
              type="button"
              className="rounded-md px-3 py-2 text-[13px] text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
              onClick={() => removeNode(selectedId)}
            >
              {m.inspector.deleteIssue}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
