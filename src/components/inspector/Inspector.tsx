import { DECOMPOSITION_HINTS, DECOMPOSITION_LABELS } from '@/domain/constants';
import { splitOf } from '@/domain/tree';
import type { CheckResult, CheckState, DecompositionType } from '@/domain/types';
import { useStore } from '@/store';

const DECOMPOSITION_ORDER: DecompositionType[] = [
  'freeform',
  'segment',
  'process',
  'binary',
  'formula',
  'framework',
];

const STATE_COLOR: Record<CheckState, string> = {
  pass: '#3f7d54',
  warn: '#bd842c',
  unknown: '#c4c0b6',
};

function MeceRow({ label, result }: { label: string; result: CheckResult }) {
  return (
    <div className="flex gap-2 py-1">
      <span
        className="mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ background: STATE_COLOR[result.state] }}
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
  const setNodeValue = useStore((s) => s.setNodeValue);
  const setDecomposition = useStore((s) => s.setDecomposition);
  const decompose = useStore((s) => s.decompose);
  const addChild = useStore((s) => s.addChild);
  const removeNode = useStore((s) => s.removeNode);

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

  return (
    <aside className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto border-neutral-200 border-l bg-white p-5">
      <label className="flex flex-col gap-1">
        <span className="font-medium text-[11px] text-neutral-400 uppercase tracking-wider">
          {isRoot ? 'Key question' : 'Issue'}
        </span>
        <textarea
          key={selectedId}
          defaultValue={node.label}
          rows={2}
          className="resize-none rounded-md border border-neutral-300 px-2 py-1.5 text-[13px] text-neutral-800 focus:border-[#3f6fb0] focus:outline-none"
          onBlur={(e) =>
            isRoot ? setRootQuestion(e.target.value) : renameNode(selectedId, e.target.value)
          }
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-medium text-[11px] text-neutral-400 uppercase tracking-wider">
          Value (optional)
        </span>
        <input
          key={`${selectedId}-value`}
          type="number"
          defaultValue={node.value?.amount ?? ''}
          placeholder="e.g. 100"
          className="rounded-md border border-neutral-300 px-2 py-1.5 text-[13px] text-neutral-800 focus:border-[#3f6fb0] focus:outline-none"
          onBlur={(e) => {
            const raw = e.target.value.trim();
            const num = Number(raw);
            setNodeValue(selectedId, raw === '' || Number.isNaN(num) ? undefined : { amount: num });
          }}
        />
      </label>

      {!split && (
        <section className="flex flex-col gap-2 border-neutral-100 border-t pt-3">
          <span className="font-medium text-[11px] text-neutral-400 uppercase tracking-wider">
            Decompose by
          </span>
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
        </section>
      )}

      {split && (
        <section className="flex flex-col gap-2 border-neutral-100 border-t pt-3">
          <label className="flex flex-col gap-1">
            <span className="font-medium text-[11px] text-neutral-400 uppercase tracking-wider">
              How it splits
            </span>
            <select
              value={split.decomposition}
              className="rounded-md border border-neutral-300 px-2 py-1.5 text-[13px] text-neutral-800 focus:border-[#3f6fb0] focus:outline-none"
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

          <div className="rounded-md bg-neutral-50 px-3 py-2">
            <MeceRow label="Mutually exclusive" result={split.mece.exclusive} />
            <MeceRow label="Collectively exhaustive" result={split.mece.exhaustive} />
          </div>
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
