/** English wording for the MECE review dock and the tree-health chip. */
import { num } from './_locale';

export const review = {
  /** Health chip in the editor header. */
  chipTitle: 'Tree-wide MECE health — open the review panel',
  chipClean: 'MECE clean',
  chipReview: ({ count }: { count: number }) => `${num(count)} to review`,

  /** The dock. */
  panelLabel: 'MECE review',
  title: 'MECE review',
  openCount: ({ count }: { count: number }) => `${num(count)} open`,
  close: 'Close review',
  empty: 'Every split is MECE clean — nothing to review.',
  overlapsHeading: 'Overlaps · not mutually exclusive',
  gapsHeading: 'Gaps · not collectively exhaustive',

  /** A single flagged split's card. */
  locate: 'Locate on canvas',
  reviewLogic: 'Review logic →',
  addOtherBucket: 'Add an “Other” bucket',
  addSubIssue: 'Add a sub-issue',

  /** Inspector tab dot. */
  needsReview: 'Needs a MECE review',
};
