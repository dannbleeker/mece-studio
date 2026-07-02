import { useEffect, useRef, useState } from 'react';
import { Dialog } from '@/components/Dialog';
import { childrenOf } from '@/domain/tree';
import { useStore } from '@/store';

// TODO(studio-kit): swap the local Dialog + inline button styles for the shared
// dialog/button primitives once MECE adopts studio-kit.

/**
 * Quick capture: type one issue per line and add them all as children of the
 * selected node (or the root question when nothing is selected) in a single
 * undoable step. A fast way to dump a decomposition without clicking node by
 * node — the MECE analogue of TP Studio's QuickCaptureDialog.
 */
export function QuickCaptureDialog({ onClose }: { onClose: () => void }) {
  const doc = useStore((s) => s.doc);
  const selectedId = useStore((s) => s.selectedId);
  const addChildren = useStore((s) => s.addChildren);
  const captureChildren = useStore((s) => s.captureChildren);
  const select = useStore((s) => s.select);

  const parentId = selectedId ?? doc.rootId;
  const parentLabel = doc.nodes[parentId]?.label ?? 'the root question';
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // A capture box exists to be typed in — focus it on open (after the dialog's
  // own focus-trap has run).
  useEffect(() => textareaRef.current?.focus(), []);

  const onAdd = () => {
    if (text.trim() === '') return;
    const before = childrenOf(doc, parentId).length;
    // Indented / bulleted paste → nest it as a subtree; a flat list stays flat.
    const nested = text
      .split('\n')
      .some((l) => /^[ \t]+\S/.test(l) || /^\s*(?:[-*+]|\d+[.)])\s/.test(l));
    if (nested) {
      captureChildren(parentId, text);
    } else {
      addChildren(
        parentId,
        text.split('\n').filter((l) => l.trim() !== '')
      );
    }
    // Select the first newly-added child so the canvas centres the new branch.
    const kids = childrenOf(useStore.getState().doc, parentId);
    const firstNew = kids[before]?.id;
    if (firstNew) select(firstNew);
    onClose();
  };

  // Cmd/Ctrl+Enter submits from the textarea (a textarea swallows plain Enter).
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onAdd();
    }
  };

  return (
    <Dialog
      label="Quick add issues"
      subtitle={
        <>
          One issue per line — each becomes a child of{' '}
          <span className="font-medium text-neutral-700">“{parentLabel}”</span>.{' '}
          <span className="text-neutral-400">Indent (Tab / spaces) to nest sub-issues.</span>
        </>
      }
      onClose={onClose}
    >
      <textarea
        ref={textareaRef}
        aria-label="Issues to add, one per line"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        rows={6}
        placeholder={'Pricing\n  Cost floor\n  Value ceiling\nDemand\nDistribution'}
        className="mt-4 w-full resize-y rounded-lg border border-neutral-200 bg-white p-3 text-[14px] text-neutral-800 outline-none focus-visible:ring-2 focus-visible:ring-[#3f6fb0]/40"
      />
      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="text-[12px] text-neutral-400">⌘/Ctrl + Enter to add</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-[13px] text-neutral-600 hover:bg-neutral-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onAdd}
            disabled={text.trim() === ''}
            className="rounded-md bg-[#3f6fb0] px-3 py-1.5 font-medium text-[13px] text-white shadow-sm transition hover:bg-[#365f98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add issues
          </button>
        </div>
      </div>
    </Dialog>
  );
}
