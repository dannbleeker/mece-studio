import { priorityBand } from './priority';
import { childrenOf, splitOf } from './tree';
import type { EvidenceItem, IssueNode, IssueTreeDoc, NodeId, NodeStatus } from './types';

const STATUS_MARK: Partial<Record<NodeStatus, string>> = {
  supported: '✓ supported',
  refuted: '✗ refuted',
  parked: '⊘ parked',
};

function meceNote(doc: IssueTreeDoc, id: NodeId): string {
  const split = splitOf(doc, id);
  if (!split) return '';
  return `  _[${split.decomposition} · ME:${split.mece.exclusive.state} · CE:${split.mece.exhaustive.state}]_`;
}

function valueSuffix(amount: number, unit: string | undefined): string {
  return unit ? ` (${amount} ${unit})` : ` (${amount})`;
}

/** Status + priority annotations, e.g. " — ✓ supported, High priority". */
function metaTag(node: IssueNode): string {
  const parts: string[] = [];
  const status = STATUS_MARK[node.status];
  if (status) parts.push(status);
  if (node.priority) {
    const band = priorityBand(node.priority);
    parts.push(`${band[0].toUpperCase()}${band.slice(1)} priority`);
  }
  return parts.length > 0 ? ` — ${parts.join(', ')}` : '';
}

function detailNote(detail: string | undefined, indent: string): string {
  if (!detail || detail.trim() === '') return '';
  const oneLine = detail.trim().replace(/\s*\n\s*/g, ' ');
  return `\n${indent}  _${oneLine}_`;
}

/** Evidence as sub-bullets under a node, e.g. "  - ✓ (strong) summary". */
function evidenceLines(evidence: EvidenceItem[], indent: string): string[] {
  return evidence.map((e) => `${indent}  - ${e.supports ? '✓' : '✗'} (${e.strength}) ${e.summary}`);
}

function nodeBlock(doc: IssueTreeDoc, id: NodeId, depth: number, lines: string[]): void {
  const node = doc.nodes[id];
  if (!node) return;
  const indent = '  '.repeat(depth);
  const value = node.value ? valueSuffix(node.value.amount, node.value.unit) : '';
  lines.push(
    `${indent}- ${node.label}${value}${metaTag(node)}${meceNote(doc, id)}${detailNote(node.detail, indent)}`
  );
  if (node.evidence.length > 0) lines.push(...evidenceLines(node.evidence, indent));
  for (const child of childrenOf(doc, id)) nodeBlock(doc, child.id, depth + 1, lines);
}

/**
 * Render the tree as an indented Markdown outline — the root question as an H1,
 * its decomposition as nested bullets. Each node carries its value, hypothesis
 * status, priority, MECE state, notes, and evidence, so a copied outline holds
 * the whole analysis. Pure, so it's unit-testable.
 */
export function toMarkdown(doc: IssueTreeDoc): string {
  const root = doc.nodes[doc.rootId];
  const lines: string[] = [
    `# ${root?.label ?? doc.title}${root ? metaTag(root) : ''}${meceNote(doc, doc.rootId)}${detailNote(root?.detail, '')}`,
    '',
  ];
  if (root && root.evidence.length > 0) lines.push(...evidenceLines(root.evidence, ''), '');
  for (const child of childrenOf(doc, doc.rootId)) nodeBlock(doc, child.id, 0, lines);
  return `${lines.join('\n')}\n`;
}
