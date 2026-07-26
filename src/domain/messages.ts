/**
 * The domain's message contract.
 *
 * The rule engine and the advisory lints are pure and language-free: they emit a
 * **code plus raw params**, never prose. The view / export edge renders those
 * into the active locale (`src/i18n`). That keeps `domain/` framework-free — it
 * has no idea a language exists — and means rewording a warning never touches a
 * rule.
 *
 * Both directions are compile-checked:
 * - a code with no catalogue entry fails typecheck (the catalogue is a mapped
 *   type over these keys, see `src/i18n/locales/en/mece.ts`);
 * - a `{ code, params }` whose params don't match its code fails typecheck here.
 *
 * Params carry **raw values** (numbers as numbers, enum members as enum members)
 * so the edge can apply `Intl` formatting and locale-specific wording. Never
 * pre-format a param into a string.
 */

import type { TreeMode } from './types/document';
import type { NodeStatus } from './types/node';

/**
 * Params for each MECE-engine message, keyed by code. `undefined` = takes no
 * params.
 *
 * Codes are grouped `mece.<axis>.<case>`, where axis is `exclusive` (mutually
 * exclusive — no overlap) or `exhaustive` (collectively exhaustive — no gaps).
 */
export interface MeceParams {
  /** Fallback when the engine flags ME but left no message. */
  'mece.exclusive.default': undefined;
  /** Nothing lexically overlaps, but this split type can't be proven exclusive. */
  'mece.exclusive.noObviousOverlap': undefined;
  /** Two siblings share a content word. `more` = additional overlapping pairs. */
  'mece.exclusive.siblingOverlap': { a: string; b: string; token: string; more: number };
  /** Siblings name two or more different decomposition axes ("By region" / "Per quarter"). */
  'mece.exclusive.mixedAxis': { axes: string[] };
  /** A / not-A cannot overlap. */
  'mece.exclusive.binaryClean': undefined;
  /** A binary split has the wrong branch count (either axis). */
  'mece.exclusive.binaryNeedsTwo': undefined;
  /** Formula terms are exclusive by construction (product / difference, or a clean sum). */
  'mece.exclusive.formulaClean': undefined;
  /** A summed term reads like a running total, so it double-counts the others. */
  'mece.exclusive.formulaRunningTotal': { label: string };
  /** Two summed terms share a label. */
  'mece.exclusive.formulaDuplicateTerm': { label: string };
  /** A deductive chain is an argument, not a partition — exclusivity doesn't apply. */
  'mece.exclusive.deductive': undefined;

  /** Fallback when the engine flags CE but left no message. */
  'mece.exhaustive.default': undefined;
  /** Fewer than the minimum sub-issues to count as a decomposition. */
  'mece.exhaustive.tooFewChildren': { min: number };
  /** Segments include an explicit "Other" bucket. */
  'mece.exhaustive.segmentHasOther': undefined;
  /** Segments have no "Other" bucket, so they probably leave a gap. */
  'mece.exhaustive.segmentNeedsOther': undefined;
  /** A formula split can't be reconciled until parent and children carry numbers. */
  'mece.exhaustive.formulaNeedsValues': undefined;
  /** Children reconcile to the parent within tolerance. `combined` is raw. */
  'mece.exhaustive.formulaReconciles': { combined: number };
  /** Children don't reconcile. `relative` is a raw ratio (0.023), not a percentage string. */
  'mece.exhaustive.formulaOff': { combined: number; parent: number; relative: number };
  /** A binary split has the wrong branch count (either axis). */
  'mece.exhaustive.binaryNeedsTwo': undefined;
  /** A / not-A covers every case. */
  'mece.exhaustive.binaryClean': undefined;
  /** Process stages: prompt the end-to-end check we can't prove. */
  'mece.exhaustive.processEndToEnd': undefined;
  /** A named framework organises thinking but isn't a provable partition. */
  'mece.exhaustive.frameworkNotPartition': undefined;
  /** Freeform splits get no automatic gap check. */
  'mece.exhaustive.freeformUnchecked': undefined;
  /** A deductive chain: check each step follows from the one before. */
  'mece.exhaustive.deductive': undefined;
}

/** Params for each coaching advisory, keyed by code. */
export interface AdvisoryParams {
  /** A lone-word freeform branch reads as a topic, not an idea. */
  'advisory.wholeSentence': { label: string };
  /** More branches than reads as a considered grouping. */
  'advisory.branchCount': { count: number; ideal: number };
  /** One sibling is far more specific than the rest. */
  'advisory.altitude': { label: string };
  /** A judged node is still phrased as a question. `status` is raw so the edge localises it. */
  'advisory.hypothesis': { status: NodeStatus };
  /** The key question isn't phrased as a question. */
  'advisory.keyQuestion.notQuestion': undefined;
  /** The key question bundles more than one question. */
  'advisory.keyQuestion.compound': undefined;
  /** The key question is too long to stay memorable. */
  'advisory.keyQuestion.length': undefined;
  /** A "how" tree contains a process split (steps, not alternatives). */
  'advisory.treeMode.process': undefined;
  /** A branch asks the opposite question word to the tree's mode. Both raw. */
  'advisory.treeMode.direction': { opposite: TreeMode; mode: TreeMode };
}

/**
 * A reference to a message: the code, plus params **iff** that code takes any.
 * Codes with `undefined` params are `{ code }` alone — passing params is a type error,
 * and omitting required params is too.
 */
type MessageRefOf<P> = {
  [C in keyof P]: P[C] extends undefined ? { code: C } : { code: C; params: P[C] };
}[keyof P];

/** A rule-engine message reference (what `CheckResult.message` carries). */
export type MeceMessageRef = MessageRefOf<MeceParams>;

/** A coaching-advisory message reference (what `Advisory.message` carries). */
export type AdvisoryMessageRef = MessageRefOf<AdvisoryParams>;

/**
 * The shape a locale catalogue must have for a param map: a plain string for
 * codes that take no params, a render function for codes that do. Used by
 * `src/i18n/locales/*` so a missing, extra, or wrongly-typed entry can't compile.
 */
export type MessagesOf<P> = {
  [C in keyof P]: P[C] extends undefined ? string : (params: P[C]) => string;
};
