import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { AboutDialog } from '@/components/about/AboutDialog';
import { Canvas } from '@/components/canvas/Canvas';
import { HeaderMenu, type MenuEntry } from '@/components/header/HeaderMenu';
import { Inspector } from '@/components/inspector/Inspector';
import { HealthChip } from '@/components/review/HealthChip';
import { ReviewPanel } from '@/components/review/ReviewPanel';
import { SynthesisPanel } from '@/components/SynthesisPanel';
import { SettingsDialog } from '@/components/settings/SettingsDialog';
import { ShortcutsDialog } from '@/components/shortcuts/ShortcutsDialog';
import { StartPage } from '@/components/start/StartPage';
import { TREE_KIND_LABELS } from '@/domain/constants';
import { toMarkdown } from '@/domain/export';
import { splitOf } from '@/domain/tree';
import { copyToClipboard, downloadText } from '@/services/download';
import { parseDoc } from '@/services/storage';
import { useStore } from '@/store';

const GHOST_BTN =
  'rounded-md px-2.5 py-1.5 text-[13px] text-neutral-600 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-300';

/** A thin vertical rule that separates header clusters. */
function Divider() {
  return <span className="mx-1 h-5 w-px bg-neutral-200" />;
}

/** A square icon button for the header (undo/redo, settings, shortcuts). */
function IconBtn({
  label,
  title,
  onClick,
  disabled,
  children,
}: {
  label: string;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={title}
      className="grid h-8 w-8 place-items-center rounded-md text-[15px] text-neutral-600 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-300"
    >
      {children}
    </button>
  );
}

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
  const reviewOpen = useStore((s) => s.reviewOpen);
  const requestExport = useStore((s) => s.requestExport);
  const [showSynthesis, setShowSynthesis] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const onCopyMarkdown = () => void copyToClipboard(toMarkdown(doc));
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

  // The tree's title + a type badge derived from how the root is decomposed.
  const rootLabel = doc.nodes[doc.rootId]?.label ?? 'Untitled tree';
  const rootSplit = splitOf(doc, doc.rootId);
  const kindLabel = rootSplit ? TREE_KIND_LABELS[rootSplit.decomposition] : 'Issue tree';

  const exportItems: MenuEntry[] = [
    { key: 'png', label: 'PNG', onClick: () => requestExport('png') },
    { key: 'pdf', label: 'PDF', onClick: () => requestExport('pdf') },
    { key: 'pptx', label: 'PPTX', onClick: () => requestExport('pptx') },
  ];
  // Secondary actions, tucked into an overflow menu to keep the header clustered.
  const overflowItems: MenuEntry[] = [
    { key: 'copy', label: 'Copy Markdown', onClick: onCopyMarkdown },
    { key: 'open', label: 'Open JSON…', onClick: () => fileInputRef.current?.click() },
    { key: 'save', label: 'Save JSON', onClick: onSaveJson },
    { key: 'sep1', divider: true },
    { key: 'about', label: 'About', onClick: () => setShowAbout(true) },
    { key: 'sep2', divider: true },
    { key: 'new', label: 'New tree', onClick: () => newDoc() },
    { key: 'delete', label: 'Delete tree', onClick: onDelete },
  ];

  return (
    <div className="flex h-full flex-col bg-[#faf9f5] text-neutral-800">
      <header className="flex shrink-0 items-center gap-2 border-neutral-200 border-b bg-white px-4 py-2.5">
        {/* Left cluster — brand, back, and the tree's title + type */}
        <button
          type="button"
          onClick={() => setView('start')}
          className="rounded-md px-1 font-semibold text-[#3f6fb0] text-lg tracking-tight hover:opacity-80"
          title="Back to Start"
        >
          MECE Studio
        </button>
        <Divider />
        <button
          type="button"
          onClick={() => setView('start')}
          className={GHOST_BTN}
          title="All trees (Start)"
        >
          ← Start
        </button>
        <Divider />
        <span className="flex min-w-0 items-center gap-2">
          <span
            className="max-w-[16rem] truncate font-medium text-[14px] text-neutral-800"
            title={rootLabel}
          >
            {rootLabel}
          </span>
          <span className="shrink-0 rounded-md bg-[#eef2f9] px-1.5 py-0.5 font-medium text-[#3f6fb0] text-[10px]">
            {kindLabel}
          </span>
        </span>

        {/* Right cluster — health, history, synthesis, export, utilities */}
        <div className="ml-auto flex items-center gap-1">
          <HealthChip />
          <Divider />
          <IconBtn label="Undo" title="Undo (Ctrl/⌘+Z)" disabled={!canUndo} onClick={undo}>
            ↶
          </IconBtn>
          <IconBtn
            label="Redo"
            title="Redo (Ctrl/⌘+Y or Ctrl/⌘+Shift+Z)"
            disabled={!canRedo}
            onClick={redo}
          >
            ↷
          </IconBtn>
          <Divider />
          <button type="button" onClick={() => setShowSynthesis((v) => !v)} className={GHOST_BTN}>
            Synthesis
          </button>
          <HeaderMenu
            triggerLabel="Export"
            triggerContent={
              <>
                Export
                <span aria-hidden="true" className="text-[10px] opacity-70">
                  ▾
                </span>
              </>
            }
            triggerClassName="inline-flex items-center gap-1.5 rounded-md bg-[#3f6fb0] px-3 py-1.5 font-medium text-[13px] text-white shadow-sm transition hover:bg-[#365f98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3f6fb0]/40"
            items={exportItems}
          />
          <IconBtn label="Settings" title="Settings" onClick={() => setShowSettings(true)}>
            ⚙
          </IconBtn>
          <IconBtn
            label="Keyboard shortcuts"
            title="Keyboard shortcuts (?)"
            onClick={() => setShowShortcuts(true)}
          >
            ?
          </IconBtn>
          <HeaderMenu
            triggerLabel="More actions"
            triggerContent={<span aria-hidden="true">⋯</span>}
            triggerClassName="grid h-8 w-8 place-items-center rounded-md text-[18px] text-neutral-600 leading-none hover:bg-neutral-100"
            items={overflowItems}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={onOpenFile}
          />
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
        {reviewOpen ? <ReviewPanel /> : <Inspector />}
      </div>
    </div>
  );
}

/** Top-level router: the Start workspace shell, or a tree open on the canvas. */
export function App() {
  const view = useStore((s) => s.view);
  return view === 'start' ? <StartPage /> : <Workspace />;
}
