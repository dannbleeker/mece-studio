import dagre from 'dagre';
import { NODE_GAP, NODE_HEIGHT, NODE_WIDTH, RANK_GAP } from './constants';
import type { IssueTreeDoc, LayoutDirection, NodeId } from './types';

export interface XYPosition {
  x: number;
  y: number;
}

const NO_HIDDEN: ReadonlySet<NodeId> = new Set();

/**
 * Run dagre over the tree (parent→child edges derived from splits) and return a
 * top-left position per node. `hidden` nodes (descendants of a collapsed node)
 * are left out of the layout. Deterministic and framework-free, so it's unit-
 * testable without a DOM.
 */
export function layoutTree(
  doc: IssueTreeDoc,
  direction: LayoutDirection = doc.layout.direction,
  hidden: ReadonlySet<NodeId> = NO_HIDDEN
): Record<NodeId, XYPosition> {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: direction, ranksep: RANK_GAP, nodesep: NODE_GAP });
  g.setDefaultEdgeLabel(() => ({}));

  for (const id of Object.keys(doc.nodes)) {
    if (hidden.has(id as NodeId)) continue;
    g.setNode(id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const split of Object.values(doc.splits)) {
    if (hidden.has(split.parentId)) continue;
    for (const childId of split.childIds) {
      if (doc.nodes[childId] && !hidden.has(childId)) g.setEdge(split.parentId, childId);
    }
  }

  dagre.layout(g);

  const positions: Record<NodeId, XYPosition> = {};
  for (const id of Object.keys(doc.nodes)) {
    if (hidden.has(id as NodeId)) continue;
    const node = g.node(id);
    // dagre reports node centres; React Flow positions by top-left.
    positions[id as NodeId] = { x: node.x - NODE_WIDTH / 2, y: node.y - NODE_HEIGHT / 2 };
  }
  return positions;
}
