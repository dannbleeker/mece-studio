// Where to look next: the open hypotheses worth testing first.
//
// The 80/20 rule of hypothesis-driven work: chase what would move the answer
// most and what we know least about. That is impact (from the node's priority)
// times uncertainty (from its evidence). A ranking, not a verdict: it never
// changes a status, and a branch under a refuted or parked ancestor is left
// out, because the user has already set that whole branch aside.
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
 * Every open non-root node not under a refuted or parked ancestor, highest
 * score first; ties keep tree order. Leaves and branches both count: an open
 * branch is a hypothesis too, and often the cheapest one to test.
 */
export function whereToLook(doc: IssueTreeDoc): LookRow[] {
  const rows: LookRow[] = [];
  const visit = (id: NodeId) => {
    const node = doc.nodes[id];
    if (!node) return;
    if (id !== doc.rootId) {
      if (node.status === 'refuted' || node.status === 'parked') return;
      if (node.status === 'open') {
        const impact = node.priority?.impact;
        const uncertainty = uncertaintyOf(node.evidence);
        rows.push({
          nodeId: id,
          impact,
          uncertainty,
          score: IMPACT_WEIGHT[impact ?? 'medium'] * UNCERTAINTY_WEIGHT[uncertainty],
          hasKillTest: typeof node.killTest === 'string' && node.killTest.trim() !== '',
        });
      }
    }
    for (const child of childrenOf(doc, id)) visit(child.id);
  };
  visit(doc.rootId);
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => b.row.score - a.row.score || a.index - b.index)
    .map(({ row }) => row);
}
