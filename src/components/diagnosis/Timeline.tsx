import { useState } from 'react';
import { Dialog } from '@/components/Dialog';
import { dayToTime } from '@/domain/provenance';
import { changesMarkdown, eventsSince, timelineEvents } from '@/domain/timeline';
import { useEditorMessages } from '@/i18n/useEditorMessages';
import { copyToClipboard } from '@/services/download';
import { useStore } from '@/store';

/** A valid `YYYY-MM-DD` from the date input, as epoch ms; `null` for empty or junk. */
function sinceTime(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const t = dayToTime(value);
  return Number.isFinite(t) ? t : null;
}

/**
 * The investigation in order: dated evidence and status changes, oldest first.
 * An optional "since" day filters the list and scopes the copyable
 * "what changed" update to the same events.
 */
export function Timeline({ onClose }: { onClose: () => void }) {
  const m = useEditorMessages();
  const doc = useStore((s) => s.doc);
  const locate = useStore((s) => s.locate);
  const [since, setSince] = useState('');
  const from = sinceTime(since);
  const all = timelineEvents(doc);
  const events = from === null ? all : eventsSince(doc, from);
  const update = changesMarkdown(doc, from ?? 0, m);

  return (
    <Dialog
      label={m.brief.timelineTitle}
      subtitle={m.brief.timelineSubtitle}
      wide
      onClose={onClose}
    >
      <div className="mt-4 flex items-center gap-2">
        <label className="flex items-center gap-2 text-[12px] text-neutral-600">
          {m.brief.timelineSince}
          <input
            type="date"
            value={since}
            onChange={(e) => setSince(e.target.value)}
            className="rounded-md border border-neutral-300 px-2 py-1 text-[12px]"
          />
        </label>
        <button
          type="button"
          disabled={update === ''}
          onClick={() => void copyToClipboard(update)}
          className="ml-auto rounded-md border border-neutral-300 px-2.5 py-1 font-medium text-[12px] text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
        >
          {m.brief.timelineCopy}
        </button>
      </div>
      {all.length === 0 ? (
        <p className="mt-5 text-[13px] text-neutral-500">{m.brief.timelineEmpty}</p>
      ) : events.length === 0 ? (
        <p className="mt-5 text-[13px] text-neutral-500">{m.brief.timelineNoneSince}</p>
      ) : (
        <ol className="mt-4 flex max-h-[60vh] flex-col overflow-auto border-neutral-200 border-l">
          {events.map((e) => {
            const node = doc.nodes[e.nodeId];
            const key =
              e.kind === 'status'
                ? `${e.nodeId}-s-${e.change.at}-${e.change.to}`
                : `${e.nodeId}-e-${e.evidence.id}`;
            return (
              <li key={key} className="relative py-1.5 pl-4">
                <span
                  aria-hidden="true"
                  className={`absolute top-3 -left-[4px] h-2 w-2 rounded-full ${
                    e.kind === 'status'
                      ? 'bg-[#3f6fb0]'
                      : e.evidence.supports
                        ? 'bg-[#3f7d54]'
                        : 'bg-[#bd4a3a]'
                  }`}
                />
                <span className="block text-[11px] text-neutral-400">
                  {m.brief.timelineDay({
                    at: e.at,
                    mode: e.kind === 'status' ? 'moment' : e.dated ? 'day' : 'added',
                  })}
                  {' · '}
                  <button
                    type="button"
                    className="text-[#3f6fb0] hover:underline"
                    onClick={() => {
                      locate(e.nodeId);
                      onClose();
                    }}
                  >
                    {node?.label || m.content.untitled}
                  </button>
                </span>
                <span className="block text-[12px] text-neutral-800">
                  {e.kind === 'status'
                    ? m.brief.timelineStatus({
                        from: e.change.from,
                        to: e.change.to,
                        ...(e.change.reason ? { reason: e.change.reason } : {}),
                      })
                    : m.brief.timelineEvidence({
                        summary: e.evidence.summary,
                        supports: e.evidence.supports,
                        strength: e.evidence.strength,
                        ...(e.evidence.author ? { author: e.evidence.author } : {}),
                      })}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </Dialog>
  );
}
