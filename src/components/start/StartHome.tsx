import { useState } from 'react';
import type { ExampleTree } from '@/domain/examples';
import { meceSummary } from '@/domain/meceStatus';
import type { DecompositionType } from '@/domain/types';
import { docName } from '@/services/storage';
import { relativeTime, treeKind } from './format';
import { ExampleTreesGroup, FrameworksGroup } from './Patterns';
import { MecePill, TreeGallery } from './TreeGallery';
import { TreePreview } from './TreePreview';
import type { LibraryDoc } from './useLibraryDocs';

const SAMPLE_QUESTIONS = [
  'Why is profit falling?',
  'Should we launch a subscription tier?',
  'Where is delivery time lost?',
];

const GROUP_HEADING = 'mb-3 font-medium text-[12px] text-neutral-400 uppercase tracking-wider';

interface StartHomeProps {
  docs: LibraryDoc[];
  reviewCount: number;
  onBuild: (question: string) => void;
  onPickFramework: (type: DecompositionType) => void;
  onPickExample: (ex: ExampleTree) => void;
  onOpen: (id: string) => void;
  onSeeAllTrees: () => void;
}

export function StartHome({
  docs,
  reviewCount,
  onBuild,
  onPickFramework,
  onPickExample,
  onOpen,
  onSeeAllTrees,
}: StartHomeProps) {
  const [question, setQuestion] = useState('');
  const recent = [...docs].sort((a, b) => b.doc.updatedAt - a.doc.updatedAt);
  const resume = recent[0];
  const rest = recent.slice(1);

  return (
    <div className="space-y-10">
      <section>
        <p className="font-semibold text-[12px] text-[#3f6fb0] uppercase tracking-wider">
          Issue trees · MECE by construction
        </p>
        <h1 className="mt-1 font-semibold text-[28px] text-neutral-900 tracking-tight">
          What's your key question?
        </h1>
        <p className="mt-2 max-w-2xl text-[14px] text-neutral-600 leading-relaxed">
          State the question you need to answer. MECE Studio scaffolds the first split and checks
          every branch for overlaps and gaps — so your tree is mutually exclusive and collectively
          exhaustive as you build.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onBuild(question);
            }}
            placeholder={'e.g. “How do we cut customer churn?”'}
            aria-label="Key question"
            className="min-w-0 flex-1 rounded-lg border border-[#d7d4cb] bg-white px-3.5 py-2.5 text-[14px] text-neutral-800 focus:border-[#3f6fb0] focus:outline-none"
          />
          <button
            type="button"
            onClick={() => onBuild(question)}
            className="w-full shrink-0 rounded-lg bg-[#3f6fb0] px-4 py-2.5 font-medium text-[14px] text-white hover:bg-[#365f98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3f6fb0]/40 sm:w-auto"
          >
            Build an issue tree →
          </button>
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-neutral-400 uppercase tracking-wider">Try</span>
          {SAMPLE_QUESTIONS.map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => onBuild(sample)}
              className="rounded-full border border-[#e7e4dc] bg-white px-3 py-1 text-[12px] text-neutral-600 hover:border-[#3f6fb0] hover:text-[#3f6fb0]"
            >
              {sample}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className={GROUP_HEADING}>…or start from a framework</h2>
        <FrameworksGroup onPick={onPickFramework} />
      </section>

      <section>
        <h2 className={GROUP_HEADING}>Example trees</h2>
        <ExampleTreesGroup onPick={onPickExample} />
      </section>

      {resume && (
        <section>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className={`${GROUP_HEADING} mb-0`}>Pick up where you left off</h2>
            <div className="flex items-baseline gap-3">
              {reviewCount > 0 && (
                <span className="text-[12px] text-[#bd842c]">
                  {reviewCount} {reviewCount === 1 ? 'tree needs' : 'trees need'} a MECE review
                </span>
              )}
              {rest.length > 0 && (
                <button
                  type="button"
                  onClick={onSeeAllTrees}
                  className="text-[12px] text-[#3f6fb0] hover:underline"
                >
                  See all trees →
                </button>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpen(resume.entry.id)}
            className="flex w-full items-center gap-4 rounded-xl border border-[#e7e4dc] bg-white p-3 text-left shadow-sm transition hover:border-[#3f6fb0] hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3f6fb0]/40"
          >
            <span className="block h-24 w-44 shrink-0 overflow-hidden rounded-lg border border-[#efece4] bg-[#faf9f5]">
              <TreePreview doc={resume.doc} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium text-[15px] text-neutral-800">
                {docName(resume.doc)}
              </span>
              <span className="mt-0.5 block text-[12px] text-neutral-500">
                {treeKind(resume.doc)} · edited {relativeTime(resume.doc.updatedAt)}
              </span>
              <span className="mt-2 block">
                <MecePill summary={meceSummary(resume.doc)} />
              </span>
            </span>
            <span className="shrink-0 pr-1 font-medium text-[#3f6fb0] text-[13px]">Resume →</span>
          </button>

          {rest.length > 0 && (
            <div className="mt-4">
              <TreeGallery docs={rest} onOpen={onOpen} />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
