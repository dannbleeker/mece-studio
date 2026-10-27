import type { EditorMessages } from '@/i18n/types';
import { explainsOf, factsOf } from './diagnosis';
import { linksOf } from './links';
import { priorityBand } from './priority';
import { evidenceDate, safeUrl, statusLogOf } from './provenance';
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
    return `${indent}  - ${e.supports ? '✓' : '✗'} (${strength}) ${e.summary}${provenanceSuffix(e, m)}`;
  });
}

/** " — Alex, 26 Oct 2026, probe <https://…>" for an evidence item, or "". */
function provenanceSuffix(e: EvidenceItem, m: EditorMessages): string {
  const parts: Parameters<EditorMessages['exports']['evidenceProvenance']>[0] = {};
  if (e.author?.trim()) parts.author = e.author.trim();
  const iso = evidenceDate(e);
  if (iso) parts.day = iso;
  if (e.source?.trim()) parts.source = e.source.trim();
  const url = safeUrl(e.url);
  if (url) parts.url = url;
  return m.exports.evidenceProvenance(parts);
}

/** Kill test, prediction and fact verdicts under a node — only the ones that are set. */
function diagnosisLines(
  doc: IssueTreeDoc,
  node: IssueNode,
  indent: string,
  m: EditorMessages
): string[] {
  const out: string[] = [];
  if (node.killTest) out.push(`${indent}  - ${m.exports.killTestLine({ text: node.killTest })}`);
  if (node.prediction) {
    out.push(`${indent}  - ${m.exports.predictionLine({ text: node.prediction })}`);
  }
  const facts = factsOf(doc);
  const verdicts = explainsOf(node);
  if (facts.some((f) => f.id in verdicts)) {
    const yes = facts.filter((f) => verdicts[f.id] === 'yes').length;
    const failed = facts.filter((f) => verdicts[f.id] === 'no').map((f) => f.is);
    out.push(`${indent}  - ${m.exports.explainsLine({ yes, total: facts.length, failed })}`);
  }
  return out;
}

/** The status-history line under a node, or nothing when its status never changed. */
function historyLines(node: IssueNode, indent: string, m: EditorMessages): string[] {
  const log = statusLogOf(node);
  return log.length > 0 ? [`${indent}  - ${m.exports.statusHistory({ entries: log })}`] : [];
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
  lines.push(...historyLines(node, indent, m));
  lines.push(...diagnosisLines(doc, node, indent, m));
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
  const facts = factsOf(doc);
  if (facts.length > 0) {
    lines.push(m.exports.factsHeading, '');
    for (const f of facts) {
      lines.push(
        m.exports.factLine(
          f.isNot
            ? { dimension: f.dimension, is: f.is, isNot: f.isNot }
            : { dimension: f.dimension, is: f.is }
        )
      );
    }
    lines.push('');
  }
  if (root && root.evidence.length > 0) lines.push(...evidenceLines(root.evidence, '', m), '');
  for (const child of childrenOf(doc, doc.rootId)) nodeBlock(doc, child.id, 0, lines, m);
  const links = linksOf(doc);
  if (links.length > 0) {
    lines.push('', m.exports.linksHeading, '');
    const name = (id: NodeId) => doc.nodes[id]?.label || m.content.untitled;
    for (const l of links) {
      lines.push(
        m.exports.linkLine(
          l.note ? { a: name(l.a), b: name(l.b), note: l.note } : { a: name(l.a), b: name(l.b) }
        )
      );
    }
  }
  return `${lines.join('\n')}\n`;
}
