// Where to look next: the open hypotheses worth testing first.
//
// The 80/20 rule of hypothesis-driven work: chase what would move the answer
// most and what we know least about. That is impact (from the node's priority)
// times uncertainty (from its evidence). A ranking, not a verdict: it never
// changes a status. A branch under a refuted or parked ancestor is left out,
// because the user has already set it aside, and a parent waits until its
// children are settled.
import { childrenOf } from './tree';
import type { EvidenceItem, IssueTreeDoc, Level, NodeId } from './types';

/** How unsettled a hypothesis is, from what hangs on it. */
export type Uncertainty = 'unknown' | 'contested' | 'thin' | 'leaning';

const UNCERTAINTY_WEIGHT: Record<Uncertainty, number> = {
  unknown: 3,
  contested: 3,
  thin: 2,
  leaning: 1,
};
const IMPACT_WEIGHT: Record<Level, number> = { low: 1, medium: 2, high: 3 };

/**
 * - `unknown`: no evidence yet.
 * - `contested`: evidence both ways.
 * - `thin`: one way, anecdote only.
 * - `leaning`: one way, at least one indicative or strong item.
 */
export function uncertaintyOf(evidence: readonly EvidenceItem[] | undefined): Uncertainty {
  const items = evidence ?? [];
  if (items.length === 0) return 'unknown';
  const pro = items.some((e) => e.supports);
  const con = items.some((e) => !e.supports);
  if (pro && con) return 'contested';
  return items.some((e) => e.strength !== 'anecdote') ? 'leaning' : 'thin';
}

export interface LookRow {
  nodeId: NodeId;
  /** The node's impact, or undefined when it hasn't been prioritised. */
  impact: Level | undefined;
  uncertainty: Uncertainty;
  /** Impact × uncertainty, 1–9; an unprioritised node counts as medium impact. */
  score: number;
  hasKillTest: boolean;
}

/**
 * The open hypotheses to test, highest score first; ties keep tree order. A
 * branch is listed only when nothing under it is still open: its children are
 * the sharper tests, and a parent with no evidence of its own would otherwise
 * crowd the top of the list. Nothing under a refuted or parked node is listed.
 */
export function whereToLook(doc: IssueTreeDoc): LookRow[] {
  const rows: LookRow[] = [];
  /** Visit a subtree; true when it listed at least one row. */
  const visit = (id: NodeId): boolean => {
    const node = doc.nodes[id];
    if (!node) return false;
    const isRoot = id === doc.rootId;
    if (!isRoot && (node.status === 'refuted' || node.status === 'parked')) return false;
    let listedBelow = false;
    for (const child of childrenOf(doc, id)) listedBelow = visit(child.id) || listedBelow;
    if (isRoot || listedBelow || node.status !== 'open') return listedBelow;
    const impact = node.priority?.impact;
    const uncertainty = uncertaintyOf(node.evidence);
    rows.push({
      nodeId: id,
      impact,
      uncertainty,
      score: IMPACT_WEIGHT[impact ?? 'medium'] * UNCERTAINTY_WEIGHT[uncertainty],
      hasKillTest: typeof node.killTest === 'string' && node.killTest.trim() !== '',
    });
    return true;
  };
  visit(doc.rootId);
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => b.row.score - a.row.score || a.index - b.index)
    .map(({ row }) => row);
}
