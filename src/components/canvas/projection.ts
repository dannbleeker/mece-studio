import type { Edge, Node } from '@xyflow/react';
import { NODE_WIDTH } from '@/domain/constants';
import { layoutTree, nodeHeight } from '@/domain/layout';
import { linksOf } from '@/domain/links';
import { orderSiblings, type PriorityBand, priorityBand } from '@/domain/priority';
import { matchesQuery } from '@/domain/search';
import { hiddenNodeIds, nodeDepths, splitOf } from '@/domain/tree';
import {
  DEFAULT_LOCALE,
  type IssueNode,
  type IssueTreeDoc,
  type LocaleCode,
  type MeceStatus,
  type NodeId,
} from '@/domain/types';
import { catalogueFor } from '@/i18n/registry';

/** Data carried by each React Flow node. Must extend Record for React Flow v12. */
interface IssueNodeData extends Record<string, unknown> {
  label: string;
  status: IssueNode['status'];
  /** MECE status of THIS node's decomposition, or null if it's a leaf. */
  mece: MeceStatus | null;
  /** The axis this node's split is cut on (e.g. "geography"), or null. */
  dimension: string | null;
  hasChildren: boolean;
  value: IssueNode['value'];
  priority: PriorityBand | null;
  evidence: { supports: number; contradicts: number } | null;
  hasNote: boolean;
  /** This node is collapsed — its subtree is hidden. */
  collapsed: boolean;
  /** Direct children, for the collapsed badge. */
  childCount: number;
  /** Label matches the active search query. */
  matched: boolean;
  selected: boolean;
  /** 0-based tree depth (root = 0); aria-level is `depth + 1`. */
  depth: number;
}

export type IssueFlowNode = Node<IssueNodeData, 'issue'>;

/** Tally supporting vs contradicting evidence in one pass. */
function evidenceCounts(evidence: IssueNode['evidence']): {
  supports: number;
  contradicts: number;
} {
  let supports = 0;
  let contradicts = 0;
  for (const e of evidence) {
    if (e.supports) supports++;
    else contradicts++;
  }
  return { supports, contradicts };
}

/**
 * Project the document into React Flow nodes + edges. Pure: positions come from
 * the deterministic dagre layout, edges are derived from splits. No React Flow
 * runtime is touched, so this is unit-testable in node.
 */
export function toFlow(
  doc: IssueTreeDoc,
  selectedIds: readonly NodeId[] = [],
  query = '',
  sortByPriority = false,
  // Search matching is collated, not code-point compared, so it needs to know
  // the alphabet it is matching in (see `domain/collation.ts`).
  locale: LocaleCode = DEFAULT_LOCALE
): { nodes: IssueFlowNode[]; edges: Edge[] } {
  // The aria-label for an unnamed node is text a screen reader speaks, so it is
  // worded in the catalogue like any other. Read from `locale` rather than taken
  // as a parameter — the locale is already here, and a seventh positional string
  // is one more thing a call site can get wrong.
  const { untitled } = catalogueFor(locale).content;
  const selected = new Set(selectedIds);
  const hidden = hiddenNodeIds(doc);
  const depths = nodeDepths(doc);
  // Sibling order is a view concern — order for layout without mutating the doc.
  const layoutDoc = orderSiblings(doc, sortByPriority);
  const positions = layoutTree(layoutDoc, layoutDoc.layout.direction, hidden);

  const nodes: IssueFlowNode[] = Object.values(doc.nodes)
    .filter((n) => !hidden.has(n.id))
    .map((n) => {
      const split = splitOf(doc, n.id);
      const level = (depths[n.id] ?? 0) + 1;
      return {
        id: n.id,
        type: 'issue',
        position: positions[n.id] ?? { x: 0, y: 0 },
        // Pin the rendered box to the one layout used. Left to auto-size, a long
        // label stretches the node past NODE_WIDTH and it overlaps its children.
        width: NODE_WIDTH,
        height: nodeHeight(n, split),
        // ARIA tree semantics for assistive tech: React Flow spreads these onto
        // the `.react-flow__node` wrapper (role/aria-label/domAttributes). Only
        // nodes with children carry aria-expanded; leaves omit it entirely.
        ariaRole: 'treeitem',
        ariaLabel: n.label || untitled,
        domAttributes: {
          'aria-level': level,
          'aria-selected': selected.has(n.id),
          ...(split !== undefined ? { 'aria-expanded': n.collapsed !== true } : {}),
        },
        data: {
          label: n.label,
          status: n.status,
          mece: split ? split.mece : null,
          dimension: split?.dimension ?? null,
          hasChildren: split !== undefined,
          value: n.value,
          priority: n.priority ? priorityBand(n.priority) : null,
          evidence: n.evidence.length > 0 ? evidenceCounts(n.evidence) : null,
          hasNote: !!n.detail?.trim(),
          collapsed: n.collapsed === true,
          childCount: split ? split.childIds.length : 0,
          matched: matchesQuery(n.label, query, locale),
          selected: selected.has(n.id),
          depth: depths[n.id] ?? 0,
        },
      };
    });

  const edges: Edge[] = [];
  for (const split of Object.values(doc.splits)) {
    if (hidden.has(split.parentId)) continue;
    // A subtle always-on tint on edges out of a flagged split — so problem
    // decompositions are visible without opening the review dock (which adds the
    // stronger amber dash on top).
    const flagged = split.mece.exclusive.state === 'warn' || split.mece.exhaustive.state === 'warn';
    for (const childId of split.childIds) {
      if (doc.nodes[childId] && !hidden.has(childId)) {
        edges.push({
          id: `${split.parentId}->${childId}`,
          source: split.parentId,
          target: childId,
          type: 'smoothstep',
          ...(flagged ? { style: { stroke: '#e0b877' } } : {}),
        });
      }
    }
  }

  // Combined-cause links: a dotted overlay between two nodes, drawn after the
  // layout so they never move a box, and skipped when either end is folded away.
  for (const link of linksOf(doc)) {
    if (hidden.has(link.a) || hidden.has(link.b)) continue;
    edges.push({
      id: `${LINK_EDGE_PREFIX}${link.id}`,
      source: link.a,
      target: link.b,
      type: 'default',
      selectable: false,
      focusable: false,
      zIndex: 1,
      style: { stroke: '#8a6bb5', strokeWidth: 1.5, strokeDasharray: '2 4' },
      // A small marker, not the note: a sentence-long label would run across the
      // boxes. The note lives in the inspector and the outline.
      label: '+',
      labelStyle: { fontSize: 11, fontWeight: 600, fill: '#6a4f93' },
      labelBgPadding: [4, 1] as [number, number],
      labelBgBorderRadius: 8,
      labelBgStyle: { fill: '#f5f1fa' },
    });
  }

  return { nodes, edges };
}

/** Edge-id prefix that marks a combined-cause overlay rather than a tree edge. */
export const LINK_EDGE_PREFIX = 'link:';
