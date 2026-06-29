import { childrenOf, splitOf } from './tree';
import type { IssueTreeDoc, NodeId } from './types';

/**
 * The ordered nodes to step through when presenting a tree to an audience —
 * one step per decomposition (a node that has a split), in depth-first
 * pre-order, so a presenter walks the tree top-down, one branch at a time.
 *
 * Falls back to `[rootId]` for a tree with no splits yet, so presentation mode
 * always has at least one slide. Pure, so it's unit-testable.
 */
export function presentationSteps(doc: IssueTreeDoc): NodeId[] {
  const steps: NodeId[] = [];
  const visit = (id: NodeId) => {
    if (splitOf(doc, id)) steps.push(id);
    for (const child of childrenOf(doc, id)) visit(child.id);
  };
  visit(doc.rootId);
  return steps.length > 0 ? steps : [doc.rootId];
}
