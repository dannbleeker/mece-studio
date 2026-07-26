/**
 * English wording for the MECE rule engine's findings.
 *
 * Typed as `MessagesOf<MeceParams>`, so this object must cover every code the
 * domain can emit — no more, no less — and each render function's params are
 * checked against the domain's declaration. Adding a rule without wording (or
 * wording without a rule) fails typecheck.
 */
import type { MeceParams, MessagesOf } from '@/domain/messages';
import { num, pct, plur, quote } from './_locale';

export const mece: MessagesOf<MeceParams> = {
  'mece.exclusive.default': 'Siblings may overlap.',
  'mece.exclusive.noObviousOverlap':
    "No obvious overlap — but exclusivity isn't auto-checked for this split type.",
  'mece.exclusive.siblingOverlap': ({ a, b, token, more }) =>
    `${quote(a)} and ${quote(b)} may overlap (both mention ${quote(token)})` +
    `${more > 0 ? ` (+${num(more)} more)` : ''}.`,
  'mece.exclusive.mixedAxis': ({ axes }) =>
    `These branches mix decomposition axes (${axes.map(quote).join(', ')}) — ` +
    `cut the level on one axis so the branches don't overlap.`,
  'mece.exclusive.binaryClean': 'A / not-A cannot overlap.',
  'mece.exclusive.binaryNeedsTwo': 'A binary split should have exactly two branches (A / not-A).',
  'mece.exclusive.formulaClean': 'Formula terms are mutually exclusive.',
  'mece.exclusive.formulaRunningTotal': ({ label }) =>
    `${quote(label)} reads like a running total — summing it double-counts the other terms.`,
  'mece.exclusive.formulaDuplicateTerm': ({ label }) =>
    `Two terms share the label ${quote(label)} — a summed term looks double-counted.`,
  'mece.exclusive.deductive':
    'Deductive argument — the steps build to the conclusion, not a partition to keep exclusive.',

  'mece.exhaustive.default': 'Children may not cover the parent.',
  'mece.exhaustive.tooFewChildren': ({ min }) =>
    `A decomposition needs at least ${num(min)} ${plur(min, {
      one: 'sub-issue',
      other: 'sub-issues',
    })}.`,
  'mece.exhaustive.segmentHasOther':
    'The "Other" bucket makes the segments collectively exhaustive.',
  'mece.exhaustive.segmentNeedsOther':
    'Segments rarely cover everything — add an "Other / remaining" bucket.',
  'mece.exhaustive.formulaNeedsValues':
    'Add a number to the parent and each child to check the totals reconcile.',
  'mece.exhaustive.formulaReconciles': ({ combined }) =>
    `Children reconcile to the parent (${num(combined)}).`,
  'mece.exhaustive.formulaOff': ({ combined, parent, relative }) =>
    `Children combine to ${num(combined)} vs parent ${num(parent)} — off by ${pct(relative)}.`,
  'mece.exhaustive.formulaMixedUnits': ({ units }) =>
    `These terms are added up but carry different units (${units.map(quote).join(', ')}) — ` +
    `put them in one unit before the total means anything.`,
  'mece.exhaustive.binaryNeedsTwo': 'A binary split should have exactly two branches (A / not-A).',
  'mece.exhaustive.binaryClean': 'A / not-A covers every case.',
  'mece.exhaustive.processEndToEnd':
    'Do the stages run end to end — nothing before the first or after the last, no steps skipped?',
  'mece.exhaustive.frameworkNotPartition':
    "A framework organises thinking but isn't a provable partition — confirm nothing important sits outside these categories.",
  'mece.exhaustive.freeformUnchecked':
    "Freeform splits aren't auto-checked for gaps — confirm these branches cover the whole question.",
  'mece.exhaustive.deductive':
    'Deductive chain — check each step follows from the one before, and the premises lead to the conclusion.',
};
