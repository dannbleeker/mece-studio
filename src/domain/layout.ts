import dagre from 'dagre';
import { NODE_GAP, NODE_HEIGHT, NODE_WIDTH, RANK_GAP } from './constants';
import { splitOf } from './tree';
import type { IssueNode, IssueTreeDoc, LayoutDirection, NodeId, Split } from './types';

export interface XYPosition {
  x: number;
  y: number;
}

const NO_HIDDEN: ReadonlySet<NodeId> = new Set();

/**
 * Estimate a node's rendered height from which rows it shows, so dagre spaces
 * ranks by the real size instead of a fixed 64px — otherwise a content-rich
 * value-driver node (value + evidence + ME/CE dots) renders taller than the gap
 * and overlaps its siblings. A plain node stays at NODE_HEIGHT (so simple trees
 * lay out exactly as before). Deterministic — no DOM measurement.
 */
function nodeHeight(node: IssueNode, split: Split | undefined): number {
  let h = NODE_HEIGHT;
  if (node.value) h += 14;
  if (node.evidence.length > 0 || node.detail?.trim()) h += 13;
  if (split) {
    if (split.dimension) h += 12;
    h += 16; // the ME / CE row
  }
  return h;
}

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
    const node = doc.nodes[id as NodeId];
    if (!node) continue;
    g.setNode(id, { width: NODE_WIDTH, height: nodeHeight(node, splitOf(doc, id as NodeId)) });
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
    // dagre reports node centres; React Flow positions by top-left. Use the
    // per-node height we fed in (dagre preserves it) so tall nodes stay aligned.
    positions[id as NodeId] = { x: node.x - NODE_WIDTH / 2, y: node.y - node.height / 2 };
  }
  return positions;
}
