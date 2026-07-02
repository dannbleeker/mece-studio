import { useState } from 'react';
import { Dialog } from '@/components/Dialog';
import { importText } from '@/services/import';
import { useStore } from '@/store';

// TODO(studio-kit): swap the local Dialog + inline button styles for the shared
// dialog/button primitives once MECE adopts studio-kit.

/**
 * Paste a Markdown outline (or a tree's JSON) and import it as a new tree. The
 * import opens as a fresh library entry, so the current tree is never touched.
 */
export function ImportDialog({ onClose }: { onClose: () => void }) {
  const openDoc = useStore((s) => s.openDoc);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onImport = () => {
    const result = importText(text, Date.now());
    if (!result) {
      setError("Couldn't read that as a Markdown outline, OPML, or a tree's JSON.");
      return;
    }
    openDoc(result.doc);
    onClose();
  };

  return (
    <Dialog
      label="Import a tree"
      subtitle="Paste a Markdown outline (headings or bullets), an OPML export from an outliner / mind-mapper, or a tree's JSON. The first heading or line becomes the root question; everything else nests beneath it."
      onClose={onClose}
    >
      <textarea
        aria-label="Outline or JSON to import"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (error) setError(null);
        }}
        rows={10}
        placeholder={
          '# Why are sales down?\n- Pricing\n  - Too high vs competitors\n- Demand\n- Distribution'
        }
        className="mt-4 w-full resize-y rounded-lg border border-neutral-200 bg-white p-3 font-mono text-[13px] text-neutral-800 outline-none focus-visible:ring-2 focus-visible:ring-[#3f6fb0]/40"
      />
      {error && <p className="mt-2 text-[13px] text-[#b3261e]">{error}</p>}
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-3 py-1.5 text-[13px] text-neutral-600 hover:bg-neutral-100"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onImport}
          disabled={!text.trim()}
          className="rounded-md bg-[#3f6fb0] px-3 py-1.5 font-medium text-[13px] text-white shadow-sm transition hover:bg-[#365f98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Import
        </button>
      </div>
    </Dialog>
  );
}
