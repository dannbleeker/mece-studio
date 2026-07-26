import { useState } from 'react';
import { Dialog } from '@/components/Dialog';
import { useMessages } from '@/i18n/useMessages';
import { importText } from '@/services/import';
import { useStore } from '@/store';

// TODO(studio-kit): swap the local Dialog + inline button styles for the shared
// dialog/button primitives once MECE adopts studio-kit.

/**
 * Paste a Markdown outline (or a tree's JSON) and import it as a new tree. The
 * import opens as a fresh library entry, so the current tree is never touched.
 */
export function ImportDialog({ onClose }: { onClose: () => void }) {
  const m = useMessages();
  const openDoc = useStore((s) => s.openDoc);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onImport = () => {
    const result = importText(text, Date.now(), m.content.importedOutlineLabel);
    if (!result) {
      setError(m.app.importError);
      return;
    }
    openDoc(result.doc);
    onClose();
  };

  return (
    <Dialog label={m.app.importTitle} subtitle={m.app.importSubtitle} onClose={onClose}>
      <textarea
        aria-label={m.app.importFieldLabel}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (error) setError(null);
        }}
        rows={10}
        placeholder={m.app.importPlaceholder}
        className="mt-4 w-full resize-y rounded-lg border border-neutral-200 bg-white p-3 font-mono text-[13px] text-neutral-800 outline-none focus-visible:ring-2 focus-visible:ring-[#3f6fb0]/40"
      />
      {error && <p className="mt-2 text-[13px] text-[#b3261e]">{error}</p>}
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-3 py-1.5 text-[13px] text-neutral-600 hover:bg-neutral-100"
        >
          {m.app.cancel}
        </button>
        <button
          type="button"
          onClick={onImport}
          disabled={!text.trim()}
          className="rounded-md bg-[#3f6fb0] px-3 py-1.5 font-medium text-[13px] text-white shadow-sm transition hover:bg-[#365f98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {m.app.importSubmit}
        </button>
      </div>
    </Dialog>
  );
}
