/** English wording for the doc-level Problem brief (the "Problem Identity Card"). */
import type { ProblemBrief, TreeMode } from '@/domain/types';

/**
 * One label + hint per brief field, keyed by the field it fills. Keyed by field
 * name rather than by its English words so a translator can see the structure —
 * and so a renamed label can never drift from the input it belongs to.
 */
const fields: Record<keyof ProblemBrief, { label: string; hint: string }> = {
  situation: {
    label: 'Situation',
    hint: 'The stable, agreed context — only the relevant key facts.',
  },
  complication: {
    label: 'Complication',
    hint: 'What changed or is under threat — why act now.',
  },
  owner: {
    label: 'Owner',
    hint: 'Who owns the problem.',
  },
  decisionMakers: {
    label: 'Decision-makers',
    hint: 'Who is involved in making the decision.',
  },
  successCriteria: {
    label: 'Success criteria',
    hint: 'How a solution will be judged good.',
  },
  inScope: {
    label: 'In scope',
    hint: 'Deliverables / questions inside the boundary.',
  },
  outOfScope: {
    label: 'Out of scope',
    hint: 'What you decide upfront NOT to tackle.',
  },
  desiredOutcome: {
    label: 'Desired outcome',
    hint: 'What should be true at the end of the project.',
  },
};

/**
 * Button text for the why/how picker. `none` is the "no type set" choice —
 * a dash in English, but a locale is free to give it a word.
 */
const treeTypeOption: Record<TreeMode | 'none', string> = {
  none: '—',
  why: 'Why (diagnostic)',
  how: 'How (prescriptive)',
};

export const brief = {
  /** The dialog shell. */
  title: 'Problem brief',
  subtitle:
    'Frame the problem before the tree — situation, complication, and scope. Optional; it leads the synthesis.',

  /** The key-question recap card at the top. */
  keyQuestionLabel: 'Key question',

  /** The why/how tree-type picker. */
  treeTypeLabel: 'Tree type',
  treeTypeHint:
    'A "why" tree breaks a problem into causes; a "how" tree lays out alternative solutions.',
  treeTypeOption,
  /** Accessible name for a mode button; `mode` is that mode's own word. */
  treeTypeName: ({ mode }: { mode: string }) => `Tree type ${mode}`,
  /** Accessible name for the "no type set" button. */
  treeTypeDefaultName: 'Tree type default',

  /** The brief's own fields. */
  fields,
};
