import { useState } from 'react';
import { CHECK_STATE_COLOR } from '@/components/checkColors';
import { decomposePrompt } from '@/domain/aiPrompts';
import { DECOMPOSITION_HINTS, DECOMPOSITION_LABELS } from '@/domain/constants';
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
} from '@/domain/types';
import { copyToClipboard } from '@/services/download';
import { useStore } from '@/store';

// Shared Tailwind class strings — named so the inspector's many labels/inputs can't drift.
const LABEL_CLS = 'font-medium text-[11px] text-neutral-400 uppercase tracking-wider';
const INPUT_CLS =
  'rounded-md border border-neutral-300 px-2 py-1.5 text-[13px] text-neutral-800 focus:border-[#3f6fb0] focus:outline-none';

const DECOMPOSITION_ORDER: DecompositionType[] = [
  'freeform',
  'segment',
  'process',
  'binary',
  'formula',
  'framework',
];

const STRENGTH_CYCLE: EvidenceStrength[] = ['anecdote', 'indicative', 'strong'];
function nextStrength(s: EvidenceStrength): EvidenceStrength {
  const i = STRENGTH_CYCLE.indexOf(s);
  return STRENGTH_CYCLE[(i + 1) % STRENGTH_CYCLE.length] ?? 'indicative';
}

const STATUS_ACTIVE: Record<NodeStatus, string> = {
  open: 'bg-[#3f6fb0] text-white',
  supported: 'bg-[#3f7d54] text-white',
  refuted: 'bg-[#bd4a3a] text-white',
  parked: 'bg-neutral-500 text-white',
};

function MeceRow({ label, result }: { label: string; result: CheckResult }) {
  return (
    <div className="flex gap-2 py-1">
      <span
        className="mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ background: CHECK_STATE_COLOR[result.state] }}
      />
      <span className="text-[12px] text-neutral-600 leading-snug">
        <span className="font-medium text-neutral-800">{label}.</span>{' '}
        {result.message ?? (result.state === 'unknown' ? 'Not yet checked.' : '')}
      </span>
    </div>
  );
}

export function Inspector() {
  const doc = useStore((s) => s.doc);
  const selectedId = useStore((s) => s.selectedId);
  const setRootQuestion = useStore((s) => s.setRootQuestion);
  const renameNode = useStore((s) => s.renameNode);
  const setDetail = useStore((s) => s.setDetail);
  const setAmount = useStore((s) => s.setAmount);
  const setUnit = useStore((s) => s.setUnit);
  const setDecomposition = useStore((s) => s.setDecomposition);
  const setOperator = useStore((s) => s.setOperator);
  const decompose = useStore((s) => s.decompose);
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

  const node = selectedId ? doc.nodes[selectedId] : undefined;

  if (!selectedId || !node) {
    return (
      <aside className="w-80 shrink-0 border-neutral-200 border-l bg-white p-5">
        <p className="text-[13px] text-neutral-500 leading-relaxed">
          Select a node to edit it. Use <span className="font-medium">Add sub-issue</span> to
          decompose it — the dots show whether each split is mutually exclusive (ME) and
          collectively exhaustive (CE).
        </p>
      </aside>
    );
  }

  const isRoot = selectedId === doc.rootId;
  const split = splitOf(doc, selectedId);
  const rollup = split?.decomposition === 'formula' ? rollUpValue(doc, selectedId) : undefined;
  const drivers = split?.decomposition === 'formula' ? sensitivity(doc, selectedId) : [];

  return (
    <aside className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto border-neutral-200 border-l bg-white p-5">
      <label className="flex flex-col gap-1">
        <span className={LABEL_CLS}>{isRoot ? 'Key question' : 'Issue'}</span>
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
        <span className={LABEL_CLS}>Notes</span>
        <textarea
          key={`${selectedId}-detail`}
          defaultValue={node.detail ?? ''}
          rows={2}
          placeholder="Rationale, assumptions, data sources…"
          className={`resize-none ${INPUT_CLS}`}
          onBlur={(e) => setDetail(selectedId, e.target.value)}
        />
      </label>

      <div className="flex flex-col gap-1">
        <span className={LABEL_CLS}>Value (optional)</span>
        <div className="flex gap-1.5">
          <input
            key={`${selectedId}-value`}
            type="number"
            defaultValue={node.value?.amount ?? ''}
            placeholder="e.g. 100"
            className={`w-0 flex-1 ${INPUT_CLS}`}
            onBlur={(e) => {
              const raw = e.target.value.trim();
              const num = Number(raw);
              setAmount(selectedId, raw === '' || Number.isNaN(num) ? undefined : num);
            }}
          />
          <input
            key={`${selectedId}-unit`}
            type="text"
            defaultValue={node.value?.unit ?? ''}
            placeholder="unit"
            title="Unit (e.g. DKK, %, hrs) — set an amount first"
            className={`w-16 ${INPUT_CLS}`}
            onBlur={(e) => setUnit(selectedId, e.target.value.trim())}
          />
        </div>
      </div>

      <section className="flex flex-col gap-1.5 border-neutral-100 border-t pt-3">
        <span className={LABEL_CLS}>Status</span>
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
              {st}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-1.5 border-neutral-100 border-t pt-3">
        <span className={LABEL_CLS}>Priority</span>
        {(['impact', 'ease'] as const).map((axis) => (
          <div key={axis} className="flex items-center gap-2">
            <span className="w-12 text-[11px] text-neutral-500 capitalize">{axis}</span>
            <div className="flex gap-1">
              {(['low', 'medium', 'high'] as Level[]).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  className={`rounded px-2 py-0.5 text-[11px] capitalize ${
                    node.priority?.[axis] === lvl
                      ? 'bg-[#3f6fb0] text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                  onClick={() =>
                    setPriority(selectedId, {
                      impact: axis === 'impact' ? lvl : (node.priority?.impact ?? 'medium'),
                      ease: axis === 'ease' ? lvl : (node.priority?.ease ?? 'medium'),
                    })
                  }
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        ))}
        {node.priority && (
          <button
            type="button"
            className="self-start text-[11px] text-neutral-400 hover:text-neutral-700 hover:underline"
            onClick={() => setPriority(selectedId, undefined)}
          >
            Clear priority
          </button>
        )}
      </section>

      <section className="flex flex-col gap-2 border-neutral-100 border-t pt-3">
        <span className={LABEL_CLS}>Evidence</span>
        {node.evidence.length > 0 && (
          <ul className="flex flex-col gap-1">
            {node.evidence.map((e) => (
              <li key={e.id} className="flex items-start gap-1.5 text-[12px]">
                <span
                  className="mt-0.5 font-semibold"
                  style={{ color: e.supports ? '#3f7d54' : '#bd4a3a' }}
                  title={e.supports ? 'Supports' : 'Contradicts'}
                >
                  {e.supports ? '✓' : '✗'}
                </span>
                <span className="flex-1 text-neutral-700 leading-snug">{e.summary}</span>
                <button
                  type="button"
                  title="Cycle strength"
                  className="rounded bg-neutral-100 px-1 text-[10px] text-neutral-500 capitalize hover:bg-neutral-200"
                  onClick={() =>
                    updateEvidence(selectedId, e.id, { strength: nextStrength(e.strength) })
                  }
                >
                  {e.strength}
                </button>
                <button
                  type="button"
                  title="Remove"
                  className="text-neutral-300 hover:text-neutral-600"
                  onClick={() => removeEvidence(selectedId, e.id)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <input
          value={evidenceDraft}
          placeholder="Add evidence…"
          className="rounded-md border border-neutral-300 px-2 py-1.5 text-[12px] text-neutral-800 focus:border-[#3f6fb0] focus:outline-none"
          onChange={(e) => setEvidenceDraft(e.target.value)}
        />
        <div className="flex gap-1.5">
          <button
            type="button"
            disabled={!evidenceDraft.trim()}
            className="flex-1 rounded-md bg-[#eaf2ea] px-2 py-1 text-[12px] text-[#2f6a44] hover:bg-[#dcebdc] disabled:opacity-50"
            onClick={() => {
              addEvidence(selectedId, evidenceDraft.trim(), true);
              setEvidenceDraft('');
            }}
          >
            + Supports
          </button>
          <button
            type="button"
            disabled={!evidenceDraft.trim()}
            className="flex-1 rounded-md bg-[#f6e9e7] px-2 py-1 text-[12px] text-[#a23b2c] hover:bg-[#f0ddda] disabled:opacity-50"
            onClick={() => {
              addEvidence(selectedId, evidenceDraft.trim(), false);
              setEvidenceDraft('');
            }}
          >
            + Contradicts
          </button>
        </div>
      </section>

      {!split && (
        <section className="flex flex-col gap-2 border-neutral-100 border-t pt-3">
          <span className={LABEL_CLS}>Decompose by</span>
          <div className="grid grid-cols-2 gap-1.5">
            {DECOMPOSITION_ORDER.map((d) => (
              <button
                key={d}
                type="button"
                title={DECOMPOSITION_HINTS[d]}
                className="rounded-md border border-neutral-200 px-2 py-1.5 text-left text-[12px] text-neutral-700 hover:border-[#3f6fb0] hover:bg-neutral-50"
                onClick={() => decompose(selectedId, d)}
              >
                {DECOMPOSITION_LABELS[d]}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-neutral-400 leading-snug">
            Seeds clean starter sub-issues you can rename.
          </span>
          <button
            type="button"
            className="self-start text-[11px] text-[#3f6fb0] hover:underline"
            title="Copy a prompt to suggest a MECE split for this node — paste it into Claude or ChatGPT"
            onClick={() => void copyToClipboard(decomposePrompt(doc, selectedId))}
          >
            Copy an AI prompt to suggest a split →
          </button>
        </section>
      )}

      {split && (
        <section className="flex flex-col gap-2 border-neutral-100 border-t pt-3">
          <label className="flex flex-col gap-1">
            <span className={LABEL_CLS}>How it splits</span>
            <select
              value={split.decomposition}
              className={INPUT_CLS}
              onChange={(e) => setDecomposition(selectedId, e.target.value as DecompositionType)}
            >
              {DECOMPOSITION_ORDER.map((d) => (
                <option key={d} value={d}>
                  {DECOMPOSITION_LABELS[d]}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-neutral-400 leading-snug">
              {DECOMPOSITION_HINTS[split.decomposition]}
            </span>
          </label>

          {split.decomposition === 'formula' && (
            <label className="flex flex-col gap-1">
              <span className={LABEL_CLS}>Combine children by</span>
              <select
                value={split.operator ?? 'sum'}
                className={INPUT_CLS}
                onChange={(e) => setOperator(selectedId, e.target.value as FormulaOperator)}
              >
                <option value="sum">Sum (A + B + C)</option>
                <option value="product">Product (A × B × C)</option>
                <option value="difference">Difference (A − B − …)</option>
              </select>
            </label>
          )}

          <div className="rounded-md bg-neutral-50 px-3 py-2">
            <MeceRow label="Mutually exclusive" result={split.mece.exclusive} />
            <MeceRow label="Collectively exhaustive" result={split.mece.exhaustive} />
          </div>
          {rollup !== undefined && (
            <button
              type="button"
              className="self-start rounded-md bg-neutral-100 px-2 py-1 text-[11px] text-neutral-600 hover:bg-neutral-200"
              onClick={() => setAmount(selectedId, rollup)}
            >
              Roll up children → {rollup}
            </button>
          )}
          {drivers.length >= 2 && (
            <div className="flex flex-col gap-1 rounded-md bg-neutral-50 px-3 py-2">
              <span className={LABEL_CLS}>Sensitivity (±10%)</span>
              {drivers.map((d) => (
                <div key={d.id} className="flex items-center gap-2 text-[11px]">
                  <span className="w-20 shrink-0 truncate text-neutral-700" title={d.label}>
                    {d.label || 'Untitled'}
                  </span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded bg-neutral-200">
                    <span
                      className="block h-full rounded bg-[#3f6fb0]"
                      style={{ width: `${(d.swing / (drivers[0]?.swing || 1)) * 100}%` }}
                    />
                  </span>
                  <span className="w-12 shrink-0 text-right text-neutral-500 tabular-nums">
                    {Math.round(d.swing * 100) / 100}
                  </span>
                </div>
              ))}
              <span className="text-[10px] text-neutral-400 leading-snug">
                Range of this value as each driver shifts ±10%, one at a time.
              </span>
            </div>
          )}
        </section>
      )}

      <div className="mt-auto flex flex-col gap-2 border-neutral-100 border-t pt-3">
        <button
          type="button"
          className="rounded-md bg-[#3f6fb0] px-3 py-2 font-medium text-[13px] text-white hover:bg-[#365f98]"
          onClick={() => addChild(selectedId)}
        >
          + Add sub-issue
        </button>
        {!isRoot && (
          <div className="flex gap-2">
            <button
              type="button"
              className="flex-1 rounded-md px-3 py-1.5 text-[12px] text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
              onClick={() => moveSibling(selectedId, 'up')}
            >
              ↑ Move up
            </button>
            <button
              type="button"
              className="flex-1 rounded-md px-3 py-1.5 text-[12px] text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
              onClick={() => moveSibling(selectedId, 'down')}
            >
              ↓ Move down
            </button>
          </div>
        )}
        {!isRoot && (
          <button
            type="button"
            className="rounded-md px-3 py-2 text-[13px] text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
            onClick={() => duplicateNode(selectedId)}
          >
            Duplicate subtree
          </button>
        )}
        {!isRoot && (
          <button
            type="button"
            className="rounded-md px-3 py-2 text-[13px] text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
            onClick={() => removeNode(selectedId)}
          >
            Delete issue
          </button>
        )}
      </div>
    </aside>
  );
}
