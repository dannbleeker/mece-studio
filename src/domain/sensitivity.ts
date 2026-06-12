import { combineValues } from './rollup';
import { childrenOf, splitOf } from './tree';
import type { IssueTreeDoc, NodeId } from './types';

/**
 * Evaluate a node's value, rolling formula splits up recursively. Leaves and
 * non-formula nodes use their stored value; `overrides` substitute a value for
 * specific leaves (used to perturb one driver at a time). Pure.
 */
function evaluate(
  doc: IssueTreeDoc,
  nodeId: NodeId,
  overrides: Map<NodeId, number>
): number | undefined {
  const override = overrides.get(nodeId);
  if (override !== undefined) return override;

  const split = splitOf(doc, nodeId);
  if (split?.decomposition === 'formula') {
    const parts = childrenOf(doc, nodeId).map((c) => evaluate(doc, c.id, overrides));
    if (parts.length === 0 || parts.some((p) => p === undefined)) {
      return doc.nodes[nodeId]?.value?.amount;
    }
    return combineValues(parts as number[], split.operator);
  }
  return doc.nodes[nodeId]?.value?.amount;
}

/** Leaf drivers under a formula tree: nodes with no formula split that carry a value. */
function leafDrivers(doc: IssueTreeDoc, rootId: NodeId): NodeId[] {
  const out: NodeId[] = [];
  const walk = (id: NodeId): void => {
    const split = splitOf(doc, id);
    if (split?.decomposition === 'formula') {
      for (const child of childrenOf(doc, id)) walk(child.id);
    } else if (doc.nodes[id]?.value !== undefined) {
      out.push(id);
    }
  };
  walk(rootId);
  return out;
}

export interface DriverSensitivity {
  id: NodeId;
  label: string;
  value: number;
  /** Root value when this driver is moved down by `pct`. */
  low: number;
  /** Root value when this driver is moved up by `pct`. */
  high: number;
  /** |high − low| — how much the root value swings. */
  swing: number;
}

/**
 * How much `rootId`'s rolled-up value swings when each leaf driver moves ±`pct`
 * (default 10%), one driver at a time. Sorted most-impactful first. Empty unless
 * `rootId` is a formula tree with at least one valued driver. Pure.
 */
export function sensitivity(doc: IssueTreeDoc, rootId: NodeId, pct = 0.1): DriverSensitivity[] {
  const base = evaluate(doc, rootId, new Map());
  if (base === undefined) return [];

  const results: DriverSensitivity[] = [];
  for (const id of leafDrivers(doc, rootId)) {
    const value = doc.nodes[id]?.value?.amount;
    if (value === undefined) continue;
    const high = evaluate(doc, rootId, new Map([[id, value * (1 + pct)]]));
    const low = evaluate(doc, rootId, new Map([[id, value * (1 - pct)]]));
    if (high === undefined || low === undefined) continue;
    results.push({
      id,
      label: doc.nodes[id]?.label ?? '',
      value,
      low,
      high,
      swing: Math.abs(high - low),
    });
  }
  return results.sort((a, b) => b.swing - a.swing);
}
