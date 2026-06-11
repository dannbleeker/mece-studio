import { createNode, createSplit } from './factory';
import type {
  DecompositionType,
  IssueNode,
  IssueTreeDoc,
  NodeId,
  NumericValue,
  Split,
  SplitId,
} from './types';

/** The split whose children belong to `nodeId` (i.e. how `nodeId` decomposes), if any. */
export function splitOf(doc: IssueTreeDoc, nodeId: NodeId): Split | undefined {
  return Object.values(doc.splits).find((s) => s.parentId === nodeId);
}

/** Direct children of `nodeId`, in order. */
export function childrenOf(doc: IssueTreeDoc, nodeId: NodeId): IssueNode[] {
  const split = splitOf(doc, nodeId);
  if (!split) return [];
  return split.childIds.map((id) => doc.nodes[id]).filter((n): n is IssueNode => n !== undefined);
}

/** All descendant node ids of `nodeId` (excludes `nodeId` itself). */
export function descendantIds(doc: IssueTreeDoc, nodeId: NodeId): NodeId[] {
  const out: NodeId[] = [];
  const stack: NodeId[] = [...(splitOf(doc, nodeId)?.childIds ?? [])];
  while (stack.length > 0) {
    const id = stack.pop();
    if (id === undefined) break;
    out.push(id);
    const split = splitOf(doc, id);
    if (split) stack.push(...split.childIds);
  }
  return out;
}

/**
 * Add a child issue under `parentId`, creating the parent's split if it has
 * none. Returns the new doc and the new child's id.
 */
export function addChild(
  doc: IssueTreeDoc,
  parentId: NodeId,
  label = 'New issue',
  decomposition: DecompositionType = 'freeform'
): { doc: IssueTreeDoc; childId: NodeId } {
  if (!doc.nodes[parentId]) return { doc, childId: parentId };
  const child = createNode(label);
  const nodes = { ...doc.nodes, [child.id]: child };
  const existing = splitOf(doc, parentId);
  let splits: Record<SplitId, Split>;
  if (existing) {
    splits = {
      ...doc.splits,
      [existing.id]: { ...existing, childIds: [...existing.childIds, child.id] },
    };
  } else {
    const split: Split = { ...createSplit(parentId, decomposition), childIds: [child.id] };
    splits = { ...doc.splits, [split.id]: split };
  }
  return { doc: { ...doc, nodes, splits }, childId: child.id };
}

/** Change how `parentId` decomposes. No-op if it has no split yet. */
export function setDecomposition(
  doc: IssueTreeDoc,
  parentId: NodeId,
  decomposition: DecompositionType
): IssueTreeDoc {
  const split = splitOf(doc, parentId);
  if (!split) return doc;
  return { ...doc, splits: { ...doc.splits, [split.id]: { ...split, decomposition } } };
}

export function renameNode(doc: IssueTreeDoc, nodeId: NodeId, label: string): IssueTreeDoc {
  const node = doc.nodes[nodeId];
  if (!node) return doc;
  return { ...doc, nodes: { ...doc.nodes, [nodeId]: { ...node, label } } };
}

/** Set or clear a node's numeric value (used by formula splits). */
export function setNodeValue(
  doc: IssueTreeDoc,
  nodeId: NodeId,
  value: NumericValue | undefined
): IssueTreeDoc {
  const node = doc.nodes[nodeId];
  if (!node) return doc;
  const next: IssueNode = { ...node };
  if (value === undefined) {
    delete next.value;
  } else {
    next.value = value;
  }
  return { ...doc, nodes: { ...doc.nodes, [nodeId]: next } };
}

/** Remove a node and its whole subtree. The root cannot be removed. */
export function removeNode(doc: IssueTreeDoc, nodeId: NodeId): IssueTreeDoc {
  if (nodeId === doc.rootId || !doc.nodes[nodeId]) return doc;
  const removed = new Set<NodeId>([nodeId, ...descendantIds(doc, nodeId)]);

  const nodes: Record<NodeId, IssueNode> = {};
  for (const [id, node] of Object.entries(doc.nodes)) {
    if (!removed.has(id as NodeId)) nodes[id as NodeId] = node;
  }

  const splits: Record<SplitId, Split> = {};
  for (const [id, split] of Object.entries(doc.splits)) {
    if (removed.has(split.parentId)) continue;
    const childIds = split.childIds.filter((c) => !removed.has(c));
    if (childIds.length === 0) continue;
    splits[id as SplitId] =
      childIds.length === split.childIds.length ? split : { ...split, childIds };
  }

  return { ...doc, nodes, splits };
}
