import { childrenOf, splitOf } from './tree';
import type { IssueTreeDoc, NodeId } from './types';

function meceNote(doc: IssueTreeDoc, id: NodeId): string {
  const split = splitOf(doc, id);
  if (!split) return '';
  return `  _[${split.decomposition} · ME:${split.mece.exclusive.state} · CE:${split.mece.exhaustive.state}]_`;
}

function valueSuffix(amount: number, unit: string | undefined): string {
  return unit ? ` (${amount} ${unit})` : ` (${amount})`;
}

function detailNote(detail: string | undefined, indent: string): string {
  if (!detail || detail.trim() === '') return '';
  const oneLine = detail.trim().replace(/\s*\n\s*/g, ' ');
  return `\n${indent}  _${oneLine}_`;
}

function nodeLine(doc: IssueTreeDoc, id: NodeId, depth: number): string {
  const node = doc.nodes[id];
  if (!node) return '';
  const indent = '  '.repeat(depth);
  const value = node.value ? valueSuffix(node.value.amount, node.value.unit) : '';
  return `${indent}- ${node.label}${value}${meceNote(doc, id)}${detailNote(node.detail, indent)}`;
}

/**
 * Render the tree as an indented Markdown outline — the root question as an H1,
 * its decomposition as nested bullets, each split annotated with its MECE state.
 * Pure, so it's unit-testable.
 */
export function toMarkdown(doc: IssueTreeDoc): string {
  const root = doc.nodes[doc.rootId];
  const lines: string[] = [
    `# ${root?.label ?? doc.title}${meceNote(doc, doc.rootId)}${detailNote(root?.detail, '')}`,
    '',
  ];
  const walk = (id: NodeId, depth: number): void => {
    lines.push(nodeLine(doc, id, depth));
    for (const child of childrenOf(doc, id)) walk(child.id, depth + 1);
  };
  for (const child of childrenOf(doc, doc.rootId)) walk(child.id, 0);
  return `${lines.join('\n')}\n`;
}
