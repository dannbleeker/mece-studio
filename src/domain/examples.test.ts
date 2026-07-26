import { describe, expect, it } from 'vitest';
import { en } from '@/i18n/locales/en';
import { EXAMPLE_TREES } from './examples';
import { childrenOf, splitOf } from './tree';
import type { IssueNode, IssueTreeDoc } from './types';

function nodeByLabel(doc: IssueTreeDoc, label: string): IssueNode {
  const node = Object.values(doc.nodes).find((n) => n.label === label);
  if (!node) throw new Error(`no node labelled "${label}"`);
  return node;
}

describe('example trees', () => {
  it('exposes a few examples with unique ids and names', () => {
    expect(EXAMPLE_TREES.length).toBeGreaterThanOrEqual(3);
    expect(new Set(EXAMPLE_TREES.map((e) => e.id)).size).toBe(EXAMPLE_TREES.length);
    const names = EXAMPLE_TREES.map((e) => en.content.examples[e.id].name);
    expect(new Set(names).size).toBe(EXAMPLE_TREES.length);
    for (const e of EXAMPLE_TREES) expect(en.content.examples[e.id].blurb).toBeTruthy();
  });

  it('every example builds a valid, non-trivial tree', () => {
    for (const e of EXAMPLE_TREES) {
      const doc = e.build(en);
      expect(doc.nodes[doc.rootId]).toBeDefined();
      expect(childrenOf(doc, doc.rootId).length).toBeGreaterThanOrEqual(2);
      // Every split references nodes that exist.
      for (const split of Object.values(doc.splits)) {
        expect(doc.nodes[split.parentId]).toBeDefined();
        for (const childId of split.childIds) expect(doc.nodes[childId]).toBeDefined();
      }
    }
  });

  it('the value-driver tree reconciles at every formula split', () => {
    const doc = EXAMPLE_TREES.find((e) => e.id === 'profit')?.build(en);
    if (!doc) throw new Error('missing profit example');
    const nodes = en.content.examples.profit.nodes;
    for (const label of [nodes.root.label, nodes.revenue.label, nodes.costs.label]) {
      const split = splitOf(doc, nodeByLabel(doc, label).id);
      expect(split?.decomposition).toBe('formula');
      expect(split?.mece.exhaustive.state).toBe('pass');
      expect(split?.mece.exclusive.state).toBe('pass');
    }
  });

  it('the churn tree is collectively exhaustive via an Other bucket, with hypotheses + evidence', () => {
    const doc = EXAMPLE_TREES.find((e) => e.id === 'churn')?.build(en);
    if (!doc) throw new Error('missing churn example');
    const nodes = en.content.examples.churn.nodes;
    const rootSplit = splitOf(doc, doc.rootId);
    expect(rootSplit?.decomposition).toBe('segment');
    expect(rootSplit?.mece.exhaustive.state).toBe('pass');
    const early = nodeByLabel(doc, nodes.early.label);
    expect(early.status).toBe('supported');
    expect(early.evidence.length).toBeGreaterThanOrEqual(1);
    expect(nodeByLabel(doc, nodes.dormant.label).status).toBe('parked');
  });

  it('the decision tree uses a provably-MECE binary split', () => {
    const doc = EXAMPLE_TREES.find((e) => e.id === 'decision')?.build(en);
    if (!doc) throw new Error('missing decision example');
    const rootSplit = splitOf(doc, doc.rootId);
    expect(rootSplit?.decomposition).toBe('binary');
    expect(rootSplit?.mece.exclusive.state).toBe('pass');
    expect(rootSplit?.mece.exhaustive.state).toBe('pass');
  });

  it('the M&A example has a provable synergy formula that clears the goal', () => {
    const doc = EXAMPLE_TREES.find((e) => e.id === 'acquisition')?.build(en);
    if (!doc) throw new Error('missing acquisition example');
    const synergies = nodeByLabel(doc, en.content.examples.acquisition.nodes.synergies.label);
    const split = splitOf(doc, synergies.id);
    expect(split?.decomposition).toBe('formula');
    expect(split?.mece.exhaustive.state).toBe('pass'); // 175 + 50 = 225
  });

  it('the market-sizing and revenue-driver trees reconcile at every formula split', () => {
    for (const id of ['market-sizing', 'revenue-drivers'] as const) {
      const doc = EXAMPLE_TREES.find((e) => e.id === id)?.build(en);
      if (!doc) throw new Error(`missing ${id} example`);
      const formulaSplits = Object.values(doc.splits).filter((s) => s.decomposition === 'formula');
      expect(formulaSplits.length).toBeGreaterThanOrEqual(2);
      for (const s of formulaSplits) expect(s.mece.exhaustive.state).toBe('pass');
    }
  });

  it('the framework example trees never falsely claim exhaustiveness', () => {
    for (const id of ['market-entry', 'pricing', 'sourcing'] as const) {
      const doc = EXAMPLE_TREES.find((e) => e.id === id)?.build(en);
      if (!doc) throw new Error(`missing ${id} example`);
      const root = splitOf(doc, doc.rootId);
      expect(root?.decomposition).toBe('framework');
      expect(root?.mece.exhaustive.state).toBe('unknown');
    }
  });
});
