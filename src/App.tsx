import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { AboutDialog } from '@/components/about/AboutDialog';
import { Canvas } from '@/components/canvas/Canvas';
import { Inspector } from '@/components/inspector/Inspector';
import { SynthesisPanel } from '@/components/SynthesisPanel';
import { SettingsDialog } from '@/components/settings/SettingsDialog';
import { ShortcutsDialog } from '@/components/shortcuts/ShortcutsDialog';
import { StartPage } from '@/components/start/StartPage';
import { toMarkdown } from '@/domain/export';
import { copyToClipboard, downloadText } from '@/services/download';
import { parseDoc } from '@/services/storage';
import { useStore } from '@/store';

const GHOST_BTN =
  'rounded-md px-2.5 py-1.5 text-[13px] text-neutral-600 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-300';

/** The tree-editing surface: header actions + canvas + inspector. */
export function Workspace() {
  const doc = useStore((s) => s.doc);
  const newDoc = useStore((s) => s.newDoc);
  const openDoc = useStore((s) => s.openDoc);
  const activeId = useStore((s) => s.activeId);
  const deleteDoc = useStore((s) => s.deleteDoc);
  const setView = useStore((s) => s.setView);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const removeNode = useStore((s) => s.removeNode);
  const selectedId = useStore((s) => s.selectedId);
  const canUndo = useStore((s) => s.canUndo());
  const canRedo = useStore((s) => s.canRedo());
  const [copied, setCopied] = useState(false);
  const [showSynthesis, setShowSynthesis] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const onCopyMarkdown = () => {
    void copyToClipboard(toMarkdown(doc));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };
  const onSaveJson = () => {
    downloadText('mece-tree.json', JSON.stringify(doc, null, 2), 'application/json');
  };
  const onDelete = () => {
    if (window.confirm('Delete this tree? This cannot be undone.')) deleteDoc(activeId);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const onOpenFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // let the same file be re-opened later
    if (!file) return;
    void file.text().then((text) => {
      const next = parseDoc(text);
      if (next) openDoc(next);
      else window.alert('That file is not a valid MECE Studio tree (.json).');
    });
  };

  // Keyboard shortcuts: undo / redo, and Delete to remove the selected node.
  // Ignored while typing in a field so it never hijacks the inspector inputs.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return;
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (mod && key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (mod && (key === 'y' || (key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        removeNode(selectedId);
      } else if (e.key === '?') {
        e.preventDefault();
        setShowShortcuts((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, removeNode, selectedId]);

  return (
    <div className="flex h-full flex-col bg-[#faf9f5] text-neutral-800">
      <header className="flex shrink-0 items-center gap-2 border-neutral-200 border-b bg-white px-5 py-2.5">
        <button
          type="button"
          onClick={() => setView('start')}
          className="rounded-md px-1 font-semibold text-[#3f6fb0] text-lg tracking-tight hover:opacity-80"
          title="Back to Start"
        >
          MECE Studio
        </button>
        <button
          type="button"
          onClick={() => setView('start')}
          className={GHOST_BTN}
          title="All trees (Start)"
        >
          ← Start
        </button>
        <button type="button" onClick={() => newDoc()} className={GHOST_BTN} title="New tree">
          + New
        </button>
        <button type="button" onClick={onDelete} className={GHOST_BTN} title="Delete this tree">
          Delete
        </button>
        <div className="ml-auto flex items-center gap-1">
          <button type="button" onClick={() => setShowSynthesis((v) => !v)} className={GHOST_BTN}>
            Synthesis
          </button>
          <span className="mx-1 h-5 w-px bg-neutral-200" />
          <button type="button" onClick={onCopyMarkdown} className={GHOST_BTN}>
            {copied ? 'Copied!' : 'Copy Markdown'}
          </button>
          <button type="button" onClick={() => fileInputRef.current?.click()} className={GHOST_BTN}>
            Open
          </button>
          <button type="button" onClick={onSaveJson} className={GHOST_BTN}>
            Save JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={onOpenFile}
          />
          <span className="mx-1 h-5 w-px bg-neutral-200" />
          <button
            type="button"
            disabled={!canUndo}
            onClick={undo}
            title="Undo (Ctrl/⌘+Z)"
            className={GHOST_BTN}
          >
            Undo
          </button>
          <button
            type="button"
            disabled={!canRedo}
            onClick={redo}
            title="Redo (Ctrl/⌘+Y or Ctrl/⌘+Shift+Z)"
            className={GHOST_BTN}
          >
            Redo
          </button>
          <span className="mx-1 h-5 w-px bg-neutral-200" />
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className={GHOST_BTN}
            title="Settings"
            aria-label="Settings"
          >
            ⚙
          </button>
          <button
            type="button"
            onClick={() => setShowShortcuts(true)}
            className={GHOST_BTN}
            title="Keyboard shortcuts (?)"
            aria-label="Keyboard shortcuts"
          >
            ?
          </button>
          <button type="button" onClick={() => setShowAbout(true)} className={GHOST_BTN}>
            About
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <main className="relative min-w-0 flex-1">
          <Canvas />
          {showSynthesis && <SynthesisPanel onClose={() => setShowSynthesis(false)} />}
          {showAbout && <AboutDialog onClose={() => setShowAbout(false)} />}
          {showShortcuts && <ShortcutsDialog onClose={() => setShowShortcuts(false)} />}
          {showSettings && <SettingsDialog onClose={() => setShowSettings(false)} />}
        </main>
        <Inspector />
      </div>
    </div>
  );
}

/** Top-level router: the Start workspace shell, or a tree open on the canvas. */
export function App() {
  const view = useStore((s) => s.view);
  return view === 'start' ? <StartPage /> : <Workspace />;
}
