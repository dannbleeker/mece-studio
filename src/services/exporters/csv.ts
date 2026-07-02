import { priorityBand } from '@/domain/priority';
import { childrenOf, splitOf } from '@/domain/tree';
import type { IssueTreeDoc, NodeId } from '@/domain/types';

/** Quote a CSV cell when it contains a comma, quote, or newline (RFC 4180). */
function csvCell(value: string | number | undefined): string {
  const s = value === undefined ? '' : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const HEADER = [
  'path',
  'label',
  'decomposition',
  'ME',
  'CE',
  'priority',
  'status',
  'amount',
  'unit',
  'operator',
];

/**
 * Export the tree as CSV — one row per node — so the value model (amounts,
 * units, roll-up operator) and the analysis (decomposition, ME/CE state,
 * priority band, hypothesis status) land in a spreadsheet without retyping.
 * Pure; the natural handoff for a value-driver tree. Excel opens .csv directly.
 */
export function treeToCsv(doc: IssueTreeDoc): string {
  const rows: string[][] = [HEADER];

  const walk = (id: NodeId, parentPath: string): void => {
    const node = doc.nodes[id];
    if (!node) return;
    const split = splitOf(doc, id);
    const path = parentPath ? `${parentPath} > ${node.label}` : node.label;
    rows.push([
      path,
      node.label,
      split?.decomposition ?? '',
      split ? split.mece.exclusive.state : '',
      split ? split.mece.exhaustive.state : '',
      node.priority ? priorityBand(node.priority) : '',
      node.status,
      node.value?.amount !== undefined ? String(node.value.amount) : '',
      node.value?.unit ?? '',
      split?.operator ?? '',
    ]);
    for (const child of childrenOf(doc, id)) walk(child.id, path);
  };

  walk(doc.rootId, '');
  return `${rows.map((r) => r.map(csvCell).join(',')).join('\r\n')}\r\n`;
}
