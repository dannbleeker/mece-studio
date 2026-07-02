import { TREE_KIND_LABELS } from '@/domain/constants';
import { evidenceLines, metaTag } from '@/domain/export';
import { meceSummary, splitWarnings } from '@/domain/meceStatus';
import { childrenOf, splitOf } from '@/domain/tree';
import type { IssueTreeDoc, NodeId } from '@/domain/types';
import { useStore } from '@/store';
import './print.css';

// TODO(studio-kit): swap the local overlay + inline styles for the shared
// dialog/print primitives once MECE adopts studio-kit.

/** A node's value rendered as " (12 DKK)" / " (12)", or "" when it has none. */
function valueSuffix(doc: IssueTreeDoc, id: NodeId): string {
  const v = doc.nodes[id]?.value;
  if (!v) return '';
  return v.unit ? ` (${v.amount} ${v.unit})` : ` (${v.amount})`;
}

/** One node and its subtree, as a nested outline item. */
function PrintNode({ doc, id }: { doc: IssueTreeDoc; id: NodeId }) {
  const node = doc.nodes[id];
  if (!node) return null;
  const split = splitOf(doc, id);
  const warnings = split ? splitWarnings(split) : [];
  const kids = childrenOf(doc, id);
  const meta = metaTag(node); // " — ✓ supported, High priority"
  const evidence = evidenceLines(node.evidence, '').map((l) => l.replace(/^\s*-\s*/, ''));

  return (
    <li className="print-node mt-2">
      <div className="font-medium text-[14px] text-neutral-900">
        {node.label}
        <span className="text-neutral-500">{valueSuffix(doc, id)}</span>
        {meta && <span className="font-normal text-[12px] text-neutral-500">{meta}</span>}
      </div>
      {node.detail && <div className="text-[12px] text-neutral-500 italic">{node.detail}</div>}
      {evidence.length > 0 && (
        <ul className="mt-0.5 text-[12px] text-neutral-600">
          {evidence.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      {warnings.length > 0 && (
        <div className="text-[12px] text-[#bd842c]">⚠ {warnings.join(' · ')}</div>
      )}
      {kids.length > 0 && (
        <ul className="ml-5 border-neutral-200 border-l pl-3">
          {kids.map((k) => (
            <PrintNode key={k.id} doc={doc} id={k.id} />
          ))}
        </ul>
      )}
    </li>
  );
}

/**
 * A print-friendly view of the whole tree (root question + nested
 * decomposition) shown in a full-screen overlay with a Print button. The print
 * stylesheet hides the app chrome so only the paper prints.
 */
export function PrintPreview({ onClose }: { onClose: () => void }) {
  const doc = useStore((s) => s.doc);
  const root = doc.nodes[doc.rootId];
  const rootSplit = splitOf(doc, doc.rootId);
  const kindLabel = rootSplit ? TREE_KIND_LABELS[rootSplit.decomposition] : 'Issue tree';
  const summary = meceSummary(doc);
  const meceLine =
    summary.kind === 'empty'
      ? 'Not decomposed yet'
      : summary.kind === 'clean'
        ? 'MECE clean — no splits flagged'
        : `${summary.warns} split${summary.warns === 1 ? '' : 's'} to review`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-100">
      <div className="print-hide flex shrink-0 items-center justify-between gap-2 border-neutral-200 border-b bg-white px-4 py-2.5">
        <span className="font-medium text-[13px] text-neutral-600">Print preview</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-md bg-[#3f6fb0] px-3 py-1.5 font-medium text-[13px] text-white shadow-sm hover:bg-[#365f98]"
          >
            Print
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-[13px] text-neutral-600 hover:bg-neutral-200"
          >
            Close
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-6">
        <div className="print-area mx-auto max-w-3xl rounded-lg bg-white p-10 shadow-sm">
          <h1 className="font-semibold text-[#3f6fb0] text-xl tracking-tight">
            {root?.label ?? 'Untitled tree'}
          </h1>
          <p className="mt-1 text-[12px] text-neutral-500">
            {kindLabel} · {meceLine}
          </p>
          {root?.detail && (
            <p className="mt-2 text-[13px] text-neutral-600 italic">{root.detail}</p>
          )}
          <ul className="mt-4">
            {childrenOf(doc, doc.rootId).map((k) => (
              <PrintNode key={k.id} doc={doc} id={k.id} />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
