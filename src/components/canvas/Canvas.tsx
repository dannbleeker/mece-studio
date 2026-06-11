import {
  Background,
  BackgroundVariant,
  Controls,
  getNodesBounds,
  getViewportForBounds,
  type Node,
  type NodeTypes,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useEffect, useMemo } from 'react';
import type { NodeId } from '@/domain/types';
import { downloadDataUrl } from '@/services/download';
import { useStore } from '@/store';
import { IssueNode } from './nodes/IssueNode';
import { toFlow } from './projection';

const nodeTypes: NodeTypes = { issue: IssueNode };
const FIT_VIEW_OPTIONS = { padding: 0.3, maxZoom: 1.2 };

function Flow() {
  const doc = useStore((s) => s.doc);
  const selectedId = useStore((s) => s.selectedId);
  const select = useStore((s) => s.select);
  const moveNode = useStore((s) => s.moveNode);
  const { fitView, getNodes, getIntersectingNodes } = useReactFlow();

  const { nodes: layoutNodes, edges } = useMemo(() => toFlow(doc, selectedId), [doc, selectedId]);
  const [nodes, setNodes, onNodesChange] = useNodesState(layoutNodes);

  // Auto-layout stays the source of truth: re-sync React Flow's nodes whenever the
  // projection changes (add / edit / undo / re-parent). A drag only moves a node
  // transiently until it resolves to a re-parent on drop.
  useEffect(() => {
    setNodes(layoutNodes);
  }, [layoutNodes, setNodes]);

  // Re-fit whenever the set of nodes changes, so a freshly-added sub-issue is
  // never laid out off-screen. rAF lets dagre's new positions apply first.
  const nodeCount = layoutNodes.length;
  useEffect(() => {
    if (nodeCount === 0) return;
    const handle = requestAnimationFrame(() => {
      void fitView({ ...FIT_VIEW_OPTIONS, duration: 200 });
    });
    return () => cancelAnimationFrame(handle);
  }, [nodeCount, fitView]);

  // Drag a node onto another to re-parent it (and its subtree) there. On release
  // we reconcile to the auto-layout: a valid drop re-parents and re-lays-out,
  // anything else snaps the node back to where dagre had it.
  const onNodeDragStop = useCallback(
    (_evt: unknown, dragged: Node) => {
      const target = getIntersectingNodes(dragged).find((n) => n.id !== dragged.id);
      if (target) moveNode(dragged.id as NodeId, target.id as NodeId);
      setNodes(toFlow(useStore.getState().doc, selectedId).nodes);
    },
    [getIntersectingNodes, moveNode, selectedId, setNodes]
  );

  // Render the whole graph to a PNG (React Flow's bounds recipe). html-to-image
  // is loaded on demand so it stays off the eager bundle.
  const exportPng = async () => {
    const bounds = getNodesBounds(getNodes());
    const width = Math.max(640, Math.min(2600, Math.round(bounds.width + 160)));
    const height = Math.max(480, Math.min(2600, Math.round(bounds.height + 160)));
    const { x, y, zoom } = getViewportForBounds(bounds, width, height, 0.5, 2, 0.12);
    const viewport = document.querySelector<HTMLElement>('.react-flow__viewport');
    if (!viewport) return;
    const { toPng } = await import('html-to-image');
    const dataUrl = await toPng(viewport, {
      backgroundColor: '#faf9f5',
      width,
      height,
      style: {
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${x}px, ${y}px) scale(${zoom})`,
      },
    });
    downloadDataUrl('mece-tree.png', dataUrl);
  };

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onNodeClick={(_, node) => select(node.id as NodeId)}
      onNodeDragStop={onNodeDragStop}
      onPaneClick={() => select(null)}
      nodesConnectable={false}
      fitView
      fitViewOptions={FIT_VIEW_OPTIONS}
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2dfd6" />
      <Controls showInteractive={false} />
      <Panel position="top-right">
        <button
          type="button"
          onClick={() => {
            void exportPng();
          }}
          className="rounded-md border border-neutral-200 bg-white/90 px-2.5 py-1 text-[12px] text-neutral-600 shadow-sm hover:bg-white"
        >
          Export PNG
        </button>
      </Panel>
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
