// A library of named strategy / marketing / diagnosis frameworks, offered as
// one-click starter trees. Each is a single split whose children are the
// framework's canonical components — the user opens it, renames the root to
// their situation, and fills in the branches.
//
// HONESTY NOTE: almost none of these are provably MECE. They organise thinking
// but have documented overlaps and gaps (Porter built Five Forces *because* he
// found SWOT lacking; PESTEL's Political/Legal overlap; Ansoff's "new" is a
// continuum). That's why they all map to the non-provable `framework` (or
// `process` for the AARRR funnel) decomposition type — the MECE engine reports
// "exclusivity isn't auto-checked for this split type" rather than a false
// guarantee. The card copy says as much.
import { createDoc } from './factory';
import { recomputeMece } from './mece';
import { addChild } from './tree';
import type { DecompositionType, IssueTreeDoc } from './types';

// Templates are timeless; `openDoc` re-stamps createdAt/updatedAt on load.
const EPOCH = 0;

export interface FrameworkTemplate {
  id: string;
  /** Card title — carries the author/era where a name is ambiguous (4Cs, 3Cs). */
  name: string;
  /** One-line subtitle for the card. */
  blurb: string;
  /** How the root splits — `framework` for named lenses, `process` for funnels. */
  decomposition: DecompositionType;
  /** Starter root label (the framework's subject); the user renames it. */
  root: string;
  /** Canonical child labels, in their conventional order. */
  children: string[];
}

/** Inflate a framework template into a fresh single-split tree. */
export function buildFrameworkTree(t: FrameworkTemplate): IssueTreeDoc {
  let doc = createDoc(t.root, EPOCH);
  // The first addChild creates the split with `t.decomposition`; the rest append.
  for (const label of t.children) {
    doc = addChild(doc, doc.rootId, label, t.decomposition).doc;
  }
  return recomputeMece(doc);
}

/**
 * The named-framework library, surfaced on the Templates page. Adding an entry
 * here makes a card appear with no other edits (registry-driven).
 */
export const FRAMEWORK_TEMPLATES: FrameworkTemplate[] = [
  // ── Marketing ──────────────────────────────────────────────────────────
  {
    id: '4ps',
    name: 'Marketing mix — 4Ps',
    blurb: 'The classic supply-side marketing mix (McCarthy).',
    decomposition: 'framework',
    root: 'Marketing mix',
    children: ['Product', 'Price', 'Place', 'Promotion'],
  },
  {
    id: '4cs-lauterborn',
    name: 'Marketing mix — Lauterborn 4Cs',
    blurb: 'The customer-centric reframe of the 4Ps.',
    decomposition: 'framework',
    root: 'Marketing mix (customer view)',
    children: ['Consumer wants & needs', 'Cost to satisfy', 'Convenience to buy', 'Communication'],
  },
  // ── Strategy / industry ────────────────────────────────────────────────
  {
    id: '3cs',
    name: 'Strategic 3Cs (Ohmae)',
    blurb: 'The strategic triangle — Company, Customers, Competitors.',
    decomposition: 'framework',
    root: 'Strategic situation',
    children: ['Company', 'Customers', 'Competitors'],
  },
  {
    id: 'five-forces',
    name: "Porter's Five Forces",
    blurb: 'Industry attractiveness across five competitive forces.',
    decomposition: 'framework',
    root: 'Industry attractiveness',
    children: [
      'Competitive rivalry',
      'New entrants',
      'Substitute products',
      'Supplier power',
      'Buyer power',
    ],
  },
  {
    id: 'pestel',
    name: 'PESTEL',
    blurb: 'Scan the macro-environment across six factors.',
    decomposition: 'framework',
    root: 'Macro-environment',
    children: ['Political', 'Economic', 'Social', 'Technological', 'Environmental', 'Legal'],
  },
  {
    id: 'swot',
    name: 'SWOT analysis',
    blurb: 'A discussion starter — deliberately not exhaustive.',
    decomposition: 'framework',
    root: 'SWOT analysis',
    children: ['Strengths', 'Weaknesses', 'Opportunities', 'Threats'],
  },
  {
    id: 'bcg',
    name: 'BCG growth–share matrix',
    blurb: 'Sort a portfolio by market growth and relative share.',
    decomposition: 'framework',
    root: 'Portfolio review',
    children: ['Stars', 'Cash cows', 'Question marks', 'Dogs'],
  },
  {
    id: 'ansoff',
    name: 'Ansoff growth matrix',
    blurb: 'Four growth paths across product × market newness.',
    decomposition: 'framework',
    root: 'Growth options',
    children: [
      'Market penetration',
      'Product development',
      'Market development',
      'Diversification',
    ],
  },
  // ── Organisation ───────────────────────────────────────────────────────
  {
    id: '7s',
    name: 'McKinsey 7S',
    blurb: 'Seven interdependent levers of organisational alignment.',
    decomposition: 'framework',
    root: 'Organisational alignment',
    children: ['Strategy', 'Structure', 'Systems', 'Shared values', 'Style', 'Staff', 'Skills'],
  },
  // ── Growth / diagnosis ─────────────────────────────────────────────────
  {
    id: 'aarrr',
    name: 'AARRR pirate-metrics funnel',
    blurb: 'Find the growth bottleneck across the user lifecycle.',
    decomposition: 'process',
    root: 'Growth funnel',
    children: ['Acquisition', 'Activation', 'Retention', 'Referral', 'Revenue'],
  },
  {
    id: 'fishbone-6m',
    name: 'Fishbone (Ishikawa) — 6 Ms',
    blurb: 'Cause categories for exhaustive root-cause brainstorming.',
    decomposition: 'framework',
    root: 'Why did the problem happen?',
    children: ['Manpower', 'Machine', 'Material', 'Method', 'Measurement', 'Mother Nature'],
  },
];
