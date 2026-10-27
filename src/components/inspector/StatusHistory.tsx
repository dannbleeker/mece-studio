import { statusLogOf } from '@/domain/provenance';
import type { IssueNode } from '@/domain/types';
import { useEditorMessages } from '@/i18n/useEditorMessages';
import { useStore } from '@/store';

const truncate = (s: string, n = 48): string => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/**
 * The reasoning trail behind a node's status: every change, newest first, each
 * with a "why" and the evidence that tipped it. Renders nothing until the
 * status has changed at least once.
 */
export function StatusHistory({ node }: { node: IssueNode }) {
  const m = useEditorMessages();
  const updateStatusChange = useStore((s) => s.updateStatusChange);
  const log = statusLogOf(node);
  if (log.length === 0) return null;

  // Newest first, keeping each entry's index into the stored (oldest-first) log.
  const entries = log.map((change, index) => ({ change, index })).reverse();

  return (
    <section className="flex flex-col gap-1.5 border-neutral-100 border-t pt-3">
      <span className="font-medium text-[11px] text-neutral-400 uppercase tracking-wider">
        {m.inspector.statusHistoryHeading}
      </span>
      <ol className="flex flex-col gap-2">
        {entries.map(({ change, index }) => (
          <li key={`${change.at}-${index}`} className="flex flex-col gap-1 text-[12px]">
            <span className="text-neutral-700">
              <span className="text-neutral-400">{m.inspector.statusWhen({ at: change.at })}</span>{' '}
              {m.inspector.statusChange({
                from: m.enums.status[change.from],
                to: m.enums.status[change.to],
              })}
            </span>
            <input
              key={`${node.id}-${index}-reason-${change.reason ?? ''}`}
              aria-label={m.inspector.statusReasonLabel}
              defaultValue={change.reason ?? ''}
              placeholder={m.inspector.statusReasonPlaceholder}
              className="rounded border border-neutral-200 px-1.5 py-0.5 text-[11px] text-neutral-700 focus:border-[#3f6fb0] focus:outline-none"
              onBlur={(e) => updateStatusChange(node.id, index, { reason: e.target.value })}
            />
            {node.evidence.length > 0 && (
              <label className="flex items-center gap-1.5 text-[10px] text-neutral-400">
                {m.inspector.statusEvidenceLabel}
                <select
                  value={change.evidenceId ?? ''}
                  className="min-w-0 flex-1 rounded border border-neutral-200 px-1 py-0.5 text-[11px] text-neutral-700"
                  onChange={(e) =>
                    updateStatusChange(node.id, index, { evidenceId: e.target.value || null })
                  }
                >
                  <option value="">{m.inspector.statusEvidenceNone}</option>
                  {node.evidence.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.supports ? '✓' : '✗'} {truncate(ev.summary)}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
