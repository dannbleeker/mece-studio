import {
  Background,
  BackgroundVariant,
  Controls,
  getNodesBounds,
  getViewportForBounds,
  type NodeTypes,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useEffect, useMemo } from 'react';
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
  const { fitView, getNodes } = useReactFlow();

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
