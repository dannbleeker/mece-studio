import { useMemo } from 'react';
import { DECOMPOSITION_HINTS, DECOMPOSITION_LABELS } from '@/domain/constants';
import { EXAMPLE_TREES, type ExampleTree } from '@/domain/examples';
import { scaffoldChildren } from '@/domain/scaffold';
import type { DecompositionType } from '@/domain/types';
import { decompositionMeta } from './meta';
import { TreePreview } from './TreePreview';

const TILE =
  'flex flex-col gap-2 rounded-xl border border-[#e7e4dc] bg-white p-3.5 text-left shadow-sm transition hover:border-[#3f6fb0] hover:shadow-md focus:border-[#3f6fb0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3f6fb0]/40';

/**
 * The decomposition frameworks, mapped from DECOMPOSITION_LABELS (not hardcoded) —
 * so a new type added to the union/labels renders here with no edits. Clicking
 * picks the type; the caller creates a tree (or decomposes the selection) by it.
 */
export function FrameworksGroup({ onPick }: { onPick: (type: DecompositionType) => void }) {
  const types = Object.keys(DECOMPOSITION_LABELS) as DecompositionType[];
  return (
    <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(216px,1fr))]">
      {types.map((type) => {
        const meta = decompositionMeta(type);
        return (
          <button key={type} type="button" onClick={() => onPick(type)} className={TILE}>
            <span className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[15px]"
                style={{ color: meta.accent, background: `${meta.accent}14` }}
              >
                {meta.icon}
              </span>
              <span className="font-semibold text-[13px] text-neutral-800">
                {DECOMPOSITION_LABELS[type]}
              </span>
            </span>
            {meta.provable && (
              <span
                className="self-start rounded px-1.5 py-0.5 font-medium text-[10px]"
                style={{ color: '#3f7d54', background: '#3f7d5414' }}
              >
                provably MECE
              </span>
            )}
            <span className="text-[12px] text-neutral-500 leading-snug">
              {DECOMPOSITION_HINTS[type]}
            </span>
            <span className="mt-0.5 flex flex-wrap gap-1">
              {scaffoldChildren(type).map((label) => (
                <span
                  key={label}
                  className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-600"
                >
                  {label}
                </span>
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * The ready-made example trees, mapped from EXAMPLE_TREES — adding an entry there
 * makes a card appear here with no edits. Clicking opens a fresh copy.
 */
export function ExampleTreesGroup({ onPick }: { onPick: (ex: ExampleTree) => void }) {
  const built = useMemo(() => EXAMPLE_TREES.map((ex) => ({ ex, doc: ex.build() })), []);
  return (
    <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
      {built.map(({ ex, doc }) => (
        <button key={ex.id} type="button" onClick={() => onPick(ex)} className={TILE}>
          <span className="block h-24 overflow-hidden rounded-lg border border-[#efece4] bg-[#faf9f5]">
            <TreePreview doc={doc} />
          </span>
          <span className="font-semibold text-[13px] text-neutral-800">{ex.name}</span>
          <span className="text-[12px] text-neutral-500 leading-snug">{ex.blurb}</span>
        </button>
      ))}
    </div>
  );
}
