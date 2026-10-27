import { useState } from 'react';
import { evidenceDate, safeUrl } from '@/domain/provenance';
import type { ProvenanceField } from '@/domain/tree';
import type { EvidenceItem, NodeId } from '@/domain/types';
import { useEditorMessages } from '@/i18n/useEditorMessages';
import { useStore } from '@/store';

const FIELD_CLS =
  'min-w-0 rounded border border-neutral-200 px-1.5 py-0.5 text-[11px] text-neutral-700 focus:border-[#3f6fb0] focus:outline-none';

/**
 * Who reported a piece of evidence, when, where, and a link back to the
 * original. A one-line summary under the evidence row when anything is set,
 * and a small editor behind a toggle — so a row without provenance looks
 * exactly as it did before.
 */
export function EvidenceProvenance({ nodeId, item }: { nodeId: NodeId; item: EvidenceItem }) {
  const m = useEditorMessages();
  const setProvenance = useStore((s) => s.setEvidenceProvenance);
  const [open, setOpen] = useState(false);

  const date = evidenceDate(item);
  const href = safeUrl(item.url);
  const parts = [
    item.author,
    date ? m.inspector.provenanceDay({ iso: date }) : undefined,
    item.source,
  ].filter((p): p is string => typeof p === 'string' && p.trim() !== '');

  const commit = (field: ProvenanceField, value: string) =>
    setProvenance(nodeId, item.id, field, value);

  return (
    <div className="ml-5 flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-x-1.5 text-[10px] text-neutral-400">
        {parts.length > 0 && <span>{parts.join(' · ')}</span>}
        {href && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#3f6fb0] hover:underline"
          >
            {m.inspector.provenanceOpen} ↗
          </a>
        )}
        <button
          type="button"
          aria-expanded={open}
          className="text-neutral-400 hover:text-neutral-700 hover:underline"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? m.inspector.provenanceHide : m.inspector.provenanceShow}
        </button>
      </div>
      {open && (
        <div className="grid grid-cols-[3.5rem_1fr] items-center gap-x-1.5 gap-y-1">
          <label htmlFor={`${item.id}-date`} className="text-[10px] text-neutral-400">
            {m.inspector.provenanceDate}
          </label>
          <input
            id={`${item.id}-date`}
            key={`${item.id}-date-${item.date ?? ''}`}
            type="date"
            defaultValue={date ?? ''}
            className={FIELD_CLS}
            onBlur={(e) => commit('date', e.target.value)}
          />
          <label htmlFor={`${item.id}-author`} className="text-[10px] text-neutral-400">
            {m.inspector.provenanceAuthor}
          </label>
          <input
            id={`${item.id}-author`}
            key={`${item.id}-author-${item.author ?? ''}`}
            defaultValue={item.author ?? ''}
            placeholder={m.inspector.provenanceAuthorPlaceholder}
            className={FIELD_CLS}
            onBlur={(e) => commit('author', e.target.value)}
          />
          <label htmlFor={`${item.id}-source`} className="text-[10px] text-neutral-400">
            {m.inspector.provenanceSource}
          </label>
          <input
            id={`${item.id}-source`}
            key={`${item.id}-source-${item.source ?? ''}`}
            defaultValue={item.source ?? ''}
            placeholder={m.inspector.provenanceSourcePlaceholder}
            className={FIELD_CLS}
            onBlur={(e) => commit('source', e.target.value)}
          />
          <label htmlFor={`${item.id}-url`} className="text-[10px] text-neutral-400">
            {m.inspector.provenanceUrl}
          </label>
          <input
            id={`${item.id}-url`}
            key={`${item.id}-url-${item.url ?? ''}`}
            type="url"
            defaultValue={item.url ?? ''}
            placeholder={m.inspector.provenanceUrlPlaceholder}
            className={FIELD_CLS}
            onBlur={(e) => commit('url', e.target.value)}
          />
          {item.url && !href && (
            <span className="col-span-2 text-[10px] text-[#a23b2c]">
              {m.inspector.provenanceUnsafeUrl}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
