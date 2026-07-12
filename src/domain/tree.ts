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
  ProblemBrief,
  Split,
  SplitId,
  SplitLogic,
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
 * 0-based depth of every node (root = 0), walking the full tree root-down. The
 * single source for the canvas `aria-level` (which is `depth + 1`, 1-based).
 */
export function nodeDepths(doc: IssueTreeDoc): Record<NodeId, number> {
  const depths: Record<NodeId, number> = {};
  const walk = (id: NodeId, depth: number): void => {
    depths[id] = depth;
    for (const child of childrenOf(doc, id)) walk(child.id, depth + 1);
  };
  walk(doc.rootId, 0);
  return depths;
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

/**
 * Add several child issues under `parentId` in one transform (one undo entry).
 * Blank labels are skipped; returns the doc unchanged if none are added.
 */
export function addChildren(doc: IssueTreeDoc, parentId: NodeId, labels: string[]): IssueTreeDoc {
  let next = doc;
  for (const raw of labels) {
    const label = raw.trim();
    if (label) next = addChild(next, parentId, label).doc;
  }
  return next;
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

/** Set or clear the axis a split is cut on (e.g. "geography"). No-op when unchanged. */
export function setDimension(doc: IssueTreeDoc, parentId: NodeId, dimension: string): IssueTreeDoc {
  const split = splitOf(doc, parentId);
  if (!split) return doc;
  const trimmed = dimension.trim();
  if (trimmed === (split.dimension ?? '')) return doc;
  const next = { ...split };
  if (trimmed === '') delete next.dimension;
  else next.dimension = trimmed;
  return { ...doc, splits: { ...doc.splits, [split.id]: next } };
}

/**
 * Set a split's logic mode. `inductive` (the default) clears the field; only
 * `deductive` is stored. No-op (same reference) when unchanged.
 */
export function setSplitLogic(
  doc: IssueTreeDoc,
  parentId: NodeId,
  logic: SplitLogic
): IssueTreeDoc {
  const split = splitOf(doc, parentId);
  if (!split) return doc;
  if (logic === (split.logic ?? 'inductive')) return doc;
  const next = { ...split };
  if (logic === 'inductive') delete next.logic;
  else next.logic = logic;
  return { ...doc, splits: { ...doc.splits, [split.id]: next } };
}

/** Set or clear a split's "so-what" summary (the insight its children support). No-op when unchanged. */
export function setSplitSummary(
  doc: IssueTreeDoc,
  parentId: NodeId,
  summary: string
): IssueTreeDoc {
  const split = splitOf(doc, parentId);
  if (!split) return doc;
  const trimmed = summary.trim();
  if (trimmed === (split.summary ?? '')) return doc;
  const next = { ...split };
  if (trimmed === '') delete next.summary;
  else next.summary = trimmed;
  return { ...doc, splits: { ...doc.splits, [split.id]: next } };
}

/** Set or clear the governing answer / hypothesis on the doc. No-op when unchanged. */
export function setAnswer(doc: IssueTreeDoc, answer: string): IssueTreeDoc {
  const trimmed = answer.trim();
  if (trimmed === (doc.answer ?? '')) return doc;
  const next = { ...doc };
  if (trimmed === '') delete next.answer;
  else next.answer = trimmed;
  return next;
}

/**
 * Merge a patch into the doc's problem brief: values are trimmed, fields that go
 * blank are dropped, and the whole `problemBrief` is removed once every field
 * clears. No-op (same reference) when the patch changes nothing.
 */
export function setProblemBrief(doc: IssueTreeDoc, patch: Partial<ProblemBrief>): IssueTreeDoc {
  const merged: ProblemBrief = { ...doc.problemBrief };
  let changed = false;
  for (const [key, value] of Object.entries(patch) as [keyof ProblemBrief, string | undefined][]) {
    const trimmed = (value ?? '').trim();
    if (trimmed === (merged[key] ?? '')) continue;
    changed = true;
    if (trimmed === '') delete merged[key];
    else merged[key] = trimmed;
  }
  if (!changed) return doc;
  const next = { ...doc };
  if (Object.keys(merged).length === 0) delete next.problemBrief;
  else next.problemBrief = merged;
  return next;
}

/**
 * Apply `fn` to the node at `nodeId`, returning the doc with that node replaced.
 * Returns the doc UNCHANGED (same reference) when the node is missing or `fn`
 * returns `null` — so a no-op edit never churns undo history. `fn` returns a full
 * `IssueNode` (not a partial): `exactOptionalPropertyTypes` needs explicit
 * `delete`s to clear optional fields, which a shallow merge can't express.
 */
function patchNode(
  doc: IssueTreeDoc,
  nodeId: NodeId,
  fn: (node: IssueNode) => IssueNode | null
): IssueTreeDoc {
  const node = doc.nodes[nodeId];
  if (!node) return doc;
  const next = fn(node);
  if (next === null || next === node) return doc;
  return { ...doc, nodes: { ...doc.nodes, [nodeId]: next } };
}

export function renameNode(doc: IssueTreeDoc, nodeId: NodeId, label: string): IssueTreeDoc {
  // no-op edits don't churn undo history
  return patchNode(doc, nodeId, (node) => (node.label === label ? null : { ...node, label }));
}

/** Set or clear a node's numeric value (used by formula splits). */
export function setNodeValue(
  doc: IssueTreeDoc,
  nodeId: NodeId,
  value: NumericValue | undefined
): IssueTreeDoc {
  return patchNode(doc, nodeId, (node) => {
    const cur = node.value;
    const unchanged =
      value === undefined
        ? cur === undefined
        : cur !== undefined && cur.amount === value.amount && cur.unit === value.unit;
    if (unchanged) return null; // no-op edits don't churn undo history
    const next: IssueNode = { ...node };
    if (value === undefined) delete next.value;
    else next.value = value;
    return next;
  });
}

/** Set or clear a node's free-text notes (rationale, assumptions, sources). */
export function setDetail(doc: IssueTreeDoc, nodeId: NodeId, detail: string): IssueTreeDoc {
  return patchNode(doc, nodeId, (node) => {
    const nextDetail = detail.trim() === '' ? undefined : detail;
    if (node.detail === nextDetail) return null; // no-op edits don't churn undo history
    const next: IssueNode = { ...node };
    if (nextDetail === undefined) delete next.detail;
    else next.detail = nextDetail;
    return next;
  });
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
  return patchNode(doc, nodeId, (node) => {
    const next: IssueNode = { ...node };
    if (priority === undefined) delete next.priority;
    else next.priority = priority;
    return next;
  });
}

/** Attach an evidence item to a node. */
export function addEvidence(doc: IssueTreeDoc, nodeId: NodeId, item: EvidenceItem): IssueTreeDoc {
  return patchNode(doc, nodeId, (node) => ({ ...node, evidence: [...node.evidence, item] }));
}

export function removeEvidence(
  doc: IssueTreeDoc,
  nodeId: NodeId,
  evidenceId: string
): IssueTreeDoc {
  return patchNode(doc, nodeId, (node) => {
    const evidence = node.evidence.filter((e) => e.id !== evidenceId);
    return evidence.length === node.evidence.length ? null : { ...node, evidence };
  });
}

export function updateEvidence(
  doc: IssueTreeDoc,
  nodeId: NodeId,
  evidenceId: string,
  patch: Partial<EvidenceItem>
): IssueTreeDoc {
  return patchNode(doc, nodeId, (node) => {
    let changed = false;
    const evidence = node.evidence.map((e) => {
      if (e.id !== evidenceId) return e;
      changed = true;
      return { ...e, ...patch };
    });
    return changed ? { ...node, evidence } : null;
  });
}

/** Set a node's hypothesis status (open / supported / refuted / parked). */
export function setStatus(doc: IssueTreeDoc, nodeId: NodeId, status: NodeStatus): IssueTreeDoc {
  return patchNode(doc, nodeId, (node) => (node.status === status ? null : { ...node, status }));
}

/** Remove several nodes (and their subtrees) in one transform — one undo step. */
export function removeNodes(doc: IssueTreeDoc, ids: readonly NodeId[]): IssueTreeDoc {
  let next = doc;
  for (const id of ids) next = removeNode(next, id);
  return next;
}

/** Set the hypothesis status on several nodes in one transform — one undo step. */
export function setStatusMany(
  doc: IssueTreeDoc,
  ids: readonly NodeId[],
  status: NodeStatus
): IssueTreeDoc {
  let next = doc;
  for (const id of ids) next = setStatus(next, id, status);
  return next;
}

/** Set or clear priority on several nodes in one transform — one undo step. */
export function setPriorityMany(
  doc: IssueTreeDoc,
  ids: readonly NodeId[],
  priority: Priority | undefined
): IssueTreeDoc {
  let next = doc;
  for (const id of ids) next = setPriority(next, id, priority);
  return next;
}

/** Collapse or expand a node's subtree (hides/shows its descendants on the canvas). */
export function toggleCollapse(doc: IssueTreeDoc, nodeId: NodeId): IssueTreeDoc {
  return patchNode(doc, nodeId, (node) => {
    const next: IssueNode = { ...node };
    if (node.collapsed) delete next.collapsed;
    else next.collapsed = true;
    return next;
  });
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
