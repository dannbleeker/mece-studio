import { useState } from 'react';
import { Canvas } from '@/components/canvas/Canvas';
import { Inspector } from '@/components/inspector/Inspector';
import { SynthesisPanel } from '@/components/SynthesisPanel';
import { toMarkdown } from '@/domain/export';
import { copyToClipboard, downloadText } from '@/services/download';
import { useStore } from '@/store';

const GHOST_BTN =
  'rounded-md px-2.5 py-1.5 text-[13px] text-neutral-600 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-300';

export function App() {
  const doc = useStore((s) => s.doc);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const canUndo = useStore((s) => s.canUndo());
  const canRedo = useStore((s) => s.canRedo());
  const [copied, setCopied] = useState(false);
  const [showSynthesis, setShowSynthesis] = useState(false);

  const onCopyMarkdown = () => {
    void copyToClipboard(toMarkdown(doc));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };
  const onSaveJson = () => {
    downloadText('mece-tree.json', JSON.stringify(doc, null, 2), 'application/json');
  };

  return (
    <div className="flex h-full flex-col bg-[#faf9f5] text-neutral-800">
      <header className="flex shrink-0 items-center gap-3 border-neutral-200 border-b bg-white px-5 py-2.5">
        <span className="font-semibold text-[#3f6fb0] text-lg tracking-tight">MECE Studio</span>
        <span className="hidden text-[12px] text-neutral-400 sm:inline">
          issue trees, MECE by construction
        </span>
        <div className="ml-auto flex items-center gap-1">
          <button type="button" onClick={() => setShowSynthesis((v) => !v)} className={GHOST_BTN}>
            Synthesis
          </button>
          <span className="mx-1 h-5 w-px bg-neutral-200" />
          <button type="button" onClick={onCopyMarkdown} className={GHOST_BTN}>
            {copied ? 'Copied!' : 'Copy Markdown'}
          </button>
          <button type="button" onClick={onSaveJson} className={GHOST_BTN}>
            Save JSON
          </button>
          <span className="mx-1 h-5 w-px bg-neutral-200" />
          <button type="button" disabled={!canUndo} onClick={undo} className={GHOST_BTN}>
            Undo
          </button>
          <button type="button" disabled={!canRedo} onClick={redo} className={GHOST_BTN}>
            Redo
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <main className="relative min-w-0 flex-1">
          <Canvas />
          {showSynthesis && <SynthesisPanel onClose={() => setShowSynthesis(false)} />}
        </main>
        <Inspector />
      </div>
    </div>
  );
}
