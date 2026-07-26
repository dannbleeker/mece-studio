import type { EditorMessages } from '@/i18n/types';
import { priorityBand } from './priority';
import { childrenOf, splitOf } from './tree';
import type { EvidenceItem, IssueNode, IssueTreeDoc, NodeId, NodeStatus } from './types';

/** The mark in front of a judged node — the glyph; the word comes from the catalogue. */
const STATUS_GLYPH: Partial<Record<NodeStatus, string>> = {
  supported: '✓',
  refuted: '✗',
  parked: '⊘',
};

function meceNote(doc: IssueTreeDoc, id: NodeId, m: EditorMessages): string {
  const split = splitOf(doc, id);
  if (!split) return '';
  return m.exports.meceNote({
    type: split.decomposition,
    dimension: split.dimension,
    exclusive: split.mece.exclusive.state,
    exhaustive: split.mece.exhaustive.state,
  });
}

/** Status + priority annotations, e.g. " — ✓ supported, High priority". */
export function metaTag(node: IssueNode, m: EditorMessages): string {
  const parts: string[] = [];
  const glyph = STATUS_GLYPH[node.status];
  if (glyph) parts.push(`${glyph} ${m.enums.status[node.status]}`);
  if (node.priority) {
    parts.push(m.exports.priorityTag({ level: m.enums.level[priorityBand(node.priority)] }));
  }
  return parts.length > 0 ? ` — ${parts.join(', ')}` : '';
}

function detailNote(detail: string | undefined, indent: string): string {
  if (!detail || detail.trim() === '') return '';
  const oneLine = detail.trim().replace(/\s*\n\s*/g, ' ');
  return `\n${indent}  _${oneLine}_`;
}

/** Evidence as sub-bullets under a node, e.g. "  - ✓ (strong) summary". */
export function evidenceLines(
  evidence: EvidenceItem[],
  indent: string,
  m: EditorMessages
): string[] {
  return evidence.map((e) => {
    const strength = m.enums.evidenceStrength[e.strength];
    return `${indent}  - ${e.supports ? '✓' : '✗'} (${strength}) ${e.summary}`;
  });
}

function nodeBlock(
  doc: IssueTreeDoc,
  id: NodeId,
  depth: number,
  lines: string[],
  m: EditorMessages
): void {
  const node = doc.nodes[id];
  if (!node) return;
  const indent = '  '.repeat(depth);
  const value = node.value ? m.exports.valueSuffix(node.value) : '';
  lines.push(
    `${indent}- ${node.label}${value}${metaTag(node, m)}${meceNote(doc, id, m)}${detailNote(node.detail, indent)}`
  );
  if (node.evidence.length > 0) lines.push(...evidenceLines(node.evidence, indent, m));
  for (const child of childrenOf(doc, id)) nodeBlock(doc, child.id, depth + 1, lines, m);
}

/**
 * Render the tree as an indented Markdown outline — the root question as an H1,
 * its decomposition as nested bullets. Each node carries its value, hypothesis
 * status, priority, MECE state, notes, and evidence, so a copied outline holds
 * the whole analysis. Pure — the caller hands in the catalogue, so the domain
 * stays framework- and language-free.
 */
export function toMarkdown(doc: IssueTreeDoc, m: EditorMessages): string {
  const root = doc.nodes[doc.rootId];
  const lines: string[] = [
    `# ${root?.label ?? doc.title}${root ? metaTag(root, m) : ''}${meceNote(doc, doc.rootId, m)}${detailNote(root?.detail, '')}`,
    '',
  ];
  if (root && root.evidence.length > 0) lines.push(...evidenceLines(root.evidence, '', m), '');
  for (const child of childrenOf(doc, doc.rootId)) nodeBlock(doc, child.id, 0, lines, m);
  return `${lines.join('\n')}\n`;
}
