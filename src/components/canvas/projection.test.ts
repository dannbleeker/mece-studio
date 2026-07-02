import { describe, expect, it } from 'vitest';
import { createDoc, createEvidence } from '../../domain/factory';
import { recomputeMece } from '../../domain/mece';
import {
  addChild,
  addEvidence,
  setDecomposition,
  setDetail,
  setNodeValue,
  setPriority,
  setStatus,
  toggleCollapse,
} from '../../domain/tree';
import type { IssueFlowNode } from './projection';
import { toFlow } from './projection';

function sample() {
  let doc = createDoc('Root', 0);
  const rev = addChild(doc, doc.rootId, 'Revenue');
  doc = rev.doc;
  const cost = addChild(doc, doc.rootId, 'Costs');
  doc = cost.doc;
  doc = setDecomposition(doc, doc.rootId, 'binary');
  doc = setNodeValue(doc, rev.childId, { amount: 100, unit: 'M' });
  doc = setPriority(doc, rev.childId, { impact: 'high', ease: 'high' });
  doc = addEvidence(doc, rev.childId, createEvidence('supports it', true));
  doc = addEvidence(doc, rev.childId, createEvidence('against it', false));
  doc = setStatus(doc, cost.childId, 'refuted');
  doc = setDetail(doc, cost.childId, 'a note');
  // Give Revenue its own children so it can be collapsed.
  doc = addChild(doc, rev.childId, 'Price').doc;
  doc = addChild(doc, rev.childId, 'Volume').doc;
  return { doc: recomputeMece(doc), revenueId: rev.childId, costsId: cost.childId };
}

const yOf = (nodes: IssueFlowNode[], id: string): number => {
  const n = nodes.find((node) => node.id === id);
  if (!n) throw new Error(`no node ${id}`);
  return n.position.y;
};

describe('toFlow projection', () => {
  it('maps node data and derives edges from splits', () => {
    const { doc, revenueId, costsId } = sample();
    const { nodes, edges } = toFlow(doc, []);
    const byId = new Map(nodes.map((n) => [n.id, n]));

    const rev = byId.get(revenueId);
    expect(rev?.data.value).toEqual({ amount: 100, unit: 'M' });
    expect(rev?.data.priority).toBe('high');
    expect(rev?.data.evidence).toEqual({ supports: 1, contradicts: 1 });
    expect(rev?.data.hasChildren).toBe(true);
    expect(byId.get(costsId)?.data.status).toBe('refuted');
    expect(byId.get(costsId)?.data.hasNote).toBe(true);

    // root + Revenue + Costs + Price + Volume = 5 nodes; 2 + 2 = 4 edges.
    expect(nodes).toHaveLength(5);
    expect(edges).toHaveLength(4);
  });

  it('marks every node in the selection set', () => {
    const { doc, revenueId, costsId } = sample();
    const byId = new Map(toFlow(doc, [revenueId, costsId]).nodes.map((n) => [n.id, n]));
    expect(byId.get(revenueId)?.data.selected).toBe(true);
    expect(byId.get(costsId)?.data.selected).toBe(true);
    expect(byId.get(doc.rootId)?.data.selected).toBe(false);
  });

  it('flags only the nodes matching the search query', () => {
    const { doc } = sample();
    const matched = toFlow(doc, [], 'rev')
      .nodes.filter((n) => n.data.matched)
      .map((n) => n.data.label);
    expect(matched).toEqual(['Revenue']);
  });

  it('hides descendants of a collapsed node but keeps the node itself', () => {
    const { doc, revenueId } = sample();
    const { nodes } = toFlow(toggleCollapse(doc, revenueId), []);
    const rev = nodes.find((n) => n.id === revenueId);
    expect(rev?.data.collapsed).toBe(true);
    expect(rev?.data.childCount).toBe(2);
    // Price + Volume are hidden → root + Revenue + Costs = 3 visible.
    expect(nodes).toHaveLength(3);
  });

  it('reorders siblings by priority only when asked (view-only)', () => {
    let doc = createDoc('Q', 0);
    const first = addChild(doc, doc.rootId, 'First');
    doc = first.doc;
    const second = addChild(doc, doc.rootId, 'Second');
    doc = second.doc;
    doc = setPriority(doc, first.childId, { impact: 'low', ease: 'low' });
    doc = setPriority(doc, second.childId, { impact: 'high', ease: 'high' });

    // Default: creation order (First above Second).
    const def = toFlow(doc, []).nodes;
    expect(yOf(def, first.childId)).toBeLessThan(yOf(def, second.childId));

    // Sorted: highest priority first (Second above First).
    const sorted = toFlow(doc, [], '', true).nodes;
    expect(yOf(sorted, second.childId)).toBeLessThan(yOf(sorted, first.childId));
  });
});
