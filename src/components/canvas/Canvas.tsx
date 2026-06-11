import {
  Background,
  BackgroundVariant,
  Controls,
  type NodeTypes,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useEffect, useMemo } from 'react';
import type { NodeId } from '@/domain/types';
import { useStore } from '@/store';
import { IssueNode } from './nodes/IssueNode';
import { toFlow } from './projection';

const nodeTypes: NodeTypes = { issue: IssueNode };
const FIT_VIEW_OPTIONS = { padding: 0.3, maxZoom: 1.2 };

function Flow() {
  const doc = useStore((s) => s.doc);
  const selectedId = useStore((s) => s.selectedId);
  const select = useStore((s) => s.select);
  const { fitView } = useReactFlow();

  const { nodes, edges } = useMemo(() => toFlow(doc, selectedId), [doc, selectedId]);

  // Re-fit whenever the set of nodes changes, so a freshly-added sub-issue is
  // never laid out off-screen. rAF lets dagre's new positions apply first.
  const nodeCount = nodes.length;
  useEffect(() => {
    if (nodeCount === 0) return;
    const handle = requestAnimationFrame(() => {
      void fitView({ ...FIT_VIEW_OPTIONS, duration: 200 });
    });
    return () => cancelAnimationFrame(handle);
  }, [nodeCount, fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodeClick={(_, node) => select(node.id as NodeId)}
      onPaneClick={() => select(null)}
      nodesDraggable={false}
      nodesConnectable={false}
      fitView
      fitViewOptions={FIT_VIEW_OPTIONS}
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2dfd6" />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}

export function Canvas() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}
