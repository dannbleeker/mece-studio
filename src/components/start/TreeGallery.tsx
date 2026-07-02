import { CHECK_STATE_COLOR } from '@/components/checkColors';
import { type MeceSummary, meceSummary } from '@/domain/meceStatus';
import { searchNodes } from '@/domain/search';
import type { IssueTreeDoc } from '@/domain/types';
import { docName } from '@/services/storage';
import { relativeTime, treeKind } from './format';
import { TreePreview } from './TreePreview';
import type { LibraryDoc } from './useLibraryDocs';

/** Optional per-tree management actions; when given, cards show a hover/focus action row. */
export interface ManageHandlers {
  // `| undefined` (not just `?`) so the handlers can be forwarded through
  // components under exactOptionalPropertyTypes.
  onRename?: ((id: string) => void) | undefined;
  onDuplicate?: ((id: string) => void) | undefined;
  onDelete?: ((id: string) => void) | undefined;
}

const CARD =
  'group relative flex flex-col rounded-xl border border-[#e7e4dc] bg-white shadow-sm transition hover:border-[#3f6fb0] hover:shadow-md focus-within:border-[#3f6fb0]';
const OPEN_BTN =
  'flex flex-col gap-2 rounded-xl p-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3f6fb0]/40';
const ACTION =
  'rounded-md bg-white/90 px-1.5 py-0.5 text-[11px] text-neutral-500 shadow-sm ring-1 ring-[#e7e4dc] hover:bg-white hover:text-[#3f6fb0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3f6fb0]/50';

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

/**
 * Match a tree against a query across its content — name, node labels, and notes
 * — so a library search finds "which tree has the pricing-floor logic?", not just
 * matching titles. Returns a hint (the matching node's label) for a content match.
 */
function treeMatch(doc: IssueTreeDoc, q: string): { match: boolean; hint?: string } {
  if (!q) return { match: true };
  if (docName(doc).toLowerCase().includes(q)) return { match: true };
  const nodeHit = searchNodes(doc, q)[0];
  if (nodeHit) return { match: true, hint: doc.nodes[nodeHit]?.label };
  const noteHit = Object.values(doc.nodes).find((n) => n.detail?.toLowerCase().includes(q));
  if (noteHit) return { match: true, hint: noteHit.label };
  return { match: false };
}

function TreeCard({
  id,
  doc,
  onOpen,
  matchHint,
  onRename,
  onDuplicate,
  onDelete,
}: {
  id: string;
  doc: IssueTreeDoc;
  onOpen: () => void;
  matchHint?: string | undefined;
} & ManageHandlers) {
  const name = docName(doc);
  const hasActions = onRename || onDuplicate || onDelete;
  return (
    <div className={CARD}>
      <button type="button" onClick={onOpen} className={OPEN_BTN} aria-label={`Open ${name}`}>
        <span className="block h-28 overflow-hidden rounded-lg border border-[#efece4] bg-[#faf9f5]">
          <TreePreview doc={doc} />
        </span>
        <span className="truncate font-medium text-[14px] text-neutral-800" title={name}>
          {name}
        </span>
        <span className="text-[12px] text-neutral-500">
          {treeKind(doc)} · edited {relativeTime(doc.updatedAt)}
        </span>
        {matchHint && (
          <span className="truncate text-[11px] text-[#3f6fb0]" title={matchHint}>
            matches “{matchHint}”
          </span>
        )}
        <MecePill summary={meceSummary(doc)} />
      </button>
      {hasActions && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          {onRename && (
            <button
              type="button"
              className={ACTION}
              aria-label={`Rename ${name}`}
              title="Rename"
              onClick={() => onRename(id)}
            >
              Rename
            </button>
          )}
          {onDuplicate && (
            <button
              type="button"
              className={ACTION}
              aria-label={`Duplicate ${name}`}
              title="Duplicate"
              onClick={() => onDuplicate(id)}
            >
              Duplicate
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className={`${ACTION} hover:text-[#bd4a3a]`}
              aria-label={`Delete ${name}`}
              title="Delete"
              onClick={() => onDelete(id)}
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface TreeGalleryProps extends ManageHandlers {
  docs: LibraryDoc[];
  query?: string;
  emptyMessage?: string;
  onOpen: (id: string) => void;
}

export function TreeGallery({
  docs,
  query = '',
  emptyMessage,
  onOpen,
  onRename,
  onDuplicate,
  onDelete,
}: TreeGalleryProps) {
  const q = query.trim().toLowerCase();
  const results = docs.map((d) => ({ d, ...treeMatch(d.doc, q) })).filter((r) => r.match);

  if (results.length === 0) {
    return (
      <p className="rounded-xl border border-[#e7e4dc] border-dashed bg-white/50 px-4 py-8 text-center text-[13px] text-neutral-500">
        {emptyMessage ?? (q ? `No trees match “${query}”.` : 'No trees yet.')}
      </p>
    );
  }

  return (
    <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
      {results.map(({ d: { entry, doc }, hint }) => (
        <TreeCard
          key={entry.id}
          id={entry.id}
          doc={doc}
          onOpen={() => onOpen(entry.id)}
          matchHint={hint}
          onRename={onRename}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
