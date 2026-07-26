/**
 * English wording for the Start workspace — the shell and its nav, the
 * key-question hero, the tree library and its cards, the Templates page, and
 * the short MECE primer.
 *
 * Decomposition words are deliberately absent: the starter tiles read their
 * titles and hints from `enums` and their scaffold chips from `content`, so a
 * framework reads the same on a Start tile as it does in the inspector.
 */
import { num, plur } from './_locale';

/**
 * The Start shell's sections — the sidebar's nav items, and the caption the
 * header shows for whichever one is on screen.
 *
 * Typed structurally rather than as `Record<Section, string>` so the catalogue
 * stays free of view-layer imports; indexing it with a `Section` at the call
 * site is what proves the record is complete.
 */
const section = {
  start: 'Start',
  all: 'All trees',
  recent: 'Recent',
  templates: 'Templates',
  review: 'Needs review',
  learn: 'Learn MECE',
};

/** The one-click "Try" prompts under the hero; picking one seeds a tree's root question. */
const sampleQuestions = [
  'Why is profit falling?',
  'Should we launch a subscription tier?',
  'Where is delivery time lost?',
];

export const start = {
  section,
  sampleQuestions,

  /** The shell: brand button, the new-tree action, the mobile drawer, the search box. */
  homeTitle: 'MECE Studio — Start',
  newTree: '+ New tree',
  openNav: 'Open navigation',
  closeNav: 'Close navigation',
  privacyTitle: '🔒 Local & private',
  privacyBody: 'A local-first PWA. Works offline. Your trees never leave this device.',
  searchPlaceholder: 'Search trees…',
  searchLabel: 'Search trees',

  /** The hero: state a question, then pick how to split it. */
  heroEyebrow: 'Issue trees · MECE by construction',
  heroTitle: "What's your key question?",
  heroBlurb:
    'State the question you need to answer. MECE Studio scaffolds the first split and checks every branch for overlaps and gaps — so your tree is mutually exclusive and collectively exhaustive as you build.',
  questionLabel: 'Key question',
  questionPlaceholder: 'e.g. “How do we cut customer churn?”',
  buildTree: 'Build an issue tree →',
  tryLabel: 'Try',

  /** The chooser the hero opens, so you land on a scaffolded split rather than a lone root. */
  splitChooserTitle: 'How do you want to split it?',
  splitChooserPrompt: 'Pick a decomposition to scaffold the first split, or start blank.',
  splitChooserPromptFor: ({ question }: { question: string }) =>
    `“${question}” — pick a decomposition to scaffold the first split, or start blank.`,
  startBlank: 'Start blank instead →',

  /** Group headings on the Start home. */
  frameworksHeading: '…or start from a framework',
  exampleTreesHeading: 'Example trees',
  resumeHeading: 'Pick up where you left off',
  resume: 'Resume →',
  seeAllTrees: 'See all trees →',
  reviewNeeded: ({ count }: { count: number }) =>
    `${num(count)} ${plur(count, { one: 'tree needs', other: 'trees need' })} a MECE review`,

  /** The Templates page: your saved templates, then the built-in libraries. */
  yourTemplatesHeading: 'Your templates',
  yourTemplatesBlurb:
    'Trees you saved as reusable starting points (structure only — values, evidence, and status are stripped). Save the current tree from',
  saveAsTemplatePath: '⋯ → Save as template…',
  openTemplate: ({ name }: { name: string }) => `Open template ${name}`,
  customTemplate: 'Custom template',
  deleteTemplate: 'Delete template',
  deleteTemplateNamed: ({ name }: { name: string }) => `Delete template ${name}`,
  decompositionsHeading: 'Decomposition frameworks',
  decompositionsBlurb:
    'Start a tree from a MECE-clean split. Binary and formula are provably MECE; the rest scaffold sensible starter branches you rename.',
  namedFrameworksHeading: 'Named frameworks',
  namedFrameworksBlurb:
    "Classic strategy, marketing, and diagnosis frameworks, ready to fill in. They organise your thinking but aren't guaranteed MECE — rename each branch to your situation and let the checks flag overlaps and gaps.",
  exampleTreesBlurb:
    'Open a ready-made tree and learn by poking at a real one. Each opens as a fresh copy in your library.',
  /** Badge on the two decompositions that are MECE by construction. */
  provablyMece: 'provably MECE',

  /** A tree card: its meta line, its MECE pill, and the hover/focus actions. */
  treeMeta: ({ kind, edited }: { kind: string; edited: string }) => `${kind} · edited ${edited}`,
  pillClean: 'MECE clean',
  pillToCheck: ({ count }: { count: number }) => `${num(count)} to check`,
  pillNoSplits: 'No splits yet',
  openTree: ({ name }: { name: string }) => `Open ${name}`,
  rename: 'Rename',
  renameTree: ({ name }: { name: string }) => `Rename ${name}`,
  duplicate: 'Duplicate',
  duplicateTree: ({ name }: { name: string }) => `Duplicate ${name}`,
  delete: 'Delete',
  deleteTree: ({ name }: { name: string }) => `Delete ${name}`,
  /** Why a tree surfaced in a search that its name doesn't match. */
  matchHint: ({ label }: { label: string }) => `matches “${label}”`,

  /** Empty states for the gallery and the recent list. */
  noTreesYet: 'No trees yet.',
  noMatches: ({ query }: { query: string }) => `No trees match “${query}”.`,

  /** The Needs-review section: how many trees carry a flagged split. */
  reviewAllClean: 'Every split is MECE clean — nothing to review.',
  reviewFlagged: ({ count }: { count: number }) =>
    `${num(count)} ${plur(count, { one: 'tree has', other: 'trees have' })} a split flagged for review.`,
  reviewGalleryEmpty: 'Nothing to review — every split is MECE clean.',

  /** Renaming and deleting a tree from its card. */
  renameDialogTitle: 'Rename tree',
  deleteDialogTitle: 'Delete tree',
  deleteDialogMessage: ({ name }: { name: string }) => `Delete "${name}"? This cannot be undone.`,
  /** Stands in for a tree with no name in the delete confirmation. */
  thisTree: 'this tree',

  /**
   * The MECE primer. Split into fragments where the sentence carries inline
   * emphasis (the bolded term, the italicised "split") — one string can't hold
   * markup, and the emphasis is the point of the sentence.
   */
  learnDefinition:
    '— Mutually Exclusive, Collectively Exhaustive — is the test every good decomposition passes. It is a property of a',
  learnSplitWord: 'split',
  learnSplitScope: '(a parent and its children), not of a single node.',
  learnHalvesTitle: 'The two halves',
  learnExclusiveTerm: 'Mutually exclusive (ME)',
  learnExclusiveBody: "— the branches don't overlap, so nothing is double-counted.",
  learnExhaustiveTerm: 'Collectively exhaustive (CE)',
  learnExhaustiveBody: '— together the branches cover the whole parent, so nothing is missed.',
  learnChecks:
    "MECE Studio checks every split as you build: binary (A / not-A) and formula splits are provably MECE; segments need an explicit “Other” bucket to be exhaustive; other splits get a sibling-overlap heuristic. The dots on each node and the warnings in the inspector tell you where a split needs attention — and a tree's card shows the same status at a glance.",
  learnDeeper: 'Go deeper: the',
  learnUserGuide: 'User Guide',
  learnGuideAfter: 'covers every feature, and the book',
  learnBookTitle: 'Issue Trees with MECE Studio',
  learnBookAfter: 'teaches the method end to end.',
};
