import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
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
import { NODE_HEIGHT, NODE_WIDTH } from '@/domain/constants';
import { flaggedSplits } from '@/domain/meceStatus';
import { childrenOf, descendantIds, parentOf } from '@/domain/tree';
import type { IssueTreeDoc, NodeId } from '@/domain/types';
import { copyImageToClipboard, downloadDataUrl, downloadText } from '@/services/download';
import {
  type ExportHeader,
  renderCanvasPng,
  renderCanvasSvg,
  saveTreePdf,
  saveTreePptx,
} from '@/services/exporters';
import { useStore } from '@/store';
import { CanvasCoach } from './CanvasCoach';
import { type NodeEditing, NodeEditingContext } from './nodeEditing';
import { IssueNode } from './nodes/IssueNode';
import { type IssueFlowNode, toFlow } from './projection';
import { SelectionBar } from './SelectionBar';
import { boundsWithinViewport, nodesBounds } from './viewport';

const nodeTypes: NodeTypes = { issue: IssueNode };

/** Colour a minimap dot by MECE health (flagged) then priority — a health overview. */
function minimapNodeColor(node: IssueFlowNode): string {
  const m = node.data.mece;
  if (m && (m.exclusive.state === 'warn' || m.exhaustive.state === 'warn')) return '#bd842c';
  if (node.data.priority === 'high') return '#3f6fb0';
  return '#cfccc3';
}

/** Title band for a PDF / PPTX export: the key question + today's date. */
function exportHeader(doc: IssueTreeDoc): ExportHeader {
  const title = doc.nodes[doc.rootId]?.label ?? 'Issue tree';
  const date = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  return { title, subtitle: date };
}
const FIT_VIEW_OPTIONS = { padding: 0.3, maxZoom: 1.2 };
// Ring applied to the node a drag would re-parent onto (valid targets only).
const DROP_TARGET_CLASS = 'rounded-lg ring-2 ring-[#3f7d54] ring-offset-2 ring-offset-[#faf9f5]';

function Flow() {
  const doc = useStore((s) => s.doc);
  const selectedId = useStore((s) => s.selectedId);
  const selectedIds = useStore((s) => s.selectedIds);
  const select = useStore((s) => s.select);
  const toggleSelect = useStore((s) => s.toggleSelect);
  const moveNode = useStore((s) => s.moveNode);
  const renameNode = useStore((s) => s.renameNode);
  const addChild = useStore((s) => s.addChild);
  const collapseAll = useStore((s) => s.collapseAll);
  const expandAll = useStore((s) => s.expandAll);
  const sortByPriority = useStore((s) => s.settings.sortSiblingsByPriority);
  const reviewOpen = useStore((s) => s.reviewOpen);
  const locateNonce = useStore((s) => s.locateNonce);
  const exportRequest = useStore((s) => s.exportRequest);
  const requestExport = useStore((s) => s.requestExport);
  const { fitView, getNodes, getIntersectingNodes, getViewport } = useReactFlow();

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

  // Keyboard on the selected node — an outliner loop, ignored while typing:
  //  Enter / F2 edit · Tab add child · Shift+Enter add sibling · arrows navigate
  //  (↑/↓ between siblings, ← to parent, → to first child). All edit-and-select
  //  the way you'd expect, so a tree can be built and walked without the mouse.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return;
      if (editingId || !selectedId) return;
      const doc = useStore.getState().doc;
      const addAndEdit = (parentId: NodeId) => {
        addChild(parentId);
        const kids = childrenOf(useStore.getState().doc, parentId);
        const newId = kids[kids.length - 1]?.id;
        if (newId) {
          select(newId);
          setEditingId(newId);
        }
      };
      if (e.key === 'Enter' && e.shiftKey) {
        // Add a sibling: a child of this node's parent (root has no parent).
        e.preventDefault();
        const parent = parentOf(doc, selectedId as NodeId);
        if (parent) addAndEdit(parent);
      } else if (e.key === 'Enter' || e.key === 'F2') {
        e.preventDefault();
        setEditingId(selectedId);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        addAndEdit(selectedId as NodeId);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        const parent = parentOf(doc, selectedId as NodeId);
        const sibs = parent ? childrenOf(doc, parent) : [];
        const idx = sibs.findIndex((n) => n.id === selectedId);
        const next = e.key === 'ArrowDown' ? sibs[idx + 1] : sibs[idx - 1];
        if (idx !== -1 && next) {
          e.preventDefault();
          select(next.id);
        }
      } else if (e.key === 'ArrowLeft') {
        const parent = parentOf(doc, selectedId as NodeId);
        if (parent) {
          e.preventDefault();
          select(parent);
        }
      } else if (e.key === 'ArrowRight') {
        const first = childrenOf(doc, selectedId as NodeId)[0];
        if (first) {
          e.preventDefault();
          select(first.id);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, editingId, addChild, select]);

  const { nodes: layoutNodes, edges } = useMemo(
    () => toFlow(doc, selectedIds, query, sortByPriority),
    [doc, selectedIds, query, sortByPriority]
  );
  const [nodes, setNodes, onNodesChange] = useNodesState(layoutNodes);

  // Auto-layout stays the source of truth: re-sync React Flow's nodes whenever the
  // projection changes (add / edit / undo / re-parent). A drag only moves a node
  // transiently until it resolves to a re-parent on drop.
  useEffect(() => {
    setNodes(layoutNodes);
  }, [layoutNodes, setNodes]);

  // Re-fit when the node set changes — but only when it needs to. A freshly-opened
  // document always fits; otherwise we fit only if something (e.g. a just-added
  // sub-issue) would land outside the current viewport, so editing a big tree
  // doesn't keep yanking the view back to a full fit. rAF lets dagre's new
  // positions and React Flow's node state settle first. Bounds come from the
  // layout positions + the known node size (not measured sizes), so they're
  // correct for a node that hasn't rendered yet.
  const nodeCount = layoutNodes.length;
  const docId = doc.id;
  const fittedDocId = useRef<string | null>(null);
  useEffect(() => {
    if (nodeCount === 0) return;
    const isNewDoc = fittedDocId.current !== docId;
    fittedDocId.current = docId;
    const handle = requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>('.react-flow');
      const allInView =
        !isNewDoc &&
        el !== null &&
        boundsWithinViewport(
          nodesBounds(
            getNodes().map((n) => n.position),
            NODE_WIDTH,
            NODE_HEIGHT
          ),
          getViewport(),
          { width: el.clientWidth, height: el.clientHeight }
        );
      if (!allInView) void fitView({ ...FIT_VIEW_OPTIONS, duration: 200 });
    });
    return () => cancelAnimationFrame(handle);
  }, [nodeCount, docId, fitView, getNodes, getViewport]);

  // The review dock asks to centre a node via a bumped nonce — fire only on the
  // bump (not on every selection), reading the now-selected id fresh.
  useEffect(() => {
    if (locateNonce === 0) return;
    const id = useStore.getState().selectedId;
    if (id) void fitView({ nodes: [{ id }], duration: 400, padding: 0.5, maxZoom: 1.3 });
  }, [locateNonce, fitView]);

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
      const st = useStore.getState();
      setNodes(toFlow(st.doc, st.selectedIds, '', st.settings.sortSiblingsByPriority).nodes);
    },
    [findDropTarget, moveNode, setNodes]
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

  const matchCount = query.trim() === '' ? 0 : nodes.filter((n) => n.data.matched).length;

  // When the review dock is open, dim clean split-nodes and amber-dash the edges
  // out of flagged splits so the issues stand out. Derived (not baked into node
  // state) so it can't fight the auto-layout re-sync.
  const flaggedIds = useMemo(() => new Set(flaggedSplits(doc).map((f) => f.nodeId)), [doc]);
  const displayNodes = useMemo(() => {
    if (!reviewOpen) return nodes;
    return nodes.map((n) =>
      n.data.hasChildren && !flaggedIds.has(n.id as NodeId)
        ? { ...n, style: { ...n.style, opacity: 0.4 } }
        : n
    );
  }, [nodes, reviewOpen, flaggedIds]);
  const displayEdges = useMemo(() => {
    if (!reviewOpen) return edges;
    return edges.map((e) =>
      flaggedIds.has(e.source as NodeId)
        ? { ...e, style: { stroke: '#bd842c', strokeWidth: 2, strokeDasharray: '5 4' } }
        : e
    );
  }, [edges, reviewOpen, flaggedIds]);

  // Fulfil an export the header asked for: render the canvas once, hand the
  // raster image to the matching exporter, then clear the request. The render
  // needs the React Flow viewport, so the header can't export directly — it
  // routes through the store and the canvas answers here. The heavy exporter
  // libraries are loaded on demand (see services/exporters).
  useEffect(() => {
    if (!exportRequest) return;
    const run = async () => {
      // SVG goes straight to a (sanitised) text file — no raster step.
      if (exportRequest === 'svg') {
        const rendered = await renderCanvasSvg(getNodes());
        if (rendered) downloadText('mece-tree.svg', rendered.svg, 'image/svg+xml');
        return;
      }
      const image = await renderCanvasPng(getNodes());
      if (!image) return;
      if (exportRequest === 'png') downloadDataUrl('mece-tree.png', image.dataUrl);
      else if (exportRequest === 'copy') {
        // Copy the image to the clipboard; fall back to a download where unsupported.
        const copied = await copyImageToClipboard(image.dataUrl);
        if (!copied) downloadDataUrl('mece-tree.png', image.dataUrl);
      } else if (exportRequest === 'pdf') {
        await saveTreePdf(image, 'mece-tree.pdf', exportHeader(useStore.getState().doc));
      } else await saveTreePptx(image, 'mece-tree.pptx', exportHeader(useStore.getState().doc));
    };
    void run();
    requestExport(null);
  }, [exportRequest, getNodes, requestExport]);

  return (
    <NodeEditingContext.Provider value={editing}>
      {/* role="tree" lives here, not on <ReactFlow> — RF hardcodes role="application"
          on its own .react-flow div. Screen readers still associate the treeitems. */}
      <div
        role="tree"
        aria-label={`Issue tree: ${doc.nodes[doc.rootId]?.label ?? 'Issue tree'}`}
        className="h-full w-full"
      >
        <ReactFlow
          nodes={displayNodes}
          edges={displayEdges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onNodeClick={(evt, node) =>
            evt.shiftKey || evt.metaKey || evt.ctrlKey
              ? toggleSelect(node.id as NodeId)
              : select(node.id as NodeId)
          }
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
          <MiniMap
            pannable
            zoomable
            nodeColor={(n) => minimapNodeColor(n as IssueFlowNode)}
            nodeStrokeWidth={2}
            maskColor="rgba(250,249,245,0.6)"
            className="!bottom-2 !right-2 !border !border-[#e7e4dc] !bg-white/85 hidden sm:block"
          />
          <Panel position="top-center">
            <CanvasCoach show={Object.keys(doc.splits).length === 0} />
          </Panel>
          <Panel position="bottom-center">
            <SelectionBar />
          </Panel>
          <Panel position="top-left">
            <div className="flex flex-col gap-1">
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
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => collapseAll()}
                  className="nodrag rounded-md border border-neutral-200 bg-white/90 px-2 py-0.5 text-[11px] text-neutral-600 shadow-sm hover:bg-white"
                >
                  Collapse all
                </button>
                <button
                  type="button"
                  onClick={() => expandAll()}
                  className="nodrag rounded-md border border-neutral-200 bg-white/90 px-2 py-0.5 text-[11px] text-neutral-600 shadow-sm hover:bg-white"
                >
                  Expand all
                </button>
              </div>
              {query.trim() !== '' && (
                <span className="px-0.5 text-[10px] text-neutral-400">
                  {matchCount === 0
                    ? 'No matches'
                    : `${matchCount} match${matchCount === 1 ? '' : 'es'}`}
                </span>
              )}
            </div>
          </Panel>
        </ReactFlow>
      </div>
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
