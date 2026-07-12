import { priorityBand, priorityScore } from './priority';
import { rollUpValue } from './rollup';
import { sensitivity } from './sensitivity';
import { childrenOf, splitOf } from './tree';
import type { IssueNode, IssueTreeDoc, NodeId, Split } from './types';

function scoreOf(node: IssueNode | undefined): number {
  return node?.priority ? priorityScore(node.priority) : 0;
}

/**
 * A rolled-up verdict on the governing answer, from the top branches' hypothesis
 * status — "3 of 5 top branches supported, 1 refuted — the answer partially
 * holds." Null until at least one top branch has been tested (so we never imply
 * a verdict from an untouched tree). Pure.
 */
export function verdict(doc: IssueTreeDoc): string | null {
  const branches = childrenOf(doc, doc.rootId);
  const n = branches.length;
  if (n === 0) return null;
  let supported = 0;
  let refuted = 0;
  let parked = 0;
  for (const b of branches) {
    if (b.status === 'supported') supported++;
    else if (b.status === 'refuted') refuted++;
    else if (b.status === 'parked') parked++;
  }
  if (supported + refuted + parked === 0) return null; // nothing tested yet
  const parts = [`${supported} of ${n} top branches supported`];
  if (refuted > 0) parts.push(`${refuted} refuted`);
  if (parked > 0) parts.push(`${parked} parked`);
  const stance =
    refuted === 0 && supported === n
      ? 'the answer holds'
      : supported > refuted
        ? 'the answer partially holds'
        : refuted > 0
          ? 'the answer is in doubt'
          : 'still open';
  return `Verdict: ${parts.join(', ')} — ${stance}.`;
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

/** Value / roll-up / sensitivity lines for a node (the numbers behind the answer). */
function valueMeta(doc: IssueTreeDoc, id: NodeId, indent: string): string[] {
  const out: string[] = [];
  const node = doc.nodes[id];
  if (node?.value) {
    const unit = node.value.unit ? ` ${node.value.unit}` : '';
    out.push(`${indent}value: ${node.value.amount}${unit}`);
  }
  if (splitOf(doc, id)?.decomposition === 'formula') {
    const rolled = rollUpValue(doc, id);
    if (rolled !== undefined) out.push(`${indent}rolls up to ${rolled}`);
    const drivers = sensitivity(doc, id);
    const top = drivers[0];
    if (drivers.length >= 2 && top) {
      out.push(`${indent}most sensitive to: ${top.label || 'Untitled'}`);
    }
  }
  return out;
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
  // The split's "so-what" — the action title its children add up to (Minto).
  if (split?.summary) lines.push(`${indent}  » ${split.summary}`);
  lines.push(...valueMeta(doc, id, `${indent}  `));
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

  const lines: string[] = [`# ${root?.label ?? doc.title}`, ''];
  // Situation → Complication → Answer: the SCR/SCQA storyline the brief seeds.
  const brief = doc.problemBrief;
  if (brief?.situation) lines.push(`**Situation:** ${brief.situation}`, '');
  if (brief?.complication) lines.push(`**Complication:** ${brief.complication}`, '');
  if (doc.answer) lines.push(`**Answer:** ${doc.answer}`, '');
  const v = verdict(doc);
  if (v) lines.push(`_${v}_`, '');
  lines.push(lead, '');
  // The root split's "so-what" is the governing thought the top branches support.
  const rootSplit = splitOf(doc, doc.rootId);
  if (rootSplit?.summary) lines.push(`» ${rootSplit.summary}`, '');
  // The root often IS the value-driver formula parent — surface its numbers up top.
  const rootMeta = valueMeta(doc, doc.rootId, '');
  if (rootMeta.length > 0) lines.push(...rootMeta, '');
  if (branches.length === 0) {
    lines.push('_(No branches yet — decompose the question to begin.)_');
  }
  for (const branch of branches) render(doc, branch.id, 0, lines);
  return `${lines.join('\n')}\n`;
}
