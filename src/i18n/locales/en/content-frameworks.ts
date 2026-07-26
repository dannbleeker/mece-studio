/**
 * English wording for the named-framework library (`domain/frameworks.ts`).
 *
 * Seeded content, not chrome: the moment a card is clicked, `root` and
 * `children` are frozen into the new document as ordinary user text. Only `name`
 * and `blurb` stay chrome — they are the card's copy on the Templates page.
 *
 * The registry stays in the domain (which frameworks exist, in what order, and
 * how each one splits); this file holds only the words. Keying by `FrameworkId`
 * means a framework added to the registry with no wording here is a typecheck
 * failure rather than a blank card.
 */
import type { FrameworkContent, FrameworkId } from '@/domain/frameworks';

/*
 * Declared here and exported at the bottom on purpose: the catalogue key scanner
 * (`scripts/check-i18n.mjs`) reads `export const x = {` in this directory as a
 * *namespace root*. These words are not a namespace — they hang under
 * `content.frameworks`, which `content.ts` already registers, exactly like the
 * per-enum records in `enums.ts`.
 */
const frameworks: Record<FrameworkId, FrameworkContent> = {
  // ── Marketing ──────────────────────────────────────────────────────────
  '4ps': {
    name: 'Marketing mix — 4Ps',
    blurb: 'The classic supply-side marketing mix (McCarthy).',
    root: 'Marketing mix',
    children: ['Product', 'Price', 'Place', 'Promotion'],
  },
  '4cs-lauterborn': {
    name: 'Marketing mix — Lauterborn 4Cs',
    blurb: 'The customer-centric reframe of the 4Ps.',
    root: 'Marketing mix (customer view)',
    children: ['Consumer wants & needs', 'Cost to satisfy', 'Convenience to buy', 'Communication'],
  },
  // ── Strategy / industry ────────────────────────────────────────────────
  '3cs': {
    name: 'Strategic 3Cs (Ohmae)',
    blurb: 'The strategic triangle — Company, Customers, Competitors.',
    root: 'Strategic situation',
    children: ['Company', 'Customers', 'Competitors'],
  },
  'five-forces': {
    name: "Porter's Five Forces",
    blurb: 'Industry attractiveness across five competitive forces.',
    root: 'Industry attractiveness',
    children: [
      'Competitive rivalry',
      'New entrants',
      'Substitute products',
      'Supplier power',
      'Buyer power',
    ],
  },
  pestel: {
    name: 'PESTEL',
    blurb: 'Scan the macro-environment across six factors.',
    root: 'Macro-environment',
    children: ['Political', 'Economic', 'Social', 'Technological', 'Environmental', 'Legal'],
  },
  swot: {
    name: 'SWOT analysis',
    blurb: 'A discussion starter — deliberately not exhaustive.',
    root: 'SWOT analysis',
    children: ['Strengths', 'Weaknesses', 'Opportunities', 'Threats'],
  },
  bcg: {
    name: 'BCG growth–share matrix',
    blurb: 'Sort a portfolio by market growth and relative share.',
    root: 'Portfolio review',
    children: ['Stars', 'Cash cows', 'Question marks', 'Dogs'],
  },
  ansoff: {
    name: 'Ansoff growth matrix',
    blurb: 'Four growth paths across product × market newness.',
    root: 'Growth options',
    children: [
      'Market penetration',
      'Product development',
      'Market development',
      'Diversification',
    ],
  },
  // ── Organisation ───────────────────────────────────────────────────────
  '7s': {
    name: 'McKinsey 7S',
    blurb: 'Seven interdependent levers of organisational alignment.',
    root: 'Organisational alignment',
    children: ['Strategy', 'Structure', 'Systems', 'Shared values', 'Style', 'Staff', 'Skills'],
  },
  // ── Growth / diagnosis ─────────────────────────────────────────────────
  aarrr: {
    name: 'AARRR pirate-metrics funnel',
    blurb: 'Find the growth bottleneck across the user lifecycle.',
    root: 'Growth funnel',
    children: ['Acquisition', 'Activation', 'Retention', 'Referral', 'Revenue'],
  },
  'fishbone-6m': {
    name: 'Fishbone (Ishikawa) — 6 Ms',
    blurb: 'Cause categories for exhaustive root-cause brainstorming.',
    root: 'Why did the problem happen?',
    children: ['Manpower', 'Machine', 'Material', 'Method', 'Measurement', 'Mother Nature'],
  },
};

export { frameworks };
