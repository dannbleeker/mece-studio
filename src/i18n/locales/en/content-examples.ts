/**
 * English wording for the ready-made example trees (`domain/examples.ts`).
 *
 * Seeded content, not chrome: opening an example copies every label, note and
 * evidence summary into a fresh document, where it becomes ordinary user text.
 * Only `name` and `blurb` stay chrome — they are the card's copy in the picker.
 *
 * The registry stays in the domain (which examples exist, in what order, how
 * each one splits, and the numbers it carries); this file holds only the words.
 * Keyed by example id, then by the node slot the builder places the text in, so
 * a locale that misses a node fails typecheck rather than rendering a blank box.
 */
import type { ExampleContent, ExampleId } from '@/domain/examples';

/*
 * Declared here and exported at the bottom on purpose: the catalogue key scanner
 * (`scripts/check-i18n.mjs`) reads `export const x = {` in this directory as a
 * *namespace root*. These words are not a namespace — they hang under
 * `content.examples`, which `content.ts` already registers, exactly like the
 * per-enum records in `enums.ts`.
 */
const examples = {
  /** Formula splits that reconcile: profit = revenue − costs. */
  profit: {
    name: 'Operating profit — value-driver tree',
    blurb: 'Formula splits that provably reconcile (revenue − costs).',
    nodes: {
      root: {
        label: 'Why is operating profit falling?',
        detail:
          'A value-driver tree: the metric splits into formula branches whose numbers must reconcile, so every MECE check here is *provable*. Edit a leaf number and watch the checks react.',
      },
      revenue: { label: 'Revenue' },
      costs: { label: 'Costs' },
      price: { label: 'Price per item' },
      units: {
        label: 'Units sold',
        detail:
          'Volume is the swing driver — a 10% move here moves profit most (see the inspector).',
      },
      fixedCosts: { label: 'Fixed costs' },
      variableCosts: { label: 'Variable costs' },
    },
  },

  /** A segmented issue tree, made exhaustive by an explicit "Other" bucket. */
  churn: {
    name: 'Customer churn — issue tree',
    blurb: 'Segments with an "Other" bucket, hypotheses, and evidence.',
    nodes: {
      root: {
        label: 'How do we cut customer churn?',
        detail:
          'An issue tree segmented by customer lifecycle. The "Other / remaining" bucket makes the split collectively exhaustive; leaves carry hypotheses, evidence, and priority.',
      },
      early: {
        label: 'First 90 days',
        detail: 'Where most churn happens — and where small onboarding fixes pay off fastest.',
        evidence: '60% of cancellations happen in the first 90 days',
      },
      powerUsers: { label: 'Power users' },
      dormant: {
        label: 'Dormant accounts',
        detail: 'Re-engagement is owned by lifecycle marketing — out of scope for this tree.',
      },
      other: { label: 'Other / remaining' },
      onboarding: { label: 'Onboarding is confusing' },
      slowValue: { label: 'Value is not obvious fast enough' },
    },
  },

  /** A binary decision, with the "yes" branch tested against a framework. */
  decision: {
    name: 'Subscription launch — decision',
    blurb: 'A binary split tested against a framework.',
    nodes: {
      root: {
        label: 'Should we launch a subscription tier?',
        detail:
          'A decision framed as a binary split (A / not-A is provably MECE), with the "yes" branch stress-tested against a desirability / viability / feasibility framework.',
      },
      yes: { label: 'Yes — launch it' },
      no: { label: 'No — hold for now' },
      desirable: {
        label: 'Customers want it',
        detail: 'Survey + sales signal demand for a lighter, recurring option.',
      },
      viable: { label: 'It makes money' },
      feasible: { label: 'We can build it' },
      focus: { label: 'Focus stays on the core product' },
    },
  },

  /** Four gates that must all hold for market entry to pay off. */
  'market-entry': {
    name: 'Market entry — should we enter?',
    blurb: 'Four logical gates: attractive, beatable, capable, profitable.',
    nodes: {
      root: {
        label: 'Should we enter the [target] market?',
        detail:
          'A market-entry decision framed as four logical gates — each must hold for entry to pay off. This is a "framework" split: a useful checklist, not a provable partition, so MECE Studio leaves exclusivity for you to confirm.',
      },
      attractive: { label: 'Is the market attractive?' },
      competition: { label: 'Can we beat the competition?' },
      capabilities: { label: 'Do we have the capabilities to win?' },
      profitable: { label: 'Will entry be profitable?' },
      size: { label: 'Market size & growth' },
      margins: { label: 'Profit margins' },
      barriers: { label: 'Barriers to entry' },
    },
  },

  /** A worked M&A case whose synergies branch is a provable formula split. */
  acquisition: {
    name: 'Acquisition — Chicken Express (M&A)',
    blurb: 'Market, target, synergies (with the math), financials, risk.',
    nodes: {
      root: {
        label: 'Should we acquire Chicken Express?',
        detail:
          'A worked M&A tree. The deal must clear a $200M combined-profit goal. Most branches are qualitative "framework" checks; the synergies branch is a provable formula split — edit the numbers and watch it reconcile against the goal.',
      },
      market: { label: 'Is the market attractive?' },
      target: {
        label: 'Is Chicken Express a strong target?',
        detail: 'A chicken-sandwich chain growing ~8%/yr versus ~3% for the industry.',
        evidence: 'Target grows ~8%/yr vs ~3% industry average',
      },
      synergies: { label: 'Do synergies clear the $200M goal?' },
      financials: { label: 'Do the financials work?' },
      integration: { label: 'Can we manage the integration risk?' },
      revenueSynergies: { label: 'Revenue synergies' },
      costSynergies: { label: 'Cost synergies' },
    },
  },

  /** Three reference points that triangulate a price. */
  pricing: {
    name: 'Pricing — floor, ceiling, anchor',
    blurb: 'Triangulate the cost floor, value ceiling, and competitor price.',
    nodes: {
      root: {
        label: 'How should we price the new product?',
        detail:
          'Triangulate three reference points: the cost floor, the value ceiling, and where competitors sit. A "framework" split — the three lenses inform one another rather than partitioning cleanly.',
      },
      floor: {
        label: 'Cost floor',
        detail: 'The lowest price that still covers unit cost plus a target margin.',
      },
      ceiling: {
        label: 'Value ceiling',
        detail: 'The most a customer will pay for the value delivered.',
      },
      anchor: {
        label: 'Competitive anchor',
        detail: 'What close substitutes already charge.',
      },
      unitCost: { label: 'Unit cost' },
      targetMargin: { label: 'Target margin' },
    },
  },

  /** A top-down estimate narrowed by formula splits. */
  'market-sizing': {
    name: 'Market sizing — top-down',
    blurb: 'Population narrowed by formula splits that reconcile.',
    nodes: {
      root: {
        label: 'How big is the annual market for premium coffee in the city?',
        detail:
          'A top-down estimate: start from the population and narrow with formula splits, so the numbers provably reconcile. Always cross-check with a bottom-up build (outlets × cups/day × price).',
      },
      drinkers: { label: 'Premium-coffee drinkers' },
      spendEach: { label: 'Annual spend each' },
      population: { label: 'City population' },
      share: { label: 'Share drinking premium coffee' },
    },
  },

  /** Build / partner / buy — three named options, one set of trade-offs. */
  sourcing: {
    name: 'Build vs Buy vs Partner',
    blurb: 'Three ways to get a capability, weighed on the trade-offs.',
    nodes: {
      root: {
        label: 'How should we get the [capability] we lack?',
        detail:
          'Three ways to get a capability you lack — weigh each on speed, control, capital, and execution risk. A "framework" split of named options, not a provable partition.',
      },
      build: {
        label: 'Build in-house',
        detail: 'Slowest; most control; capital spread over time; execution risk on us.',
      },
      partner: {
        label: 'Partner (alliance / JV)',
        detail: 'Faster; shared control; low capital; dependency and coordination risk.',
      },
      buy: {
        label: 'Buy (acquire)',
        detail: 'Fastest; full control; high upfront capital; integration risk.',
      },
    },
  },

  /** The top line decomposed by customers rather than by price × volume. */
  'revenue-drivers': {
    name: 'Revenue driver tree',
    blurb: 'Revenue = customers × spend, each split provably reconciling.',
    nodes: {
      root: {
        label: 'What is driving total revenue?',
        detail:
          'A revenue value-driver tree: revenue = customers × revenue-per-customer, every split provably reconciling. Complements the profit tree by decomposing the top line by customers rather than price × volume.',
      },
      customers: { label: 'Number of customers' },
      perCustomer: { label: 'Revenue per customer' },
      newCustomers: { label: 'New customers' },
      returningCustomers: { label: 'Returning customers' },
      orders: { label: 'Orders per year' },
      orderValue: { label: 'Average order value' },
    },
  },
} satisfies Record<ExampleId, ExampleContent>;

export { examples };
