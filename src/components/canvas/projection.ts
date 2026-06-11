import type { Edge, Node } from '@xyflow/react';
import { layoutTree } from '@/domain/layout';
import { type PriorityBand, priorityBand } from '@/domain/priority';
import { splitOf } from '@/domain/tree';
import type { IssueNode, IssueTreeDoc, MeceStatus } from '@/domain/types';

/** Data carried by each React Flow node. Must extend Record for React Flow v12. */
export interface IssueNodeData extends Record<string, unknown> {
  label: string;
  status: IssueNode['status'];
  /** MECE status of THIS node's decomposition, or null if it's a leaf. */
  mece: MeceStatus | null;
  hasChildren: boolean;
  value: IssueNode['value'];
  priority: PriorityBand | null;
  selected: boolean;
}

export type IssueFlowNode = Node<IssueNodeData, 'issue'>;

/**
 * Project the document into React Flow nodes + edges. Pure: positions come from
 * the deterministic dagre layout, edges are derived from splits. No React Flow
 * runtime is touched, so this is unit-testable in node.
 */
export function toFlow(
  doc: IssueTreeDoc,
  selectedId: string | null
): { nodes: IssueFlowNode[]; edges: Edge[] } {
  const positions = layoutTree(doc);

  const nodes: IssueFlowNode[] = Object.values(doc.nodes).map((n) => {
    const split = splitOf(doc, n.id);
    return {
      id: n.id,
      type: 'issue',
      position: positions[n.id] ?? { x: 0, y: 0 },
      data: {
        label: n.label,
        status: n.status,
        mece: split ? split.mece : null,
        hasChildren: split !== undefined,
        value: n.value,
        priority: n.priority ? priorityBand(n.priority) : null,
        selected: n.id === selectedId,
      },
    };
  });

  const edges: Edge[] = [];
  for (const split of Object.values(doc.splits)) {
    for (const childId of split.childIds) {
      if (doc.nodes[childId]) {
        edges.push({
          id: `${split.parentId}->${childId}`,
          source: split.parentId,
          target: childId,
          type: 'smoothstep',
        });
      }
    }
  }

  return { nodes, edges };
}
