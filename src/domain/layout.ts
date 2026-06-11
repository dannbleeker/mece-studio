import dagre from 'dagre';
import { NODE_GAP, NODE_HEIGHT, NODE_WIDTH, RANK_GAP } from './constants';
import type { IssueTreeDoc, LayoutDirection, NodeId } from './types';

export interface XYPosition {
  x: number;
  y: number;
}

/**
 * Run dagre over the tree (parent→child edges derived from splits) and return a
 * top-left position per node. Deterministic and framework-free, so it's unit-
 * testable without a DOM.
 */
export function layoutTree(
  doc: IssueTreeDoc,
  direction: LayoutDirection = doc.layout.direction
): Record<NodeId, XYPosition> {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: direction, ranksep: RANK_GAP, nodesep: NODE_GAP });
  g.setDefaultEdgeLabel(() => ({}));

  for (const id of Object.keys(doc.nodes)) {
    g.setNode(id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const split of Object.values(doc.splits)) {
    for (const childId of split.childIds) {
      if (doc.nodes[childId]) g.setEdge(split.parentId, childId);
    }
  }

  dagre.layout(g);

  const positions: Record<NodeId, XYPosition> = {};
  for (const id of Object.keys(doc.nodes)) {
    const node = g.node(id);
    // dagre reports node centres; React Flow positions by top-left.
    positions[id as NodeId] = { x: node.x - NODE_WIDTH / 2, y: node.y - NODE_HEIGHT / 2 };
  }
  return positions;
}
