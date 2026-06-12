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
];
