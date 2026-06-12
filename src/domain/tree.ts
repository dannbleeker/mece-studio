import { createNode, createSplit } from './factory';
import { scaffoldChildren } from './scaffold';
import type {
  DecompositionType,
  EvidenceItem,
  FormulaOperator,
  IssueNode,
  IssueTreeDoc,
  NodeId,
  NodeStatus,
  NumericValue,
  Priority,
  Split,
  SplitId,
} from './types';

/** The split whose children belong to `nodeId` (i.e. how `nodeId` decomposes), if any. */
export function splitOf(doc: IssueTreeDoc, nodeId: NodeId): Split | undefined {
  return Object.values(doc.splits).find((s) => s.parentId === nodeId);
}

/** The id of the node that `nodeId` hangs under (its parent), if any. */
export function parentOf(doc: IssueTreeDoc, nodeId: NodeId): NodeId | undefined {
  return Object.values(doc.splits).find((s) => s.childIds.includes(nodeId))?.parentId;
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

/** Nodes hidden because an ancestor is collapsed (a collapsed node stays visible). */
export function hiddenNodeIds(doc: IssueTreeDoc): Set<NodeId> {
  const hidden = new Set<NodeId>();
  const walk = (id: NodeId, hiddenHere: boolean): void => {
    if (hiddenHere) hidden.add(id);
    const childrenHidden = hiddenHere || doc.nodes[id]?.collapsed === true;
    for (const child of childrenOf(doc, id)) walk(child.id, childrenHidden);
  };
  walk(doc.rootId, false);
  return hidden;
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

/** Set the combine operator of a formula split (sum / product / difference). */
export function setOperator(
  doc: IssueTreeDoc,
  parentId: NodeId,
  operator: FormulaOperator
): IssueTreeDoc {
  const split = splitOf(doc, parentId);
  if (!split) return doc;
  return { ...doc, splits: { ...doc.splits, [split.id]: { ...split, operator } } };
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

/** Set or clear a node's free-text notes (rationale, assumptions, sources). */
export function setDetail(doc: IssueTreeDoc, nodeId: NodeId, detail: string): IssueTreeDoc {
  const node = doc.nodes[nodeId];
  if (!node) return doc;
  const next: IssueNode = { ...node };
  if (detail.trim() === '') {
    delete next.detail;
  } else {
    next.detail = detail;
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

/**
 * Re-parent `nodeId` (and its whole subtree) to become a child of `newParentId`,
 * leaving auto-layout to re-tidy. No-op when the move is invalid: moving the
 * root, onto itself, onto one of its own descendants (which would cut the
 * subtree loose), or to the parent it already has.
 */
export function moveNode(doc: IssueTreeDoc, nodeId: NodeId, newParentId: NodeId): IssueTreeDoc {
  if (nodeId === doc.rootId) return doc;
  if (nodeId === newParentId) return doc;
  if (!doc.nodes[nodeId] || !doc.nodes[newParentId]) return doc;
  if (descendantIds(doc, nodeId).includes(newParentId)) return doc;
  if (parentOf(doc, nodeId) === newParentId) return doc;

  // Detach from the old parent's split, dropping it if it goes empty.
  const splits: Record<SplitId, Split> = {};
  for (const [id, split] of Object.entries(doc.splits)) {
    if (split.childIds.includes(nodeId)) {
      const childIds = split.childIds.filter((c) => c !== nodeId);
      if (childIds.length > 0) splits[id as SplitId] = { ...split, childIds };
    } else {
      splits[id as SplitId] = split;
    }
  }

  // Attach to the new parent's split, creating one if it was a leaf.
  const target = Object.values(splits).find((s) => s.parentId === newParentId);
  if (target) {
    splits[target.id] = { ...target, childIds: [...target.childIds, nodeId] };
  } else {
    const split: Split = { ...createSplit(newParentId, 'freeform'), childIds: [nodeId] };
    splits[split.id] = split;
  }

  return { ...doc, splits };
}

/** Reorder a node among its siblings. No-op at the ends or with no parent. */
export function moveSibling(
  doc: IssueTreeDoc,
  nodeId: NodeId,
  direction: 'up' | 'down'
): IssueTreeDoc {
  const split = Object.values(doc.splits).find((s) => s.childIds.includes(nodeId));
  if (!split) return doc;
  const i = split.childIds.indexOf(nodeId);
  const j = direction === 'up' ? i - 1 : i + 1;
  if (j < 0 || j >= split.childIds.length) return doc;
  const childIds = [...split.childIds];
  [childIds[i], childIds[j]] = [childIds[j], childIds[i]];
  return { ...doc, splits: { ...doc.splits, [split.id]: { ...split, childIds } } };
}

/**
 * Duplicate a node and its whole subtree, inserting the copy as a sibling under
 * the same parent. Fresh ids throughout. No-op for the root or a missing node.
 */
export function duplicateNode(
  doc: IssueTreeDoc,
  nodeId: NodeId
): { doc: IssueTreeDoc; newId: NodeId } {
  const parent = parentOf(doc, nodeId);
  if (nodeId === doc.rootId || parent === undefined || !doc.nodes[nodeId]) {
    return { doc, newId: nodeId };
  }

  const subtreeIds = [nodeId, ...descendantIds(doc, nodeId)];
  const idMap = new Map<NodeId, NodeId>();
  const nodes = { ...doc.nodes };
  for (const id of subtreeIds) {
    const orig = doc.nodes[id];
    if (!orig) continue;
    const clone = createNode(orig.label);
    idMap.set(id, clone.id);
    nodes[clone.id] = { ...orig, id: clone.id, evidence: orig.evidence.map((e) => ({ ...e })) };
  }

  const splits = { ...doc.splits };
  for (const split of Object.values(doc.splits)) {
    const newParent = idMap.get(split.parentId);
    if (newParent === undefined) continue;
    const cloned: Split = {
      ...createSplit(newParent, split.decomposition),
      childIds: split.childIds.map((c) => idMap.get(c)).filter((c): c is NodeId => c !== undefined),
    };
    if (split.operator !== undefined) cloned.operator = split.operator;
    splits[cloned.id] = cloned;
  }

  // Insert the clone as a sibling of the original.
  const newId = idMap.get(nodeId) as NodeId;
  const parentSplit = Object.values(splits).find((s) => s.parentId === parent);
  if (parentSplit) {
    splits[parentSplit.id] = { ...parentSplit, childIds: [...parentSplit.childIds, newId] };
  }

  return { doc: { ...doc, nodes, splits }, newId };
}

/**
 * Decompose `parentId`. If it already has a split, just change the type;
 * otherwise create the split and seed type-appropriate starter children.
 */
export function decompose(
  doc: IssueTreeDoc,
  parentId: NodeId,
  decomposition: DecompositionType
): IssueTreeDoc {
  if (!doc.nodes[parentId]) return doc;
  if (splitOf(doc, parentId)) return setDecomposition(doc, parentId, decomposition);
  let next = doc;
  for (const label of scaffoldChildren(decomposition)) {
    next = addChild(next, parentId, label, decomposition).doc;
  }
  return next;
}

/** Set or clear a node's priority (impact × ease). */
export function setPriority(
  doc: IssueTreeDoc,
  nodeId: NodeId,
  priority: Priority | undefined
): IssueTreeDoc {
  const node = doc.nodes[nodeId];
  if (!node) return doc;
  const next: IssueNode = { ...node };
  if (priority === undefined) {
    delete next.priority;
  } else {
    next.priority = priority;
  }
  return { ...doc, nodes: { ...doc.nodes, [nodeId]: next } };
}

/** Attach an evidence item to a node. */
export function addEvidence(doc: IssueTreeDoc, nodeId: NodeId, item: EvidenceItem): IssueTreeDoc {
  const node = doc.nodes[nodeId];
  if (!node) return doc;
  return {
    ...doc,
    nodes: { ...doc.nodes, [nodeId]: { ...node, evidence: [...node.evidence, item] } },
  };
}

export function removeEvidence(
  doc: IssueTreeDoc,
  nodeId: NodeId,
  evidenceId: string
): IssueTreeDoc {
  const node = doc.nodes[nodeId];
  if (!node) return doc;
  const evidence = node.evidence.filter((e) => e.id !== evidenceId);
  if (evidence.length === node.evidence.length) return doc;
  return { ...doc, nodes: { ...doc.nodes, [nodeId]: { ...node, evidence } } };
}

export function updateEvidence(
  doc: IssueTreeDoc,
  nodeId: NodeId,
  evidenceId: string,
  patch: Partial<EvidenceItem>
): IssueTreeDoc {
  const node = doc.nodes[nodeId];
  if (!node) return doc;
  let changed = false;
  const evidence = node.evidence.map((e) => {
    if (e.id !== evidenceId) return e;
    changed = true;
    return { ...e, ...patch };
  });
  if (!changed) return doc;
  return { ...doc, nodes: { ...doc.nodes, [nodeId]: { ...node, evidence } } };
}

/** Set a node's hypothesis status (open / supported / refuted / parked). */
export function setStatus(doc: IssueTreeDoc, nodeId: NodeId, status: NodeStatus): IssueTreeDoc {
  const node = doc.nodes[nodeId];
  if (!node || node.status === status) return doc;
  return { ...doc, nodes: { ...doc.nodes, [nodeId]: { ...node, status } } };
}

/** Collapse or expand a node's subtree (hides/shows its descendants on the canvas). */
export function toggleCollapse(doc: IssueTreeDoc, nodeId: NodeId): IssueTreeDoc {
  const node = doc.nodes[nodeId];
  if (!node) return doc;
  const next: IssueNode = { ...node };
  if (node.collapsed) {
    delete next.collapsed;
  } else {
    next.collapsed = true;
  }
  return { ...doc, nodes: { ...doc.nodes, [nodeId]: next } };
}

/** Collapse every non-root node that has children, or expand all of them. */
export function setAllCollapsed(doc: IssueTreeDoc, collapsed: boolean): IssueTreeDoc {
  const nodes: Record<NodeId, IssueNode> = {};
  let changed = false;
  for (const [key, node] of Object.entries(doc.nodes)) {
    const id = key as NodeId;
    const want = collapsed && id !== doc.rootId && splitOf(doc, id) !== undefined;
    if (want && !node.collapsed) {
      nodes[id] = { ...node, collapsed: true };
      changed = true;
    } else if (!want && node.collapsed) {
      const next: IssueNode = { ...node };
      delete next.collapsed;
      nodes[id] = next;
      changed = true;
    } else {
      nodes[id] = node;
    }
  }
  return changed ? { ...doc, nodes } : doc;
}
