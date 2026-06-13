import { CHECK_STATE_COLOR } from '@/components/checkColors';
import { type MeceSummary, meceSummary } from '@/domain/meceStatus';
import type { IssueTreeDoc } from '@/domain/types';
import { docName } from '@/services/storage';
import { relativeTime, treeKind } from './format';
import { TreePreview } from './TreePreview';
import type { LibraryDoc } from './useLibraryDocs';

const CARD =
  'group flex flex-col gap-2 rounded-xl border border-[#e7e4dc] bg-white p-3 text-left shadow-sm transition hover:border-[#3f6fb0] hover:shadow-md focus:border-[#3f6fb0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3f6fb0]/40';

/** The MECE pill — reads the SAME `split.mece` the canvas + inspector use. */
export function MecePill({ summary }: { summary: MeceSummary }) {
  const color =
    summary.kind === 'clean'
      ? CHECK_STATE_COLOR.pass
      : summary.kind === 'review'
        ? CHECK_STATE_COLOR.warn
        : CHECK_STATE_COLOR.unknown;
  const label =
    summary.kind === 'clean'
      ? 'MECE clean'
      : summary.kind === 'review'
        ? `${summary.warns} to check`
        : 'No splits yet';
  return (
    <span
      className="inline-flex items-center gap-1.5 self-start rounded-full px-2 py-0.5 font-medium text-[11px]"
      style={{ color, background: `${color}1f` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function TreeCard({ doc, onOpen }: { doc: IssueTreeDoc; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className={CARD} title={docName(doc)}>
      <span className="block h-28 overflow-hidden rounded-lg border border-[#efece4] bg-[#faf9f5]">
        <TreePreview doc={doc} />
      </span>
      <span className="truncate font-medium text-[14px] text-neutral-800" title={docName(doc)}>
        {docName(doc)}
      </span>
      <span className="text-[12px] text-neutral-500">
        {treeKind(doc)} · edited {relativeTime(doc.updatedAt)}
      </span>
      <MecePill summary={meceSummary(doc)} />
    </button>
  );
}

interface TreeGalleryProps {
  docs: LibraryDoc[];
  query?: string;
  emptyMessage?: string;
  onOpen: (id: string) => void;
}

export function TreeGallery({ docs, query = '', emptyMessage, onOpen }: TreeGalleryProps) {
  const q = query.trim().toLowerCase();
  const filtered = q ? docs.filter((d) => docName(d.doc).toLowerCase().includes(q)) : docs;

  if (filtered.length === 0) {
    return (
      <p className="rounded-xl border border-[#e7e4dc] border-dashed bg-white/50 px-4 py-8 text-center text-[13px] text-neutral-500">
        {emptyMessage ?? (q ? `No trees match “${query}”.` : 'No trees yet.')}
      </p>
    );
  }

  return (
    <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
      {filtered.map(({ entry, doc }) => (
        <TreeCard key={entry.id} doc={doc} onOpen={() => onOpen(entry.id)} />
      ))}
    </div>
  );
}
