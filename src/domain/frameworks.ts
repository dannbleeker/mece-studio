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
//
// This file holds the registry — which frameworks exist, in what order, and how
// each one splits. Their words (card copy, root label, canonical branches) come
// from the caller's catalogue, keyed by id, so a starter tree seeds in the
// reader's language while this module stays pure.
import type { Messages } from '@/i18n/types';
import { createDoc } from './factory';
import { recomputeMece } from './mece';
import { addChild } from './tree';
import type { DecompositionType, IssueTreeDoc } from './types';

// Templates are timeless; `openDoc` re-stamps createdAt/updatedAt on load.
const EPOCH = 0;

/** The library's ids. Adding one forces the catalogue to give it words. */
export type FrameworkId =
  | '4ps'
  | '4cs-lauterborn'
  | '3cs'
  | 'five-forces'
  | 'pestel'
  | 'swot'
  | 'bcg'
  | 'ansoff'
  | '7s'
  | 'aarrr'
  | 'fishbone-6m';

/** Every word one framework seeds: the card's copy, then the tree it starts. */
export interface FrameworkContent {
  /** Card title — carries the author/era where a name is ambiguous (4Cs, 3Cs). */
  name: string;
  /** One-line subtitle for the card. */
  blurb: string;
  /** Starter root label (the framework's subject); the user renames it. */
  root: string;
  /** Canonical child labels, in their conventional order. */
  children: readonly string[];
}

export interface FrameworkTemplate {
  id: FrameworkId;
  /** How the root splits — `framework` for named lenses, `process` for funnels. */
  decomposition: DecompositionType;
}

/** Inflate a framework template into a fresh single-split tree. */
export function buildFrameworkTree(t: FrameworkTemplate, m: Messages): IssueTreeDoc {
  const content = m.content.frameworks[t.id];
  let doc = createDoc(content.root, EPOCH);
  // The first addChild creates the split with `t.decomposition`; the rest append.
  for (const label of content.children) {
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
  { id: '4ps', decomposition: 'framework' },
  { id: '4cs-lauterborn', decomposition: 'framework' },
  // ── Strategy / industry ────────────────────────────────────────────────
  { id: '3cs', decomposition: 'framework' },
  { id: 'five-forces', decomposition: 'framework' },
  { id: 'pestel', decomposition: 'framework' },
  { id: 'swot', decomposition: 'framework' },
  { id: 'bcg', decomposition: 'framework' },
  { id: 'ansoff', decomposition: 'framework' },
  // ── Organisation ───────────────────────────────────────────────────────
  { id: '7s', decomposition: 'framework' },
  // ── Growth / diagnosis ─────────────────────────────────────────────────
  { id: 'aarrr', decomposition: 'process' },
  { id: 'fishbone-6m', decomposition: 'framework' },
];
