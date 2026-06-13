// A small library of ready-made example trees, so a new user can open a
// well-formed MECE tree and learn the tool by poking at a real one rather than
// staring at a blank canvas. Each is built from the same pure ops the UI uses,
// so the examples can never drift from the domain model. The store's `openDoc`
// gives each a fresh id + timestamps when loaded.
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

interface NodeOpts {
  value?: NumericValue;
  impact?: Level;
  ease?: Level;
  status?: NodeStatus;
  detail?: string;
}

/** A tiny imperative builder over the pure tree ops, for writing examples readably. */
class TreeBuilder {
  doc: IssueTreeDoc;

  constructor(rootQuestion: string, rootOpts: NodeOpts = {}) {
    this.doc = createDoc(rootQuestion, EPOCH);
    this.applyOpts(this.doc.rootId, rootOpts);
  }

  get rootId(): NodeId {
    return this.doc.rootId;
  }

  private applyOpts(id: NodeId, opts: NodeOpts): void {
    if (opts.value) this.doc = setNodeValue(this.doc, id, opts.value);
    if (opts.impact && opts.ease)
      this.doc = setPriority(this.doc, id, { impact: opts.impact, ease: opts.ease });
    if (opts.status) this.doc = setStatus(this.doc, id, opts.status);
    if (opts.detail) this.doc = setDetail(this.doc, id, opts.detail);
  }

  /** Add a child issue to `parentId` and return its id. */
  child(parentId: NodeId, label: string, opts: NodeOpts = {}): NodeId {
    const { doc, childId } = addChild(this.doc, parentId, label);
    this.doc = doc;
    this.applyOpts(childId, opts);
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
function profitTree(): IssueTreeDoc {
  const b = new TreeBuilder('Why is operating profit falling?', {
    value: { amount: 30, unit: 'M DKK' },
    detail:
      'A value-driver tree: the metric splits into formula branches whose numbers must reconcile, so every MECE check here is *provable*. Edit a leaf number and watch the checks react.',
  });

  const revenue = b.child(b.rootId, 'Revenue', { value: { amount: 100, unit: 'M DKK' } });
  const costs = b.child(b.rootId, 'Costs', { value: { amount: 70, unit: 'M DKK' } });
  b.decompose(b.rootId, 'formula', 'difference');

  b.child(revenue, 'Price per item', { value: { amount: 0.5, unit: 'k DKK' } });
  b.child(revenue, 'Units sold', {
    value: { amount: 200, unit: 'k units' },
    impact: 'high',
    ease: 'medium',
    detail: 'Volume is the swing driver — a 10% move here moves profit most (see the inspector).',
  });
  b.decompose(revenue, 'formula', 'product');

  b.child(costs, 'Fixed costs', { value: { amount: 30, unit: 'M DKK' } });
  b.child(costs, 'Variable costs', { value: { amount: 40, unit: 'M DKK' } });
  b.decompose(costs, 'formula', 'sum');

  return b.build();
}

/**
 * A classic issue tree: a question segmented into a collectively-exhaustive set
 * (note the explicit "Other" bucket), with hypotheses, statuses, and evidence.
 */
function churnTree(): IssueTreeDoc {
  const b = new TreeBuilder('How do we cut customer churn?', {
    detail:
      'An issue tree segmented by customer lifecycle. The "Other / remaining" bucket makes the split collectively exhaustive; leaves carry hypotheses, evidence, and priority.',
  });

  const early = b.child(b.rootId, 'First 90 days', {
    status: 'supported',
    impact: 'high',
    ease: 'high',
    detail: 'Where most churn happens — and where small onboarding fixes pay off fastest.',
  });
  b.child(b.rootId, 'Power users', { status: 'open' });
  b.child(b.rootId, 'Dormant accounts', {
    status: 'parked',
    detail: 'Re-engagement is owned by lifecycle marketing — out of scope for this tree.',
  });
  b.child(b.rootId, 'Other / remaining', { status: 'open' });
  b.decompose(b.rootId, 'segment');
  b.evidence(early, '60% of cancellations happen in the first 90 days', true, 'strong');

  b.child(early, 'Onboarding is confusing', { status: 'open' });
  b.child(early, 'Value is not obvious fast enough', { status: 'open' });
  b.decompose(early, 'freeform');

  return b.build();
}

/**
 * A decision frame: a binary (provably MECE) split, with the "yes" branch tested
 * against a desirability / viability / feasibility framework.
 */
function decisionTree(): IssueTreeDoc {
  const b = new TreeBuilder('Should we launch a subscription tier?', {
    detail:
      'A decision framed as a binary split (A / not-A is provably MECE), with the "yes" branch stress-tested against a desirability / viability / feasibility framework.',
  });

  const yes = b.child(b.rootId, 'Yes — launch it', { status: 'open' });
  const no = b.child(b.rootId, 'No — hold for now', { status: 'open' });
  b.decompose(b.rootId, 'binary');

  b.child(yes, 'Customers want it', {
    status: 'supported',
    detail: 'Survey + sales signal demand for a lighter, recurring option.',
  });
  b.child(yes, 'It makes money', { status: 'open' });
  b.child(yes, 'We can build it', { status: 'supported' });
  b.decompose(yes, 'framework');

  b.child(no, 'Focus stays on the core product', { status: 'open' });
  b.decompose(no, 'freeform');

  return b.build();
}

/**
 * A market-entry decision as four logical gates — each must hold for entry to
 * make sense. A `framework` split: useful, but not guaranteed MECE.
 */
function marketEntryTree(): IssueTreeDoc {
  const b = new TreeBuilder('Should we enter the [target] market?', {
    detail:
      'A market-entry decision framed as four logical gates — each must hold for entry to pay off. This is a "framework" split: a useful checklist, not a provable partition, so MECE Studio leaves exclusivity for you to confirm.',
  });

  const attractive = b.child(b.rootId, 'Is the market attractive?', {
    impact: 'high',
    ease: 'medium',
  });
  b.child(b.rootId, 'Can we beat the competition?');
  b.child(b.rootId, 'Do we have the capabilities to win?');
  b.child(b.rootId, 'Will entry be profitable?');
  b.decompose(b.rootId, 'framework');

  b.child(attractive, 'Market size & growth');
  b.child(attractive, 'Profit margins');
  b.child(attractive, 'Barriers to entry');
  b.decompose(attractive, 'framework');

  return b.build();
}

/**
 * A fully worked M&A tree (the "Chicken Express" case): most branches are
 * qualitative framework checks, but the synergies branch is a provable formula
 * split whose numbers must clear the deal's profit goal.
 */
function acquisitionTree(): IssueTreeDoc {
  const b = new TreeBuilder('Should we acquire Chicken Express?', {
    detail:
      'A worked M&A tree. The deal must clear a $200M combined-profit goal. Most branches are qualitative "framework" checks; the synergies branch is a provable formula split — edit the numbers and watch it reconcile against the goal.',
  });

  b.child(b.rootId, 'Is the market attractive?');
  const target = b.child(b.rootId, 'Is Chicken Express a strong target?', {
    status: 'supported',
    impact: 'high',
    ease: 'medium',
    detail: 'A chicken-sandwich chain growing ~8%/yr versus ~3% for the industry.',
  });
  const synergies = b.child(b.rootId, 'Do synergies clear the $200M goal?', {
    value: { amount: 225, unit: 'M$' },
  });
  b.child(b.rootId, 'Do the financials work?');
  b.child(b.rootId, 'Can we manage the integration risk?');
  b.decompose(b.rootId, 'framework');

  b.evidence(target, 'Target grows ~8%/yr vs ~3% industry average', true, 'strong');

  b.child(synergies, 'Revenue synergies', { value: { amount: 175, unit: 'M$' } });
  b.child(synergies, 'Cost synergies', { value: { amount: 50, unit: 'M$' } });
  b.decompose(synergies, 'formula', 'sum'); // 175 + 50 = 225 ≥ the 200 goal

  return b.build();
}

/**
 * A pricing decision triangulated from three reference points — the cost floor,
 * the value ceiling, and where competitors sit. A `framework` split.
 */
function pricingTree(): IssueTreeDoc {
  const b = new TreeBuilder('How should we price the new product?', {
    detail:
      'Triangulate three reference points: the cost floor, the value ceiling, and where competitors sit. A "framework" split — the three lenses inform one another rather than partitioning cleanly.',
  });

  const floor = b.child(b.rootId, 'Cost floor', {
    detail: 'The lowest price that still covers unit cost plus a target margin.',
  });
  b.child(b.rootId, 'Value ceiling', {
    detail: 'The most a customer will pay for the value delivered.',
  });
  b.child(b.rootId, 'Competitive anchor', {
    detail: 'What close substitutes already charge.',
  });
  b.decompose(b.rootId, 'framework');

  b.child(floor, 'Unit cost');
  b.child(floor, 'Target margin');
  b.decompose(floor, 'freeform');

  return b.build();
}

/**
 * A top-down market-sizing tree: start from the population and narrow with
 * formula splits, so every level provably reconciles.
 */
function marketSizingTree(): IssueTreeDoc {
  const b = new TreeBuilder('How big is the annual market for premium coffee in the city?', {
    value: { amount: 600, unit: 'M DKK' },
    detail:
      'A top-down estimate: start from the population and narrow with formula splits, so the numbers provably reconcile. Always cross-check with a bottom-up build (outlets × cups/day × price).',
  });

  const drinkers = b.child(b.rootId, 'Premium-coffee drinkers', {
    value: { amount: 300, unit: 'k people' },
  });
  b.child(b.rootId, 'Annual spend each', { value: { amount: 2, unit: 'k DKK' } });
  b.decompose(b.rootId, 'formula', 'product'); // 300k × 2k DKK = 600 M DKK

  b.child(drinkers, 'City population', { value: { amount: 600, unit: 'k people' } });
  b.child(drinkers, 'Share drinking premium coffee', { value: { amount: 0.5 } });
  b.decompose(drinkers, 'formula', 'product'); // 600k × 0.5 = 300k

  return b.build();
}

/**
 * A build / buy / partner sourcing decision — three named options weighed on the
 * same trade-offs. A `framework` split, not a provable partition.
 */
function sourcingTree(): IssueTreeDoc {
  const b = new TreeBuilder('How should we get the [capability] we lack?', {
    detail:
      'Three ways to get a capability you lack — weigh each on speed, control, capital, and execution risk. A "framework" split of named options, not a provable partition.',
  });

  b.child(b.rootId, 'Build in-house', {
    detail: 'Slowest; most control; capital spread over time; execution risk on us.',
  });
  b.child(b.rootId, 'Partner (alliance / JV)', {
    detail: 'Faster; shared control; low capital; dependency and coordination risk.',
  });
  b.child(b.rootId, 'Buy (acquire)', {
    detail: 'Fastest; full control; high upfront capital; integration risk.',
  });
  b.decompose(b.rootId, 'framework');

  return b.build();
}

/**
 * A revenue value-driver tree: revenue = customers × revenue-per-customer, each
 * split provably reconciling. Complements the profit tree by decomposing the top
 * line by customers rather than price × volume.
 */
function revenueDriverTree(): IssueTreeDoc {
  const b = new TreeBuilder('What is driving total revenue?', {
    value: { amount: 2400, unit: 'M DKK' },
    detail:
      'A revenue value-driver tree: revenue = customers × revenue-per-customer, every split provably reconciling. Complements the profit tree by decomposing the top line by customers rather than price × volume.',
  });

  const customers = b.child(b.rootId, 'Number of customers', { value: { amount: 120, unit: 'k' } });
  const perCustomer = b.child(b.rootId, 'Revenue per customer', {
    value: { amount: 20, unit: 'k DKK' },
    impact: 'high',
    ease: 'medium',
  });
  b.decompose(b.rootId, 'formula', 'product'); // 120k × 20k DKK = 2400 M DKK

  b.child(customers, 'New customers', { value: { amount: 30, unit: 'k' } });
  b.child(customers, 'Returning customers', { value: { amount: 90, unit: 'k' } });
  b.decompose(customers, 'formula', 'sum'); // 30 + 90 = 120

  b.child(perCustomer, 'Orders per year', { value: { amount: 4 } });
  b.child(perCustomer, 'Average order value', { value: { amount: 5, unit: 'k DKK' } });
  b.decompose(perCustomer, 'formula', 'product'); // 4 × 5 = 20

  return b.build();
}

export interface ExampleTree {
  id: string;
  name: string;
  blurb: string;
  build: () => IssueTreeDoc;
}

/** Ready-made trees offered in the header's "Examples" picker. */
export const EXAMPLE_TREES: ExampleTree[] = [
  {
    id: 'profit',
    name: 'Operating profit — value-driver tree',
    blurb: 'Formula splits that provably reconcile (revenue − costs).',
    build: profitTree,
  },
  {
    id: 'churn',
    name: 'Customer churn — issue tree',
    blurb: 'Segments with an "Other" bucket, hypotheses, and evidence.',
    build: churnTree,
  },
  {
    id: 'decision',
    name: 'Subscription launch — decision',
    blurb: 'A binary split tested against a framework.',
    build: decisionTree,
  },
  {
    id: 'market-entry',
    name: 'Market entry — should we enter?',
    blurb: 'Four logical gates: attractive, beatable, capable, profitable.',
    build: marketEntryTree,
  },
  {
    id: 'acquisition',
    name: 'Acquisition — Chicken Express (M&A)',
    blurb: 'Market, target, synergies (with the math), financials, risk.',
    build: acquisitionTree,
  },
  {
    id: 'pricing',
    name: 'Pricing — floor, ceiling, anchor',
    blurb: 'Triangulate the cost floor, value ceiling, and competitor price.',
    build: pricingTree,
  },
  {
    id: 'market-sizing',
    name: 'Market sizing — top-down',
    blurb: 'Population narrowed by formula splits that reconcile.',
    build: marketSizingTree,
  },
  {
    id: 'sourcing',
    name: 'Build vs Buy vs Partner',
    blurb: 'Three ways to get a capability, weighed on the trade-offs.',
    build: sourcingTree,
  },
  {
    id: 'revenue-drivers',
    name: 'Revenue driver tree',
    blurb: 'Revenue = customers × spend, each split provably reconciling.',
    build: revenueDriverTree,
  },
];
