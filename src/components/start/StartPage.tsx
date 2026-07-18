import { useEffect, useMemo, useRef, useState } from 'react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Dialog } from '@/components/Dialog';
import { PromptDialog } from '@/components/PromptDialog';
import type { ExampleTree } from '@/domain/examples';
import { buildFrameworkTree, type FrameworkTemplate } from '@/domain/frameworks';
import { meceSummary } from '@/domain/meceStatus';
import type { DecompositionType } from '@/domain/types';
import { docName, type UserTemplate } from '@/services/storage';
import { useStore } from '@/store';
import { relativeTime, treeKind } from './format';
import { LearnMece } from './LearnMece';
import { ExampleTreesGroup, FrameworksGroup, FrameworkTemplatesGroup } from './Patterns';
import { type Section, Sidebar } from './Sidebar';
import { StartHome } from './StartHome';
import { type ManageHandlers, MecePill, TreeGallery } from './TreeGallery';
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

/** The full Templates page — your saved templates, decomposition styles, named frameworks, and worked examples. */
function TemplatesPage({
  userTemplates,
  onOpenTemplate,
  onDeleteTemplate,
  onPickFramework,
  onPickFrameworkTemplate,
  onPickExample,
}: {
  userTemplates: UserTemplate[];
  onOpenTemplate: (t: UserTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  onPickFramework: (type: DecompositionType) => void;
  onPickFrameworkTemplate: (t: FrameworkTemplate) => void;
  onPickExample: (ex: ExampleTree) => void;
}) {
  return (
    <div className="space-y-8">
      {userTemplates.length > 0 && (
        <section>
          <h2 className="font-semibold text-[16px] text-neutral-800">Your templates</h2>
          <p className="mt-1 mb-3 max-w-2xl text-[13px] text-neutral-500">
            Trees you saved as reusable starting points (structure only — values, evidence, and
            status are stripped). Save the current tree from <strong>⋯ → Save as template…</strong>.
          </p>
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(216px,1fr))]">
            {userTemplates.map((t) => (
              <div
                key={t.id}
                className="relative flex flex-col gap-1 rounded-xl border border-[#e7e4dc] bg-white p-3.5 shadow-sm transition hover:border-[#3f6fb0] hover:shadow-md"
              >
                <button
                  type="button"
                  onClick={() => onOpenTemplate(t)}
                  className="pr-5 text-left font-semibold text-[13px] text-neutral-800 hover:text-[#3f6fb0] focus:outline-none"
                  aria-label={`Open template ${t.name}`}
                >
                  {t.name}
                </button>
                <span className="text-[11px] text-neutral-400">Custom template</span>
                <button
                  type="button"
                  onClick={() => onDeleteTemplate(t.id)}
                  aria-label={`Delete template ${t.name}`}
                  title="Delete template"
                  className="absolute top-2 right-2 rounded px-1 text-[12px] text-neutral-300 hover:text-[#bd4a3a]"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
      <section>
        <h2 className="font-semibold text-[16px] text-neutral-800">Decomposition frameworks</h2>
        <p className="mt-1 mb-3 max-w-2xl text-[13px] text-neutral-500">
          Start a tree from a MECE-clean split. Binary and formula are provably MECE; the rest
          scaffold sensible starter branches you rename.
        </p>
        <FrameworksGroup onPick={onPickFramework} />
      </section>
      <section>
        <h2 className="font-semibold text-[16px] text-neutral-800">Named frameworks</h2>
        <p className="mt-1 mb-3 max-w-2xl text-[13px] text-neutral-500">
          Classic strategy, marketing, and diagnosis frameworks, ready to fill in. They organise
          your thinking but aren't guaranteed MECE — rename each branch to your situation and let
          the checks flag overlaps and gaps.
        </p>
        <FrameworkTemplatesGroup onPick={onPickFrameworkTemplate} />
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
  const setView = useStore((s) => s.setView);
  const decompose = useStore((s) => s.decompose);
  const renameDoc = useStore((s) => s.renameDoc);
  const duplicateDoc = useStore((s) => s.duplicateDoc);
  const deleteDoc = useStore((s) => s.deleteDoc);
  const userTemplates = useStore((s) => s.userTemplates);
  const deleteTemplate = useStore((s) => s.deleteTemplate);

  const docs = useLibraryDocs();
  const reviewDocs = useMemo(
    () => docs.filter((d) => meceSummary(d.doc).kind === 'review'),
    [docs]
  );

  const [section, setSection] = useState<Section>('start');
  const [navOpen, setNavOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [buildQuestion, setBuildQuestion] = useState<string | null>(null);
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

  // The hero CTA (and the "Try" chips) open a chooser so you land on a scaffolded
  // first split, not a lone root — the hero promises "scaffolds the first split".
  const onBuild = (question: string) => setBuildQuestion(question);
  const onPickFramework = (type: DecompositionType) => {
    newDoc();
    decompose(useStore.getState().doc.rootId, type);
  };
  const buildWithSplit = (type: DecompositionType) => {
    newDoc(buildQuestion ?? undefined);
    decompose(useStore.getState().doc.rootId, type);
    setBuildQuestion(null);
  };
  const buildBlank = () => {
    newDoc(buildQuestion ?? undefined);
    setBuildQuestion(null);
  };
  const onPickExample = (ex: ExampleTree) => openDoc(ex.build());
  const onPickFrameworkTemplate = (t: FrameworkTemplate) => openDoc(buildFrameworkTree(t));
  // setView too: opening the already-active tree is a no-op in switchDoc, but we
  // still want to leave the Start shell for the canvas.
  const onOpen = (id: string) => {
    switchDoc(id);
    setView('workspace');
  };
  const manage: ManageHandlers = {
    onRename: (id) => setRenamingId(id),
    onDuplicate: (id) => duplicateDoc(id),
    onDelete: (id) => setDeletingId(id),
  };
  const nameOf = (id: string) => docs.find((d) => d.entry.id === id)?.entry.name ?? '';

  return (
    <div className="flex h-full bg-[#faf9f5] text-neutral-800">
      <Sidebar
        section={section}
        onSection={setSection}
        onNew={() => newDoc()}
        treeCount={docs.length}
        reviewCount={reviewDocs.length}
        open={navOpen}
        onClose={() => setNavOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-3 border-[#e7e4dc] border-b bg-white px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="Open navigation"
            className="-ml-1 grid h-9 w-9 shrink-0 place-items-center rounded-md text-[18px] text-neutral-600 hover:bg-neutral-100 sm:hidden"
          >
            ☰
          </button>
          <span className="font-medium text-[13px] text-neutral-500">{SECTION_TITLE[section]}</span>
          <div className="relative ml-auto min-w-0 flex-1 sm:flex-none">
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
              className="w-full rounded-lg border border-[#e7e4dc] bg-[#faf9f5] py-1.5 pr-12 pl-3 text-[13px] focus:border-[#3f6fb0] focus:bg-white focus:outline-none sm:w-64"
            />
            <kbd className="-translate-y-1/2 absolute top-1/2 right-2 hidden rounded border border-[#e7e4dc] bg-white px-1.5 text-[11px] text-neutral-400 sm:block">
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
              {...manage}
            />
          )}
          {section === 'all' && (
            <TreeGallery docs={docs} query={query} onOpen={onOpen} {...manage} />
          )}
          {section === 'recent' && <RecentList docs={docs} onOpen={onOpen} />}
          {section === 'templates' && (
            <TemplatesPage
              userTemplates={userTemplates}
              onOpenTemplate={(t) => openDoc(t.doc)}
              onDeleteTemplate={deleteTemplate}
              onPickFramework={onPickFramework}
              onPickFrameworkTemplate={onPickFrameworkTemplate}
              onPickExample={onPickExample}
            />
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
                {...manage}
              />
            </div>
          )}
          {section === 'learn' && <LearnMece />}
        </main>
      </div>

      {buildQuestion !== null && (
        <Dialog
          label="How do you want to split it?"
          subtitle={
            buildQuestion.trim()
              ? `“${buildQuestion.trim()}” — pick a decomposition to scaffold the first split, or start blank.`
              : 'Pick a decomposition to scaffold the first split, or start blank.'
          }
          wide
          onClose={() => setBuildQuestion(null)}
        >
          <div className="mt-4">
            <FrameworksGroup onPick={buildWithSplit} />
            <button
              type="button"
              onClick={buildBlank}
              className="mt-4 text-[13px] text-neutral-500 hover:text-neutral-800 hover:underline"
            >
              Start blank instead →
            </button>
          </div>
        </Dialog>
      )}

      {renamingId && (
        <PromptDialog
          label="Rename tree"
          initialValue={nameOf(renamingId)}
          submitLabel="Rename"
          onSubmit={(name) => renameDoc(renamingId, name)}
          onClose={() => setRenamingId(null)}
        />
      )}
      {deletingId && (
        <ConfirmDialog
          label="Delete tree"
          message={`Delete "${nameOf(deletingId) || 'this tree'}"? This cannot be undone.`}
          confirmLabel="Delete tree"
          destructive
          onConfirm={() => {
            deleteDoc(deletingId);
            setView('start'); // stay on Start even if the deleted tree was the active one
          }}
          onClose={() => setDeletingId(null)}
        />
      )}
    </div>
  );
}
