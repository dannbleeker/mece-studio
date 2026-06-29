import { useCallback, useEffect, useMemo, useState } from 'react';
import { TREE_KIND_LABELS } from '@/domain/constants';
import { splitWarnings } from '@/domain/meceStatus';
import { presentationSteps } from '@/domain/presentation';
import { childrenOf, splitOf } from '@/domain/tree';
import type { IssueTreeDoc, NodeId } from '@/domain/types';
import { useStore } from '@/store';

// TODO(studio-kit): swap the local full-screen overlay for the shared
// presentation primitive once MECE adopts studio-kit.

/** A node's value rendered as "12 DKK" / "12", or "" when it has none. */
function valueText(doc: IssueTreeDoc, id: NodeId): string {
  const v = doc.nodes[id]?.value;
  if (!v) return '';
  return v.unit ? `${v.amount} ${v.unit}` : `${v.amount}`;
}

/**
 * Full-screen, step-through presentation of a tree: one decomposition per
 * slide, walked depth-first (see `presentationSteps`). Arrow keys / Space
 * advance; Escape exits. The MECE analogue of TP Studio's PresentationStepThrough.
 */
export function PresentationView({ onClose }: { onClose: () => void }) {
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
  const warnings = split ? splitWarnings(split) : [];
  const kindLabel = split ? TREE_KIND_LABELS[split.decomposition] : 'Issue';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#1d2433] text-neutral-100">
      <div className="flex shrink-0 items-center justify-between px-6 py-4">
        <span className="font-medium text-[13px] text-neutral-400">MECE Studio · Presentation</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Exit presentation"
          className="rounded-md px-3 py-1.5 text-[13px] text-neutral-300 hover:bg-white/10"
        >
          Exit (Esc)
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8">
        <div className="w-full max-w-3xl">
          <p className="font-medium text-[#9db8e0] text-[13px] uppercase tracking-wide">
            {kindLabel}
          </p>
          <h1 className="mt-2 font-semibold text-3xl text-white tracking-tight">
            {node?.label ?? 'Untitled tree'}
          </h1>
          {kids.length > 0 ? (
            <ul className="mt-8 space-y-3">
              {kids.map((k) => {
                const value = valueText(doc, k.id);
                return (
                  <li
                    key={k.id}
                    className="flex items-baseline gap-3 rounded-lg bg-white/5 px-4 py-3 text-lg"
                  >
                    <span className="text-[#9db8e0]">›</span>
                    <span className="text-neutral-100">{k.label}</span>
                    {value && <span className="ml-auto text-[15px] text-neutral-400">{value}</span>}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-8 text-lg text-neutral-400">A leaf issue — no decomposition.</p>
          )}
          <div className="mt-6 text-[14px]">
            {warnings.length > 0 ? (
              <span className="text-[#e6b768]">⚠ {warnings.join(' · ')}</span>
            ) : split ? (
              <span className="text-[#7fd1a0]">✓ MECE clean</span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between px-6 py-4 text-[13px] text-neutral-400">
        <span>
          {safeIndex + 1} / {steps.length}
        </span>
        <span className="hidden sm:inline">← / → to navigate · Esc to exit</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prev}
            disabled={safeIndex === 0}
            className="rounded-md px-3 py-1.5 text-neutral-200 hover:bg-white/10 disabled:opacity-40"
          >
            ← Prev
          </button>
          <button
            type="button"
            onClick={next}
            disabled={safeIndex >= steps.length - 1}
            className="rounded-md bg-[#3f6fb0] px-3 py-1.5 font-medium text-white hover:bg-[#365f98] disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
