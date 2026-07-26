// A small library of ready-made example trees, so a new user can open a
// well-formed MECE tree and learn the tool by poking at a real one rather than
// staring at a blank canvas. Each is built from the same pure ops the UI uses,
// so the examples can never drift from the domain model. The store's `openDoc`
// gives each a fresh id + timestamps when loaded.
//
// This file holds the *structure* — which nodes exist, how they split, and the
// numbers, priorities and evidence they carry. The words come from the caller's
// catalogue (`content.examples`), so an example seeds a document in the reader's
// language; the builders stay pure and take `CoreMessages` as a parameter.
import type { CoreMessages } from '@/i18n/types';
import { createDoc, createEvidence } from './factory';
import { recomputeMece } from './mece';
import {
  addChild,
  addEvidence,
  setDecomposition,
  setDetail,
  setNodeValue,
  setOperator,
  setPriority,
  setStatus,
} from './tree';
import type {
  DecompositionType,
  EvidenceStrength,
  FormulaOperator,
  IssueTreeDoc,
  Level,
  NodeId,
  NodeStatus,
  NumericValue,
} from './types';

// Examples are timeless; `openDoc` re-stamps createdAt/updatedAt on load.
const EPOCH = 0;

/** One node's seeded words — its label, plus the note/evidence it teaches with. */
interface ExampleNodeContent {
  label: string;
  detail?: string;
  /** Summary of the single piece of evidence this node carries, if any. */
  evidence?: string;
}

/** Every word one example seeds: the picker's card copy, then the node text. */
export interface ExampleContent {
  /** Card title in the "Examples" picker. */
  name: string;
  /** One-line subtitle for the card. */
  blurb: string;
  /** Node text, keyed by the slot the builder places it in. */
  nodes: Record<string, ExampleNodeContent>;
}

/** The library's ids. Adding one forces the catalogue to give it words. */
export type ExampleId =
  | 'profit'
  | 'churn'
  | 'decision'
  | 'market-entry'
  | 'acquisition'
  | 'pricing'
  | 'market-sizing'
  | 'sourcing'
  | 'revenue-drivers';

interface NodeOpts {
  value?: NumericValue;
  impact?: Level;
  ease?: Level;
  status?: NodeStatus;
}

/** A tiny imperative builder over the pure tree ops, for writing examples readably. */
class TreeBuilder {
  doc: IssueTreeDoc;

  constructor(root: ExampleNodeContent, rootOpts: NodeOpts = {}) {
    this.doc = createDoc(root.label, EPOCH);
    this.apply(this.doc.rootId, root, rootOpts);
  }

  get rootId(): NodeId {
    return this.doc.rootId;
  }

  private apply(id: NodeId, content: ExampleNodeContent, opts: NodeOpts): void {
    if (opts.value) this.doc = setNodeValue(this.doc, id, opts.value);
    if (opts.impact && opts.ease)
      this.doc = setPriority(this.doc, id, { impact: opts.impact, ease: opts.ease });
    if (opts.status) this.doc = setStatus(this.doc, id, opts.status);
    if (content.detail) this.doc = setDetail(this.doc, id, content.detail);
  }

  /** Add a child issue to `parentId` and return its id. */
  child(parentId: NodeId, content: ExampleNodeContent, opts: NodeOpts = {}): NodeId {
    const { doc, childId } = addChild(this.doc, parentId, content.label);
    this.doc = doc;
    this.apply(childId, content, opts);
    return childId;
  }

  /** Set how `parentId` decomposes (call after its children exist). */
  decompose(parentId: NodeId, type: DecompositionType, operator?: FormulaOperator): void {
    this.doc = setDecomposition(this.doc, parentId, type);
    if (operator) this.doc = setOperator(this.doc, parentId, operator);
  }

  /** Attach a piece of evidence to a node. */
  evidence(
    id: NodeId,
    summary: string,
    supports: boolean,
    strength: EvidenceStrength = 'indicative'
  ): void {
    this.doc = addEvidence(this.doc, id, createEvidence(summary, supports, strength));
  }

  build(): IssueTreeDoc {
    return recomputeMece(this.doc);
  }
}

/**
 * A value-driver tree: a metric decomposed into formula splits whose children
 * provably reconcile (revenue − costs; price × volume; fixed + variable).
 */
function profitTree(m: CoreMessages): IssueTreeDoc {
  const n = m.content.examples.profit.nodes;
  const b = new TreeBuilder(n.root, { value: { amount: 30, unit: 'M DKK' } });

  const revenue = b.child(b.rootId, n.revenue, { value: { amount: 100, unit: 'M DKK' } });
  const costs = b.child(b.rootId, n.costs, { value: { amount: 70, unit: 'M DKK' } });
  b.decompose(b.rootId, 'formula', 'difference');

  b.child(revenue, n.price, { value: { amount: 0.5, unit: 'k DKK' } });
  b.child(revenue, n.units, {
    value: { amount: 200, unit: 'k units' },
    impact: 'high',
    ease: 'medium',
  });
  b.decompose(revenue, 'formula', 'product');

  b.child(costs, n.fixedCosts, { value: { amount: 30, unit: 'M DKK' } });
  b.child(costs, n.variableCosts, { value: { amount: 40, unit: 'M DKK' } });
  b.decompose(costs, 'formula', 'sum');

  return b.build();
}

/**
 * A classic issue tree: a question segmented into a collectively-exhaustive set
 * (note the explicit "Other" bucket), with hypotheses, statuses, and evidence.
 */
function churnTree(m: CoreMessages): IssueTreeDoc {
  const n = m.content.examples.churn.nodes;
  const b = new TreeBuilder(n.root);

  const early = b.child(b.rootId, n.early, {
    status: 'supported',
    impact: 'high',
    ease: 'high',
  });
  b.child(b.rootId, n.powerUsers, { status: 'open' });
  b.child(b.rootId, n.dormant, { status: 'parked' });
  b.child(b.rootId, n.other, { status: 'open' });
  b.decompose(b.rootId, 'segment');
  b.evidence(early, n.early.evidence, true, 'strong');

  b.child(early, n.onboarding, { status: 'open' });
  b.child(early, n.slowValue, { status: 'open' });
  b.decompose(early, 'freeform');

  return b.build();
}

/**
 * A decision frame: a binary (provably MECE) split, with the "yes" branch tested
 * against a desirability / viability / feasibility framework.
 */
function decisionTree(m: CoreMessages): IssueTreeDoc {
  const n = m.content.examples.decision.nodes;
  const b = new TreeBuilder(n.root);

  const yes = b.child(b.rootId, n.yes, { status: 'open' });
  const no = b.child(b.rootId, n.no, { status: 'open' });
  b.decompose(b.rootId, 'binary');

  b.child(yes, n.desirable, { status: 'supported' });
  b.child(yes, n.viable, { status: 'open' });
  b.child(yes, n.feasible, { status: 'supported' });
  b.decompose(yes, 'framework');

  b.child(no, n.focus, { status: 'open' });
  b.decompose(no, 'freeform');

  return b.build();
}

/**
 * A market-entry decision as four logical gates — each must hold for entry to
 * make sense. A `framework` split: useful, but not guaranteed MECE.
 */
function marketEntryTree(m: CoreMessages): IssueTreeDoc {
  const n = m.content.examples['market-entry'].nodes;
  const b = new TreeBuilder(n.root);

  const attractive = b.child(b.rootId, n.attractive, {
    impact: 'high',
    ease: 'medium',
  });
  b.child(b.rootId, n.competition);
  b.child(b.rootId, n.capabilities);
  b.child(b.rootId, n.profitable);
  b.decompose(b.rootId, 'framework');

  b.child(attractive, n.size);
  b.child(attractive, n.margins);
  b.child(attractive, n.barriers);
  b.decompose(attractive, 'framework');

  return b.build();
}

/**
 * A fully worked M&A tree (the "Chicken Express" case): most branches are
 * qualitative framework checks, but the synergies branch is a provable formula
 * split whose numbers must clear the deal's profit goal.
 */
function acquisitionTree(m: CoreMessages): IssueTreeDoc {
  const n = m.content.examples.acquisition.nodes;
  const b = new TreeBuilder(n.root);

  b.child(b.rootId, n.market);
  const target = b.child(b.rootId, n.target, {
    status: 'supported',
    impact: 'high',
    ease: 'medium',
  });
  const synergies = b.child(b.rootId, n.synergies, { value: { amount: 225, unit: 'M$' } });
  b.child(b.rootId, n.financials);
  b.child(b.rootId, n.integration);
  b.decompose(b.rootId, 'framework');

  b.evidence(target, n.target.evidence, true, 'strong');

  b.child(synergies, n.revenueSynergies, { value: { amount: 175, unit: 'M$' } });
  b.child(synergies, n.costSynergies, { value: { amount: 50, unit: 'M$' } });
  b.decompose(synergies, 'formula', 'sum'); // 175 + 50 = 225 ≥ the 200 goal

  return b.build();
}

/**
 * A pricing decision triangulated from three reference points — the cost floor,
 * the value ceiling, and where competitors sit. A `framework` split.
 */
function pricingTree(m: CoreMessages): IssueTreeDoc {
  const n = m.content.examples.pricing.nodes;
  const b = new TreeBuilder(n.root);

  const floor = b.child(b.rootId, n.floor);
  b.child(b.rootId, n.ceiling);
  b.child(b.rootId, n.anchor);
  b.decompose(b.rootId, 'framework');

  b.child(floor, n.unitCost);
  b.child(floor, n.targetMargin);
  b.decompose(floor, 'freeform');

  return b.build();
}

/**
 * A top-down market-sizing tree: start from the population and narrow with
 * formula splits, so every level provably reconciles.
 */
function marketSizingTree(m: CoreMessages): IssueTreeDoc {
  const n = m.content.examples['market-sizing'].nodes;
  const b = new TreeBuilder(n.root, { value: { amount: 600, unit: 'M DKK' } });

  const drinkers = b.child(b.rootId, n.drinkers, { value: { amount: 300, unit: 'k people' } });
  b.child(b.rootId, n.spendEach, { value: { amount: 2, unit: 'k DKK' } });
  b.decompose(b.rootId, 'formula', 'product'); // 300k × 2k DKK = 600 M DKK

  b.child(drinkers, n.population, { value: { amount: 600, unit: 'k people' } });
  b.child(drinkers, n.share, { value: { amount: 0.5 } });
  b.decompose(drinkers, 'formula', 'product'); // 600k × 0.5 = 300k

  return b.build();
}

/**
 * A build / buy / partner sourcing decision — three named options weighed on the
 * same trade-offs. A `framework` split, not a provable partition.
 */
function sourcingTree(m: CoreMessages): IssueTreeDoc {
  const n = m.content.examples.sourcing.nodes;
  const b = new TreeBuilder(n.root);

  b.child(b.rootId, n.build);
  b.child(b.rootId, n.partner);
  b.child(b.rootId, n.buy);
  b.decompose(b.rootId, 'framework');

  return b.build();
}

/**
 * A revenue value-driver tree: revenue = customers × revenue-per-customer, each
 * split provably reconciling. Complements the profit tree by decomposing the top
 * line by customers rather than price × volume.
 */
function revenueDriverTree(m: CoreMessages): IssueTreeDoc {
  const n = m.content.examples['revenue-drivers'].nodes;
  const b = new TreeBuilder(n.root, { value: { amount: 2400, unit: 'M DKK' } });

  const customers = b.child(b.rootId, n.customers, { value: { amount: 120, unit: 'k' } });
  const perCustomer = b.child(b.rootId, n.perCustomer, {
    value: { amount: 20, unit: 'k DKK' },
    impact: 'high',
    ease: 'medium',
  });
  b.decompose(b.rootId, 'formula', 'product'); // 120k × 20k DKK = 2400 M DKK

  b.child(customers, n.newCustomers, { value: { amount: 30, unit: 'k' } });
  b.child(customers, n.returningCustomers, { value: { amount: 90, unit: 'k' } });
  b.decompose(customers, 'formula', 'sum'); // 30 + 90 = 120

  b.child(perCustomer, n.orders, { value: { amount: 4 } });
  b.child(perCustomer, n.orderValue, { value: { amount: 5, unit: 'k DKK' } });
  b.decompose(perCustomer, 'formula', 'product'); // 4 × 5 = 20

  return b.build();
}

export interface ExampleTree {
  id: ExampleId;
  build: (m: CoreMessages) => IssueTreeDoc;
}

/** Ready-made trees offered in the header's "Examples" picker. */
export const EXAMPLE_TREES: ExampleTree[] = [
  { id: 'profit', build: profitTree },
  { id: 'churn', build: churnTree },
  { id: 'decision', build: decisionTree },
  { id: 'market-entry', build: marketEntryTree },
  { id: 'acquisition', build: acquisitionTree },
  { id: 'pricing', build: pricingTree },
  { id: 'market-sizing', build: marketSizingTree },
  { id: 'sourcing', build: sourcingTree },
  { id: 'revenue-drivers', build: revenueDriverTree },
];
