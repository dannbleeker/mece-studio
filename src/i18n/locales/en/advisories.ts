/**
 * English wording for the coaching advisories.
 *
 * Same contract as `mece.ts`: typed as `MessagesOf<AdvisoryParams>`, so the
 * catalogue and the lints can't drift apart. Note how `hypothesis` and
 * `treeMode.direction` render raw enum members through `enums` — that is the
 * whole point of passing them raw rather than pre-worded.
 */
import type { AdvisoryParams, MessagesOf } from '@/domain/messages';
import { num, plur, quote } from './_locale';
import { enums } from './enums';

export const advisories: MessagesOf<AdvisoryParams> = {
  'advisory.wholeSentence': ({ label }) =>
    `${quote(label)} is a topic, not an idea — phrase it as a question, action, or hypothesis.`,
  'advisory.branchCount': ({ count, ideal }) =>
    `${num(count)} ${plur(count, { one: 'sub-issue', other: 'sub-issues' })} reads as a ` +
    `laundry list — group toward ${num(ideal)} or fewer.`,
  'advisory.altitude': ({ label }) =>
    `${quote(label)} is far more specific than its siblings — level the branches to one altitude.`,
  'advisory.hypothesis': ({ status }) =>
    `Marked ${enums.status[status]}, but phrased as a question — state the hypothesis as a claim to prove.`,
  'advisory.keyQuestion.notQuestion':
    'Frame the key question as a question (how / why / what / should …).',
  'advisory.keyQuestion.compound':
    'This bundles more than one question — narrow to a single key question (run a second tree for the other).',
  'advisory.keyQuestion.length':
    'Tighten the key question to a sentence or two so it stays memorable.',
  'advisory.treeMode.process':
    'A "how" tree shows alternative solutions, not a sequence — a process split reads as steps, not options.',
  'advisory.treeMode.direction': ({ opposite, mode }) =>
    `This branch asks ${quote(enums.treeMode[opposite])}, but the tree is a ` +
    `${quote(enums.treeMode[mode])} tree — keep one direction.`,
};
