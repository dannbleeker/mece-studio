import { useCallback, useEffect, useMemo, useState } from 'react';
import { splitWarnings } from '@/domain/meceStatus';
import { presentationSteps } from '@/domain/presentation';
import { childrenOf, splitOf } from '@/domain/tree';
import { renderMece } from '@/i18n/render';
import { useEditorMessages } from '@/i18n/useEditorMessages';
import { useStore } from '@/store';

// TODO(studio-kit): swap the local full-screen overlay for the shared
// presentation primitive once MECE adopts studio-kit.

/**
 * Full-screen, step-through presentation of a tree: one decomposition per
 * slide, walked depth-first (see `presentationSteps`). Arrow keys / Space
 * advance; Escape exits. The MECE analogue of TP Studio's PresentationStepThrough.
 */
export function PresentationView({ onClose }: { onClose: () => void }) {
  const m = useEditorMessages();
  const doc = useStore((s) => s.doc);
  const steps = useMemo(() => presentationSteps(doc), [doc]);
  const [index, setIndex] = useState(0);

  // Clamp if the tree shrank between renders.
  const safeIndex = Math.min(index, steps.length - 1);
  const nodeId = steps[safeIndex];

  const next = useCallback(
    () => setIndex((i) => Math.min(i + 1, steps.length - 1)),
    [steps.length]
  );
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, onClose]);

  const node = nodeId ? doc.nodes[nodeId] : undefined;
  const split = nodeId ? splitOf(doc, nodeId) : undefined;
  const kids = nodeId ? childrenOf(doc, nodeId) : [];
  const warnings = split ? splitWarnings(split).map((ref) => renderMece(m, ref)) : [];
  const kindLabel = split ? m.enums.treeKind[split.decomposition] : m.exports.presentNodeKind;
  // The slide's MECE footer: the split's warnings, or an all-clear once it has a
  // split and nothing is flagged. Nothing at all for an undecomposed leaf.
  const meceLine =
    warnings.length > 0
      ? `⚠ ${warnings.join(' · ')}`
      : split
        ? `✓ ${m.exports.presentClean}`
        : null;
  const meceTone = warnings.length > 0 ? 'text-[#e6b768]' : 'text-[#7fd1a0]';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#1d2433] text-neutral-100">
      <div className="flex shrink-0 items-center justify-between px-6 py-4">
        <span className="font-medium text-[13px] text-neutral-400">{m.exports.presentHeader}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label={m.exports.presentExitLabel}
          className="rounded-md px-3 py-1.5 text-[13px] text-neutral-300 hover:bg-white/10"
        >
          {m.exports.presentExit}
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8">
        <div className="w-full max-w-3xl">
          <p className="font-medium text-[#9db8e0] text-[13px] uppercase tracking-wide">
            {kindLabel}
          </p>
          <h1 className="mt-2 font-semibold text-3xl text-white tracking-tight">
            {node?.label ?? m.content.untitledTree}
          </h1>
          {kids.length > 0 ? (
            <ul className="mt-8 space-y-3">
              {kids.map((k) => (
                <li
                  key={k.id}
                  className="flex items-baseline gap-3 rounded-lg bg-white/5 px-4 py-3 text-lg"
                >
                  <span className="text-[#9db8e0]">›</span>
                  <span className="text-neutral-100">{k.label}</span>
                  {k.value && (
                    <span className="ml-auto text-[15px] text-neutral-400">
                      {m.exports.valueText(k.value)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-8 text-lg text-neutral-400">{m.exports.presentLeaf}</p>
          )}
          <div className="mt-6 text-[14px]">
            {meceLine && <span className={meceTone}>{meceLine}</span>}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between px-6 py-4 text-[13px] text-neutral-400">
        <span>{m.exports.presentProgress({ index: safeIndex + 1, total: steps.length })}</span>
        <span className="hidden sm:inline">{m.exports.presentNavHint}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prev}
            disabled={safeIndex === 0}
            className="rounded-md px-3 py-1.5 text-neutral-200 hover:bg-white/10 disabled:opacity-40"
          >
            {m.exports.presentPrev}
          </button>
          <button
            type="button"
            onClick={next}
            disabled={safeIndex >= steps.length - 1}
            className="rounded-md bg-[#3f6fb0] px-3 py-1.5 font-medium text-white hover:bg-[#365f98] disabled:opacity-40"
          >
            {m.exports.presentNext}
          </button>
        </div>
      </div>
    </div>
  );
}
