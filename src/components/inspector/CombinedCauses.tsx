import { useState } from 'react';
import { linksFor } from '@/domain/links';
import type { IssueNode, NodeId } from '@/domain/types';
import { useEditorMessages } from '@/i18n/useEditorMessages';
import { useStore } from '@/store';

const LABEL_CLS = 'font-medium text-[11px] text-neutral-400 uppercase tracking-wider';

/**
 * The node's combined-cause links: other hypotheses it may only cause the
 * problem together with. A note over the tree, not a branch of it, so nothing
 * here touches the split or its MECE result.
 */
export function CombinedCauses({ node }: { node: IssueNode }) {
  const m = useEditorMessages();
  const doc = useStore((s) => s.doc);
  const addLink = useStore((s) => s.addLink);
  const removeLink = useStore((s) => s.removeLink);
  const setLinkNote = useStore((s) => s.setLinkNote);
  const locate = useStore((s) => s.locate);
  const [pick, setPick] = useState('');
  const links = linksFor(doc, node.id);
  const linked = new Set(links.map((l) => (l.a === node.id ? l.b : l.a)));
  const candidates = Object.values(doc.nodes).filter(
    (n) => n.id !== node.id && n.id !== doc.rootId && !linked.has(n.id)
  );
  const name = (id: NodeId) => doc.nodes[id]?.label || m.content.untitled;

  return (
    <section className="flex flex-col gap-2 border-neutral-100 border-t pt-3">
      <span className={LABEL_CLS} title={m.inspector.linksHint}>
        {m.inspector.linksHeading}
      </span>
      {links.map((l) => {
        const other = l.a === node.id ? l.b : l.a;
        return (
          <div key={l.id} className="flex flex-col gap-1 rounded-md bg-[#f5f1fa] px-2 py-1.5">
            <div className="flex items-center gap-1.5 text-[12px]">
              <button
                type="button"
                className="min-w-0 flex-1 truncate text-left text-[#6a4f93] hover:underline"
                onClick={() => locate(other)}
              >
                {name(other)}
              </button>
              <button
                type="button"
                aria-label={m.inspector.linkRemove({ other: name(other) })}
                className="shrink-0 rounded px-1 text-neutral-400 hover:bg-white hover:text-neutral-700"
                onClick={() => removeLink(l.id)}
              >
                ×
              </button>
            </div>
            <input
              key={`${l.id}-${l.note ?? ''}`}
              defaultValue={l.note ?? ''}
              aria-label={m.inspector.linkNoteLabel({ other: name(other) })}
              placeholder={m.inspector.linkNotePlaceholder}
              className="rounded border border-neutral-200 bg-white px-1.5 py-0.5 text-[12px] focus:border-[#3f6fb0] focus:outline-none"
              onBlur={(e) => setLinkNote(l.id, e.target.value)}
            />
          </div>
        );
      })}
      {candidates.length > 0 && (
        <div className="flex items-center gap-1.5">
          <select
            value={pick}
            aria-label={m.inspector.linkPick}
            onChange={(e) => setPick(e.target.value)}
            className="min-w-0 flex-1 rounded-md border border-neutral-300 px-1.5 py-1 text-[12px]"
          >
            <option value="">{m.inspector.linkPick}</option>
            {candidates.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label || m.content.untitled}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={pick === ''}
            className="shrink-0 rounded-md border border-neutral-300 px-2 py-1 font-medium text-[12px] text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
            onClick={() => {
              addLink(node.id, pick as NodeId);
              setPick('');
            }}
          >
            {m.inspector.linkAdd}
          </button>
        </div>
      )}
    </section>
  );
}
