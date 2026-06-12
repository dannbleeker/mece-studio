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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { childrenOf, descendantIds, parentOf } from '@/domain/tree';
import type { NodeId } from '@/domain/types';
import { downloadDataUrl } from '@/services/download';
import { useStore } from '@/store';
import { type NodeEditing, NodeEditingContext } from './nodeEditing';
import { IssueNode } from './nodes/IssueNode';
import { toFlow } from './projection';

const nodeTypes: NodeTypes = { issue: IssueNode };
const FIT_VIEW_OPTIONS = { padding: 0.3, maxZoom: 1.2 };
// Ring applied to the node a drag would re-parent onto (valid targets only).
const DROP_TARGET_CLASS = 'rounded-lg ring-2 ring-[#3f7d54] ring-offset-2 ring-offset-[#faf9f5]';

function Flow() {
  const doc = useStore((s) => s.doc);
  const selectedId = useStore((s) => s.selectedId);
  const select = useStore((s) => s.select);
  const moveNode = useStore((s) => s.moveNode);
  const renameNode = useStore((s) => s.renameNode);
  const addChild = useStore((s) => s.addChild);
  const { fitView, getNodes, getIntersectingNodes } = useReactFlow();

  // Inline label editing: double-click a node to edit its label in place.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const editing = useMemo<NodeEditing>(
    () => ({
      editingId,
      start: setEditingId,
      commit: (id, label) => {
        renameNode(id as NodeId, label);
        setEditingId(null);
      },
      cancel: () => setEditingId(null),
    }),
    [editingId, renameNode]
  );

  // Keyboard on the selected node: Enter / F2 edits its label; Tab adds a child
  // and edits it straight away (fast tree-building). Double-click also edits
  // (handled in the node). Ignored while already typing in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return;
      if (editingId || !selectedId) return;
      if (e.key === 'Enter' || e.key === 'F2') {
        e.preventDefault();
        setEditingId(selectedId);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        addChild(selectedId);
        const kids = childrenOf(useStore.getState().doc, selectedId);
        const newId = kids[kids.length - 1]?.id;
        if (newId) {
          select(newId);
          setEditingId(newId);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, editingId, addChild, select]);

  const { nodes: layoutNodes, edges } = useMemo(
    () => toFlow(doc, selectedId, query),
    [doc, selectedId, query]
  );
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

  // The node a drag would re-parent onto: the first intersecting node that's a
  // valid target — not the dragged node, its own subtree (a cycle), or the
  // parent it already has (a no-op). Mirrors moveNode's guards so the highlight
  // and the drop agree.
  const dropTargetRef = useRef<string | null>(null);
  const findDropTarget = useCallback(
    (dragged: Node): Node | undefined => {
      const d = useStore.getState().doc;
      const draggedId = dragged.id as NodeId;
      const blocked = new Set<string>([draggedId, ...descendantIds(d, draggedId)]);
      const currentParent = parentOf(d, draggedId);
      return getIntersectingNodes(dragged).find(
        (n) => !blocked.has(n.id) && n.id !== currentParent
      );
    },
    [getIntersectingNodes]
  );

  // While dragging, ring the node we'd drop onto so the re-parent is legible.
  const onNodeDrag = useCallback(
    (_evt: unknown, dragged: Node) => {
      const targetId = findDropTarget(dragged)?.id ?? null;
      if (dropTargetRef.current === targetId) return;
      dropTargetRef.current = targetId;
      setNodes((ns) =>
        ns.map((n) => {
          const cls = n.id === targetId ? DROP_TARGET_CLASS : '';
          return n.className === cls ? n : { ...n, className: cls };
        })
      );
    },
    [findDropTarget, setNodes]
  );

  // On release, reconcile to the auto-layout: a valid drop re-parents and
  // re-lays-out; anything else snaps back. Re-deriving from the doc also clears
  // the drop-target ring.
  const onNodeDragStop = useCallback(
    (_evt: unknown, dragged: Node) => {
      const target = findDropTarget(dragged);
      dropTargetRef.current = null;
      if (target) moveNode(dragged.id as NodeId, target.id as NodeId);
      setNodes(toFlow(useStore.getState().doc, selectedId).nodes);
    },
    [findDropTarget, moveNode, selectedId, setNodes]
  );

  // Zoom to the nodes whose label matches the search query.
  const fitToMatches = useCallback(() => {
    const matched = nodes.filter((n) => n.data.matched);
    if (matched.length > 0) {
      void fitView({
        nodes: matched.map((n) => ({ id: n.id })),
        duration: 400,
        padding: 0.4,
        maxZoom: 1.2,
      });
    }
  }, [nodes, fitView]);

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
    <NodeEditingContext.Provider value={editing}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onNodeClick={(_, node) => select(node.id as NodeId)}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onPaneClick={() => select(null)}
        nodesConnectable={false}
        deleteKeyCode={null}
        fitView
        fitViewOptions={FIT_VIEW_OPTIONS}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2dfd6" />
        <Controls showInteractive={false} />
        <Panel position="top-left">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') fitToMatches();
              e.stopPropagation();
            }}
            placeholder="Find…"
            aria-label="Find nodes"
            className="nodrag w-44 rounded-md border border-neutral-200 bg-white/90 px-2.5 py-1 text-[12px] text-neutral-700 shadow-sm focus:border-[#3f6fb0] focus:outline-none"
          />
        </Panel>
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
    </NodeEditingContext.Provider>
  );
}

export function Canvas() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}
