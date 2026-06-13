import { useEffect, useMemo, useRef, useState } from 'react';
import type { ExampleTree } from '@/domain/examples';
import { meceSummary } from '@/domain/meceStatus';
import type { DecompositionType } from '@/domain/types';
import { docName } from '@/services/storage';
import { useStore } from '@/store';
import { relativeTime, treeKind } from './format';
import { LearnMece } from './LearnMece';
import { ExampleTreesGroup, FrameworksGroup } from './Patterns';
import { type Section, Sidebar } from './Sidebar';
import { StartHome } from './StartHome';
import { MecePill, TreeGallery } from './TreeGallery';
import { type LibraryDoc, useLibraryDocs } from './useLibraryDocs';

const SECTION_TITLE: Record<Section, string> = {
  start: 'Start',
  all: 'All trees',
  recent: 'Recent',
  templates: 'Templates',
  review: 'Needs review',
  learn: 'Learn MECE',
};

/** A compact, most-recent-first list of every tree. */
function RecentList({ docs, onOpen }: { docs: LibraryDoc[]; onOpen: (id: string) => void }) {
  const recent = [...docs].sort((a, b) => b.doc.updatedAt - a.doc.updatedAt);
  if (recent.length === 0) {
    return <p className="text-[13px] text-neutral-500">No trees yet.</p>;
  }
  return (
    <ul className="divide-y divide-[#efece4] overflow-hidden rounded-xl border border-[#e7e4dc] bg-white">
      {recent.map(({ entry, doc }) => (
        <li key={entry.id}>
          <button
            type="button"
            onClick={() => onOpen(entry.id)}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-[#faf9f5] focus:bg-[#faf9f5] focus:outline-none"
          >
            <span className="min-w-0 flex-1 truncate text-[14px] text-neutral-800">
              {docName(doc)}
            </span>
            <span className="hidden shrink-0 text-[12px] text-neutral-400 sm:block">
              {treeKind(doc)}
            </span>
            <span className="w-20 shrink-0 text-right text-[12px] text-neutral-400">
              {relativeTime(doc.updatedAt)}
            </span>
            <MecePill summary={meceSummary(doc)} />
          </button>
        </li>
      ))}
    </ul>
  );
}

/** The full Templates page — the same two groups as the Start strips, with page headings. */
function TemplatesPage({
  onPickFramework,
  onPickExample,
}: {
  onPickFramework: (type: DecompositionType) => void;
  onPickExample: (ex: ExampleTree) => void;
}) {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-semibold text-[16px] text-neutral-800">Decomposition frameworks</h2>
        <p className="mt-1 mb-3 max-w-2xl text-[13px] text-neutral-500">
          Start a tree from a MECE-clean split. Binary and formula are provably MECE; the rest
          scaffold sensible starter branches you rename.
        </p>
        <FrameworksGroup onPick={onPickFramework} />
      </section>
      <section>
        <h2 className="font-semibold text-[16px] text-neutral-800">Example trees</h2>
        <p className="mt-1 mb-3 max-w-2xl text-[13px] text-neutral-500">
          Open a ready-made tree and learn by poking at a real one. Each opens as a fresh copy in
          your library.
        </p>
        <ExampleTreesGroup onPick={onPickExample} />
      </section>
    </div>
  );
}

/** The Start workspace shell: a persistent sidebar whose nav switches the main view. */
export function StartPage() {
  const newDoc = useStore((s) => s.newDoc);
  const openDoc = useStore((s) => s.openDoc);
  const switchDoc = useStore((s) => s.switchDoc);
  const decompose = useStore((s) => s.decompose);

  const docs = useLibraryDocs();
  const reviewDocs = useMemo(
    () => docs.filter((d) => meceSummary(d.doc).kind === 'review'),
    [docs]
  );

  const [section, setSection] = useState<Section>('start');
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl+K jumps to the searchable tree list and focuses the box.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSection('all');
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onBuild = (question: string) => newDoc(question);
  const onPickFramework = (type: DecompositionType) => {
    newDoc();
    decompose(useStore.getState().doc.rootId, type);
  };
  const onPickExample = (ex: ExampleTree) => openDoc(ex.build());
  const onOpen = (id: string) => switchDoc(id);

  return (
    <div className="flex h-full bg-[#faf9f5] text-neutral-800">
      <Sidebar
        section={section}
        onSection={setSection}
        onNew={() => newDoc()}
        treeCount={docs.length}
        reviewCount={reviewDocs.length}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-3 border-[#e7e4dc] border-b bg-white px-6 py-3">
          <span className="font-medium text-[13px] text-neutral-500">{SECTION_TITLE[section]}</span>
          <div className="relative ml-auto">
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value && section !== 'all' && section !== 'review') setSection('all');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setQuery('');
              }}
              placeholder="Search trees…"
              aria-label="Search trees"
              className="w-64 rounded-lg border border-[#e7e4dc] bg-[#faf9f5] py-1.5 pr-12 pl-3 text-[13px] focus:border-[#3f6fb0] focus:bg-white focus:outline-none"
            />
            <kbd className="-translate-y-1/2 absolute top-1/2 right-2 rounded border border-[#e7e4dc] bg-white px-1.5 text-[11px] text-neutral-400">
              ⌘K
            </kbd>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          {section === 'start' && (
            <StartHome
              docs={docs}
              reviewCount={reviewDocs.length}
              onBuild={onBuild}
              onPickFramework={onPickFramework}
              onPickExample={onPickExample}
              onOpen={onOpen}
              onSeeAllTrees={() => setSection('all')}
            />
          )}
          {section === 'all' && <TreeGallery docs={docs} query={query} onOpen={onOpen} />}
          {section === 'recent' && <RecentList docs={docs} onOpen={onOpen} />}
          {section === 'templates' && (
            <TemplatesPage onPickFramework={onPickFramework} onPickExample={onPickExample} />
          )}
          {section === 'review' && (
            <div className="space-y-4">
              <p className="text-[13px] text-neutral-500">
                {reviewDocs.length === 0
                  ? 'Every split is MECE clean — nothing to review.'
                  : `${reviewDocs.length} ${reviewDocs.length === 1 ? 'tree has' : 'trees have'} a split flagged for review.`}
              </p>
              <TreeGallery
                docs={reviewDocs}
                query={query}
                emptyMessage="Nothing to review — every split is MECE clean."
                onOpen={onOpen}
              />
            </div>
          )}
          {section === 'learn' && <LearnMece />}
        </main>
      </div>
    </div>
  );
}
