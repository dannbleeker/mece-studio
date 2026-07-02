import { useEffect, useState } from 'react';
import { AnswerBanner } from '@/components/AnswerBanner';
import { AboutDialog } from '@/components/about/AboutDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Canvas } from '@/components/canvas/Canvas';
import { QuickCaptureDialog } from '@/components/capture/QuickCaptureDialog';
import { HeaderMenu, type MenuEntry } from '@/components/header/HeaderMenu';
import { ImportDialog } from '@/components/import/ImportDialog';
import { Inspector } from '@/components/inspector/Inspector';
import { PromptDialog } from '@/components/PromptDialog';
import { PresentationView } from '@/components/present/PresentationView';
import { PrintPreview } from '@/components/print/PrintPreview';
import { HealthChip } from '@/components/review/HealthChip';
import { ReviewPanel } from '@/components/review/ReviewPanel';
import { SynthesisPanel } from '@/components/SynthesisPanel';
import { SettingsDialog } from '@/components/settings/SettingsDialog';
import { ShortcutsDialog } from '@/components/shortcuts/ShortcutsDialog';
import { TabStrip } from '@/components/tabs/TabStrip';
import { TREE_KIND_LABELS } from '@/domain/constants';
import { toMarkdown } from '@/domain/export';
import { answerPageHtml } from '@/domain/synthesisFormat';
import { splitOf } from '@/domain/tree';
import { copyToClipboard, downloadText } from '@/services/download';
import { treeToCsv, treeToJson } from '@/services/exporters';
import { clearFileHandle, getFileHandle, setFileHandle } from '@/services/fileHandles';
import {
  InvalidTreeFileError,
  openTreeFile,
  saveTreeFile,
  saveTreeFileAs,
} from '@/services/fileSystemAccess';
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
  const setPriority = useStore((s) => s.setPriority);
  const saveAsTemplate = useStore((s) => s.saveAsTemplate);
  const selectedId = useStore((s) => s.selectedId);
  const canUndo = useStore((s) => s.canUndo());
  const canRedo = useStore((s) => s.canRedo());
  const reviewOpen = useStore((s) => s.reviewOpen);
  const requestExport = useStore((s) => s.requestExport);
  const [showSynthesis, setShowSynthesis] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [showPresentation, setShowPresentation] = useState(false);
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);

  const onCopyMarkdown = () => void copyToClipboard(toMarkdown(doc));

  // Open a .json tree from disk; bind its file handle to the freshly-imported
  // id so a later Save writes back to the same file. (openDoc re-ids on import.)
  const onOpenFile = async () => {
    try {
      const opened = await openTreeFile();
      if (!opened) return; // user cancelled the picker
      openDoc(opened.doc);
      if (opened.handle) await setFileHandle(useStore.getState().doc.id, opened.handle);
    } catch (err) {
      window.alert(err instanceof InvalidTreeFileError ? err.message : 'Could not open that file.');
    }
  };

  // Save: write back to the bound file if we have one, else prompt for a location.
  const onSaveJson = async () => {
    const id = doc.id;
    const existing = await getFileHandle(id);
    const handle = await saveTreeFile(doc, existing);
    if (handle && handle !== existing) await setFileHandle(id, handle);
  };

  // Save As: always prompt for a new location, then bind to it.
  const onSaveAs = async () => {
    const handle = await saveTreeFileAs(doc);
    if (handle) await setFileHandle(doc.id, handle);
  };

  const doDelete = () => {
    void clearFileHandle(activeId);
    deleteDoc(activeId);
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
      } else if (key === 'p' && !mod && selectedId) {
        // Bump the selected node's priority: none → low → medium → high → none
        // (both axes together — a quick keyboard flag for "this matters").
        e.preventDefault();
        const seq = [undefined, 'low', 'medium', 'high'] as const;
        const cur = useStore.getState().doc.nodes[selectedId]?.priority;
        const idx = cur ? seq.indexOf(cur.impact) : 0;
        const next = seq[(idx + 1) % seq.length];
        setPriority(selectedId, next ? { impact: next, ease: next } : undefined);
      } else if (e.key === '?') {
        e.preventDefault();
        setShowShortcuts((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, removeNode, setPriority, selectedId]);

  // The tree's title + a type badge derived from how the root is decomposed.
  const rootLabel = doc.nodes[doc.rootId]?.label ?? 'Untitled tree';
  const rootSplit = splitOf(doc, doc.rootId);
  const kindLabel = rootSplit ? TREE_KIND_LABELS[rootSplit.decomposition] : 'Issue tree';

  // PNG/PDF/PPTX render the canvas, so they route through the store to the
  // canvas; JSON only needs the document, so it downloads straight from here.
  const onExportJson = () => downloadText('mece-tree.json', treeToJson(doc), 'application/json');
  const onExportCsv = () => downloadText('mece-tree.csv', treeToCsv(doc), 'text/csv');
  const onExportAnswer = () => downloadText('mece-answer.html', answerPageHtml(doc), 'text/html');
  // A backend-free, read-anywhere share link: the tree's JSON, base64'd into the URL
  // hash. Opening the link imports the tree as a new library entry (see App).
  const onCopyShareLink = () => {
    const bytes = new TextEncoder().encode(treeToJson(doc));
    let bin = '';
    for (const b of bytes) bin += String.fromCharCode(b);
    const url = `${window.location.origin}${window.location.pathname}#doc=${encodeURIComponent(btoa(bin))}`;
    void copyToClipboard(url);
  };
  const exportItems: MenuEntry[] = [
    { key: 'png', label: 'PNG', onClick: () => requestExport('png') },
    { key: 'svg', label: 'SVG', onClick: () => requestExport('svg') },
    { key: 'pdf', label: 'PDF', onClick: () => requestExport('pdf') },
    { key: 'pptx', label: 'PPTX', onClick: () => requestExport('pptx') },
    { key: 'copyImg', label: 'Copy image', onClick: () => requestExport('copy') },
    { key: 'sep-e', divider: true },
    { key: 'json', label: 'JSON', onClick: onExportJson },
    { key: 'csv', label: 'CSV (value model)', onClick: onExportCsv },
    { key: 'answer', label: 'Answer (1-page)', onClick: onExportAnswer },
    { key: 'share', label: 'Copy share link', onClick: onCopyShareLink },
  ];
  // Secondary actions, tucked into an overflow menu to keep the header clustered.
  const overflowItems: MenuEntry[] = [
    { key: 'quickAdd', label: 'Quick add issues…', onClick: () => setShowQuickCapture(true) },
    { key: 'sep0', divider: true },
    { key: 'copy', label: 'Copy Markdown', onClick: onCopyMarkdown },
    { key: 'open', label: 'Open file…', onClick: () => void onOpenFile() },
    { key: 'import', label: 'Import outline…', onClick: () => setShowImport(true) },
    { key: 'save', label: 'Save', onClick: () => void onSaveJson() },
    { key: 'saveAs', label: 'Save As…', onClick: () => void onSaveAs() },
    { key: 'template', label: 'Save as template…', onClick: () => setShowSaveTemplate(true) },
    { key: 'sep1', divider: true },
    { key: 'present', label: 'Present', onClick: () => setShowPresentation(true) },
    { key: 'print', label: 'Print…', onClick: () => setShowPrint(true) },
    { key: 'sep2', divider: true },
    { key: 'about', label: 'About', onClick: () => setShowAbout(true) },
    { key: 'sep3', divider: true },
    { key: 'new', label: 'New tree', onClick: () => newDoc() },
    { key: 'sep4', divider: true },
    {
      key: 'delete',
      label: 'Delete tree',
      destructive: true,
      onClick: () => setShowDeleteConfirm(true),
    },
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
        </div>
      </header>

      <TabStrip />
      <AnswerBanner />

      <div className="flex min-h-0 flex-1">
        <main className="relative min-w-0 flex-1">
          <Canvas />
          {showSynthesis && <SynthesisPanel onClose={() => setShowSynthesis(false)} />}
          {showAbout && <AboutDialog onClose={() => setShowAbout(false)} />}
          {showShortcuts && <ShortcutsDialog onClose={() => setShowShortcuts(false)} />}
          {showSettings && <SettingsDialog onClose={() => setShowSettings(false)} />}
          {showImport && <ImportDialog onClose={() => setShowImport(false)} />}
          {showPrint && <PrintPreview onClose={() => setShowPrint(false)} />}
          {showPresentation && <PresentationView onClose={() => setShowPresentation(false)} />}
          {showQuickCapture && <QuickCaptureDialog onClose={() => setShowQuickCapture(false)} />}
          {showDeleteConfirm && (
            <ConfirmDialog
              label="Delete tree"
              message={`Delete "${rootLabel}"? This cannot be undone.`}
              confirmLabel="Delete tree"
              destructive
              onConfirm={doDelete}
              onClose={() => setShowDeleteConfirm(false)}
            />
          )}
          {showSaveTemplate && (
            <PromptDialog
              label="Save as template"
              subtitle="Reuse this tree's structure on a future engagement — values, evidence, and status are stripped."
              initialValue={rootLabel}
              submitLabel="Save template"
              onSubmit={(name) => saveAsTemplate(name)}
              onClose={() => setShowSaveTemplate(false)}
            />
          )}
        </main>
        {reviewOpen ? <ReviewPanel /> : <Inspector />}
      </div>
    </div>
  );
}
