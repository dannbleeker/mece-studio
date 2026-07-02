import { priorityBand, priorityScore } from './priority';
import { childrenOf, splitOf } from './tree';
import type { IssueNode, IssueTreeDoc, NodeId, Split } from './types';

function scoreOf(node: IssueNode | undefined): number {
  return node?.priority ? priorityScore(node.priority) : 0;
}

function meceFlags(split: Split | undefined): string {
  if (!split) return '';
  const issues: string[] = [];
  if (split.mece.exclusive.state === 'warn') issues.push('overlap');
  if (split.mece.exhaustive.state === 'warn') issues.push('gap');
  return issues.length > 0 ? `  ⚠ ${issues.join(' + ')}` : '';
}

function dimensionNote(split: Split | undefined): string {
  return split?.dimension ? ` _[by ${split.dimension}]_` : '';
}

function render(doc: IssueTreeDoc, id: NodeId, depth: number, lines: string[]): void {
  const node = doc.nodes[id];
  if (!node) return;
  const split = splitOf(doc, id);
  const indent = '  '.repeat(depth);
  const band = node.priority ? ` _(${priorityBand(node.priority)})_` : '';
  const mark =
    node.status === 'supported'
      ? '✓ '
      : node.status === 'refuted'
        ? '✗ '
        : node.status === 'parked'
          ? '⊘ '
          : '';
  lines.push(`${indent}- ${mark}${node.label}${band}${dimensionNote(split)}${meceFlags(split)}`);
  if (node.evidence.length > 0) {
    const ev = node.evidence.map((e) => `${e.supports ? '✓' : '✗'} ${e.summary}`).join('; ');
    lines.push(`${indent}  evidence: ${ev}`);
  }
  const childIds = split?.childIds ?? [];
  const ordered = [...childIds].sort((a, b) => scoreOf(doc.nodes[b]) - scoreOf(doc.nodes[a]));
  for (const childId of ordered) render(doc, childId, depth + 1, lines);
}

/**
 * Answer-first synthesis: leads with where to start (the highest-priority
 * branch), then lays out the branches in priority order with their evidence
 * and any MECE gaps/overlaps flagged. Pure — unit-testable.
 */
export function synthesise(doc: IssueTreeDoc): string {
  const root = doc.nodes[doc.rootId];
  const branches = childrenOf(doc, doc.rootId).sort((a, b) => scoreOf(b) - scoreOf(a));
  const top = branches[0];
  const lead =
    top?.priority !== undefined
      ? `Start with **${top.label}** — highest impact × ease.`
      : 'Tip: set impact × ease on the branches to rank where to start.';

  const lines: string[] = [`# ${root?.label ?? doc.title}`, '', lead, ''];
  if (branches.length === 0) {
    lines.push('_(No branches yet — decompose the question to begin.)_');
  }
  for (const branch of branches) render(doc, branch.id, 0, lines);
  return `${lines.join('\n')}\n`;
}
