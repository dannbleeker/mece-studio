/**
 * English **seeded content** — words that become user data.
 *
 * Distinct from chrome: when the app writes one of these into a document (a
 * starter branch label, an example tree, a framework's canonical components) it
 * is frozen there as ordinary user text. Re-reading the tree later in another
 * language must NOT retranslate it — the user may have edited it, and it is
 * their content now. That is exactly why `IssueTreeDoc.locale` records which
 * language a tree was seeded in.
 *
 * The bulky content libraries live in sibling files so this one stays readable.
 */
import type { DecompositionType } from '@/domain/types';
import { examples } from './content-examples';
import { frameworks } from './content-frameworks';

/**
 * Starter child labels seeded when you decompose a leaf by a given type — the
 * "scaffold". Chosen so the fresh split is already MECE-clean where possible
 * (binary = two branches; segments include an "Other" bucket), which the
 * catalogue test asserts still holds for every locale.
 */
const scaffold: Record<DecompositionType, string[]> = {
  binary: ['A', 'not-A'],
  segment: ['Segment 1', 'Segment 2', 'Other'],
  process: ['Stage 1', 'Stage 2', 'Stage 3'],
  formula: ['Term 1', 'Term 2'],
  framework: ['Component 1', 'Component 2'],
  freeform: ['Sub-issue 1', 'Sub-issue 2'],
};

export const content = {
  scaffold,
  examples,
  frameworks,

  /** The label used when the review dock offers to close a segment gap. */
  otherBucketLabel: 'Other',
  /** The default label for a branch added with no text of its own. */
  newIssueLabel: 'New issue',
  /** The root question a brand-new tree opens with. */
  starterQuestion: 'Why is this happening?',
  /** A new document's stored title. */
  untitledTree: 'Untitled tree',
  /**
   * Currency unit on the money-valued example trees. Seeded content: it is
   * written onto the node and rendered beside the amount, so a locale picks its
   * own (Danish would say 'mio. kr.').
   */
  moneyUnit: 'M DKK',
  /** Root question for an imported outline that names no top-level item. */
  importedOutlineLabel: 'Imported outline',
  /** Shown wherever a node or tree has no name yet. */
  untitled: 'Untitled',
  /** The name given to a duplicated tree — becomes that tree's stored name. */
  copyOfTree: ({ name }: { name: string }) => `${name} (copy)`,
};
