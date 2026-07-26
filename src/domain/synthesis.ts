import type { EditorMessages } from '@/i18n/types';
import { priorityBand, priorityScore } from './priority';
import { rollUpValue } from './rollup';
import { sensitivity } from './sensitivity';
import { childrenOf, splitOf } from './tree';
import type { IssueNode, IssueTreeDoc, NodeId, Split } from './types';

/** How the tested top branches add up — the catalogue supplies the wording. */
type Stance = keyof EditorMessages['exports']['verdictStance'];

function scoreOf(node: IssueNode | undefined): number {
  return node?.priority ? priorityScore(node.priority) : 0;
}

function stanceOf(supported: number, refuted: number, total: number): Stance {
  if (refuted === 0 && supported === total) return 'holds';
  if (supported > refuted) return 'partial';
  if (refuted > 0) return 'doubt';
  return 'open';
}

/**
 * A rolled-up verdict on the governing answer, from the top branches' hypothesis
 * status — "3 of 5 top branches supported, 1 refuted — the answer partially
 * holds." Null until at least one top branch has been tested (so we never imply
 * a verdict from an untouched tree). Pure.
 */
export function verdict(doc: IssueTreeDoc, m: EditorMessages): string | null {
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
  const parts = [m.exports.verdictBranches({ supported, total: n })];
  if (refuted > 0) parts.push(m.exports.verdictRefuted({ count: refuted }));
  if (parked > 0) parts.push(m.exports.verdictParked({ count: parked }));
  const stance = m.exports.verdictStance[stanceOf(supported, refuted, n)];
  return m.exports.verdictLine({ parts, stance });
}

function meceFlags(split: Split | undefined, m: EditorMessages): string {
  if (!split) return '';
  const overlap = split.mece.exclusive.state === 'warn';
  const gap = split.mece.exhaustive.state === 'warn';
  return overlap || gap ? m.exports.synthMeceFlags({ overlap, gap }) : '';
}

function dimensionNote(split: Split | undefined, m: EditorMessages): string {
  return split?.dimension ? m.exports.synthDimension({ dimension: split.dimension }) : '';
}

/** Value / roll-up / sensitivity lines for a node (the numbers behind the answer). */
function valueMeta(doc: IssueTreeDoc, id: NodeId, indent: string, m: EditorMessages): string[] {
  const out: string[] = [];
  const node = doc.nodes[id];
  if (node?.value) out.push(`${indent}${m.exports.synthValue(node.value)}`);
  if (splitOf(doc, id)?.decomposition === 'formula') {
    const rolled = rollUpValue(doc, id);
    if (rolled !== undefined) out.push(`${indent}${m.exports.synthRollUp({ value: rolled })}`);
    const drivers = sensitivity(doc, id);
    const top = drivers[0];
    if (drivers.length >= 2 && top) {
      const label = top.label || m.content.untitled;
      out.push(`${indent}${m.exports.synthSensitivity({ label })}`);
    }
  }
  return out;
}

function render(
  doc: IssueTreeDoc,
  id: NodeId,
  depth: number,
  lines: string[],
  m: EditorMessages
): void {
  const node = doc.nodes[id];
  if (!node) return;
  const split = splitOf(doc, id);
  const indent = '  '.repeat(depth);
  const band = node.priority ? ` _(${m.enums.level[priorityBand(node.priority)]})_` : '';
  const mark =
    node.status === 'supported'
      ? '✓ '
      : node.status === 'refuted'
        ? '✗ '
        : node.status === 'parked'
          ? '⊘ '
          : '';
  lines.push(
    `${indent}- ${mark}${node.label}${band}${dimensionNote(split, m)}${meceFlags(split, m)}`
  );
  // The split's "so-what" — the action title its children add up to (Minto).
  if (split?.summary) lines.push(`${indent}  » ${split.summary}`);
  lines.push(...valueMeta(doc, id, `${indent}  `, m));
  if (node.evidence.length > 0) {
    const items = node.evidence.map((e) => `${e.supports ? '✓' : '✗'} ${e.summary}`);
    lines.push(`${indent}  ${m.exports.synthEvidence({ items })}`);
  }
  const childIds = split?.childIds ?? [];
  const ordered = [...childIds].sort((a, b) => scoreOf(doc.nodes[b]) - scoreOf(doc.nodes[a]));
  for (const childId of ordered) render(doc, childId, depth + 1, lines, m);
}

/**
 * Answer-first synthesis: leads with where to start (the highest-priority
 * branch), then lays out the branches in priority order with their evidence
 * and any MECE gaps/overlaps flagged. Pure — unit-testable.
 *
 * The storyline markers it writes (`**Situation:**`, `**Answer:**`, `Verdict:`,
 * the `value:` / `evidence:` detail prefixes) all come from `m.exports`, because
 * `synthesisFormat.formatSynthesis()` parses this document back out of the same
 * catalogue. Localise one and the other follows; there is no second copy.
 */
export function synthesise(doc: IssueTreeDoc, m: EditorMessages): string {
  const root = doc.nodes[doc.rootId];
  const branches = childrenOf(doc, doc.rootId).sort((a, b) => scoreOf(b) - scoreOf(a));
  const top = branches[0];
  const lead =
    top?.priority !== undefined
      ? m.exports.synthLead({ label: top.label })
      : m.exports.synthLeadTip;

  const lines: string[] = [`# ${root?.label ?? doc.title}`, ''];
  // Situation → Complication → Answer: the SCR/SCQA storyline the brief seeds.
  const brief = doc.problemBrief;
  if (brief?.situation) lines.push(`${m.exports.markers.situation} ${brief.situation}`, '');
  if (brief?.complication)
    lines.push(`${m.exports.markers.complication} ${brief.complication}`, '');
  if (doc.answer) lines.push(`${m.exports.markers.answer} ${doc.answer}`, '');
  const v = verdict(doc, m);
  if (v) lines.push(`_${v}_`, '');
  lines.push(lead, '');
  // The root split's "so-what" is the governing thought the top branches support.
  const rootSplit = splitOf(doc, doc.rootId);
  if (rootSplit?.summary) lines.push(`» ${rootSplit.summary}`, '');
  // The root often IS the value-driver formula parent — surface its numbers up top.
  const rootMeta = valueMeta(doc, doc.rootId, '', m);
  if (rootMeta.length > 0) lines.push(...rootMeta, '');
  if (branches.length === 0) lines.push(m.exports.synthNoBranches);
  for (const branch of branches) render(doc, branch.id, 0, lines, m);
  return `${lines.join('\n')}\n`;
}
