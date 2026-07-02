import { useMemo } from 'react';
import { type MeceSummary, meceSummary } from '@/domain/meceStatus';
import { loadDocById } from '@/services/storage';
import { useStore } from '@/store';

// TODO(studio-kit): swap this local strip for the shared TabBar once MECE
// adopts studio-kit. The multi-document store state (openTabs / closeTab) is
// MECE-owned and stays; only this rendering is provisional.

/** The display name for an open tab — its tree's root question. */
function tabName(library: { id: string; name: string }[], id: string): string {
  return library.find((e) => e.id === id)?.name || 'Untitled tree';
}

/** Per-tab MECE health dot — clean (green) / to-review (amber) / empty (grey). */
const HEALTH_TONE: Record<MeceSummary['kind'], string> = {
  clean: '#3f7d54',
  review: '#bd842c',
  empty: '#cfccc3',
};

/**
 * A strip of the trees open in tabs, above the canvas. Click a tab to switch,
 * the × to close it, and + to start a new tree. Hidden when only one tree is
 * open, so a single-tree workspace stays uncluttered.
 */
export function TabStrip() {
  const openTabs = useStore((s) => s.openTabs);
  const activeId = useStore((s) => s.activeId);
  const library = useStore((s) => s.library);
  const doc = useStore((s) => s.doc);
  const switchDoc = useStore((s) => s.switchDoc);
  const closeTab = useStore((s) => s.closeTab);
  const newDoc = useStore((s) => s.newDoc);

  // MECE health per open tab: the active doc from the store, others from storage.
  const health = useMemo(() => {
    const map: Record<string, MeceSummary> = {};
    for (const id of openTabs) {
      const d = id === activeId ? doc : loadDocById(id);
      if (d) map[id] = meceSummary(d);
    }
    return map;
  }, [openTabs, activeId, doc]);

  if (openTabs.length <= 1) return null;

  return (
    <nav
      aria-label="Open trees"
      className="flex shrink-0 items-center gap-1 overflow-x-auto border-neutral-200 border-b bg-[#f3f1ea] px-2 py-1"
    >
      {openTabs.map((id) => {
        const active = id === activeId;
        const summary = health[id];
        return (
          <div
            key={id}
            className={`group flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[13px] ${
              active
                ? 'bg-white font-medium text-neutral-800 shadow-sm'
                : 'text-neutral-500 hover:bg-white/60'
            }`}
          >
            {summary && (
              <span
                aria-hidden="true"
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: HEALTH_TONE[summary.kind] }}
                title={
                  summary.kind === 'review'
                    ? `${summary.warns} to review`
                    : summary.kind === 'clean'
                      ? 'MECE clean'
                      : 'Not decomposed yet'
                }
              />
            )}
            <button
              type="button"
              onClick={() => switchDoc(id)}
              className="max-w-[14rem] truncate"
              title={tabName(library, id)}
            >
              {tabName(library, id)}
            </button>
            <button
              type="button"
              onClick={() => closeTab(id)}
              aria-label={`Close ${tabName(library, id)}`}
              className="rounded px-1 text-neutral-400 opacity-0 transition hover:bg-neutral-200 hover:text-neutral-700 group-hover:opacity-100"
            >
              ✕
            </button>
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => newDoc()}
        aria-label="New tree"
        title="New tree"
        className="ml-1 shrink-0 rounded-md px-2 py-1 text-[15px] text-neutral-500 leading-none hover:bg-white/60"
      >
        +
      </button>
    </nav>
  );
}
