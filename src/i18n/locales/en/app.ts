/**
 * English wording for the app shell — the editor header and its two menus, the
 * tab strip, the shared dialog chrome (close / cancel / confirm), the answer
 * banner, the import + quick-capture + about + shortcuts dialogs, and the toasts
 * the PWA update service raises.
 *
 * Enum words are not repeated here: the header's tree-kind badge reads
 * `enums.treeKind`, and the tab strip's health dot reuses the review dock's own
 * wording, so the same state never gets two spellings.
 */
import type { TreeMode } from '@/domain/types';
import { quote } from './_locale';

/** The header badge for a tree that asks "why?" or "how?". */
const modeBadge: Record<TreeMode, string> = {
  why: 'Why tree',
  how: 'How tree',
};

/** About: the wording of each link. The hrefs are not language, so they stay in the component. */
const aboutLinks = {
  guide: { label: 'User Guide', hint: 'Reference for every feature and shortcut.' },
  bookPdf: {
    label: 'Read the book (PDF)',
    hint: 'Issue Trees with MECE Studio — the practitioner’s guide.',
  },
  bookEpub: { label: 'Read the book (EPUB)', hint: 'Same book, for Kindle and e-readers.' },
  notices: {
    label: 'Third-party notices & trademarks',
    hint: 'Attribution and licenses for dependencies.',
  },
  source: { label: 'Source on GitHub', hint: 'Code, issues, and releases.' },
};

/**
 * The keyboard reference as data — one row per shortcut, in table order.
 * Mirrors the "Keyboard reference" table in USER_GUIDE.md; keep the two in sync.
 * Keycaps are words too ("Enter", "Backspace", "Double-click"), so they live
 * here with the actions rather than being hardcoded in the table.
 */
const shortcutRows: { keys: string[]; action: string }[] = [
  { keys: ['Tab'], action: 'Add a child to the selected node and edit it' },
  { keys: ['Shift + Enter'], action: 'Add a sibling to the selected node and edit it' },
  { keys: ['↑ / ↓'], action: 'Move selection between siblings' },
  { keys: ['← / →'], action: 'Move selection to the parent / first child' },
  { keys: ['Enter', 'F2'], action: "Edit the selected node's label" },
  { keys: ['Double-click'], action: "Edit a node's label inline" },
  { keys: ['Escape'], action: 'Cancel an edit · close a dialog' },
  { keys: ['Delete', 'Backspace'], action: 'Remove the selected node and its subtree' },
  { keys: ['P'], action: "Bump the selected node's priority (none → low → medium → high)" },
  { keys: ['Ctrl / ⌘ + Z'], action: 'Undo' },
  { keys: ['Ctrl / ⌘ + Y', 'Ctrl / ⌘ + Shift + Z'], action: 'Redo' },
  { keys: ['Enter'], action: 'Zoom to matches (in the Find box)' },
  { keys: ['Ctrl / ⌘ + K'], action: 'Search the library (on the Start page)' },
  { keys: ['Ctrl / ⌘ + Enter'], action: 'Add the typed issues (in Quick add)' },
  { keys: ['→ / Space', '←'], action: 'Next / previous step (in Present mode)' },
  { keys: ['?'], action: 'Show this shortcuts list' },
];

export const app = {
  /** Header, left cluster: getting back to the library, and the tree's identity. */
  backToStartTitle: 'Back to Start',
  backToStart: '← Start',
  allTreesTitle: 'All trees (Start)',
  modeBadge,

  /** Header, right cluster: history, the synthesis drawer, and the utility buttons. */
  undo: 'Undo',
  undoTitle: 'Undo (Ctrl/⌘+Z)',
  redo: 'Redo',
  redoTitle: 'Redo (Ctrl/⌘+Y or Ctrl/⌘+Shift+Z)',
  synthesis: 'Synthesis',
  settings: 'Settings',
  shortcuts: 'Keyboard shortcuts',
  shortcutsTitle: 'Keyboard shortcuts (?)',
  moreActions: 'More actions',
  /** Dismisses the compact (mobile) bottom sheet holding the inspector or review dock. */
  closePanel: 'Close panel',

  /** The Export menu — the image formats first, then the data ones. */
  exportMenu: 'Export',
  exportPng: 'PNG',
  exportSvg: 'SVG',
  exportPdf: 'PDF',
  exportPptx: 'PPTX',
  exportCopyImage: 'Copy image',
  exportJson: 'JSON',
  exportCsv: 'CSV (value model)',
  exportAnswer: 'Answer (1-page)',
  exportShareLink: 'Copy share link',

  /** The ⋯ overflow menu — capture, files, output, and the tree-level actions. */
  quickAdd: 'Quick add issues…',
  copyMarkdown: 'Copy Markdown',
  openFile: 'Open file…',
  importOutline: 'Import outline…',
  save: 'Save',
  saveAs: 'Save As…',
  saveAsTemplate: 'Save as template…',
  present: 'Present',
  print: 'Print…',
  about: 'About',
  newTree: 'New tree',
  deleteTree: 'Delete tree',
  /** Fallback alert when a chosen file could not be read at all. */
  openFileFailed: 'Could not open that file.',

  /** Deleting the open tree, and saving its structure as a reusable template. */
  deleteTreeConfirm: ({ name }: { name: string }) =>
    `Delete ${quote(name)}? This cannot be undone.`,
  saveTemplateTitle: 'Save as template',
  saveTemplateSubtitle:
    "Reuse this tree's structure on a future engagement — values, evidence, and status are stripped.",
  saveTemplateSubmit: 'Save template',

  /** The strip of open trees above the canvas. */
  openTrees: 'Open trees',
  tabNotDecomposed: 'Not decomposed yet',
  closeTab: ({ name }: { name: string }) => `Close ${name}`,

  /** Chrome shared by every dialog and the toast stack. */
  close: 'Close',
  cancel: 'Cancel',
  confirm: 'Confirm',
  dismissToast: 'Dismiss',

  /** The governing-answer banner above the canvas. */
  answerHeading: 'Answer',
  answerLabel: 'Governing answer',
  answerPlaceholder: 'State your day-1 answer — the tree argues for it (optional)',
  problemBriefTitle: 'Frame the problem — situation, complication, scope',
  editProblemBrief: '✎ Problem brief',
  addProblemBrief: '+ Problem brief',

  /** Import: paste an outline, OPML, or a tree's JSON. */
  importTitle: 'Import a tree',
  importSubtitle:
    "Paste a Markdown outline (headings or bullets), an OPML export from an outliner / mind-mapper, or a tree's JSON. The first heading or line becomes the root question; everything else nests beneath it.",
  importFieldLabel: 'Outline or JSON to import',
  importPlaceholder:
    '# Why are sales down?\n- Pricing\n  - Too high vs competitors\n- Demand\n- Distribution',
  importError: "Couldn't read that as a Markdown outline, OPML, or a tree's JSON.",
  importSubmit: 'Import',

  /** Quick capture: one issue per line, added under the selected node. */
  quickAddTitle: 'Quick add issues',
  /** Stands in for the parent's label when the root question has no text yet. */
  quickAddParentFallback: 'the root question',
  quickAddSubtitleLead: 'One issue per line — each becomes a child of',
  /** The parent's label, in this locale's quotation marks (the subtitle emphasises it). */
  quickAddParentName: ({ name }: { name: string }) => `“${name}”`,
  quickAddNestHint: 'Indent (Tab / spaces) to nest sub-issues.',
  quickAddFieldLabel: 'Issues to add, one per line',
  quickAddPlaceholder: 'Pricing\n  Cost floor\n  Value ceiling\nDemand\nDistribution',
  quickAddSubmitHint: '⌘/Ctrl + Enter to add',
  quickAddSubmit: 'Add issues',

  /** About: the dialog's own framing, its links, and the manual update check. */
  aboutTitle: 'About MECE Studio',
  aboutSubtitle:
    'Build McKinsey-style issue trees with MECE checking built in. Free, local-first, runs in your browser.',
  aboutLinks,
  checkForUpdates: 'Check for updates',
  updateUpToDate: "You're on the latest version.",
  updateFound: 'New version found — the refresh prompt will appear once it downloads.',
  updateUnsupported: "Update checks aren't available here (no service worker running).",

  /**
   * The licence footnote, in fragments because two licence names and the notices
   * page are links inside the sentence.
   */
  licenseIntro: '© 2026 Dann Bleeker Pedersen. Software under',
  licenseSoftware: 'Apache-2.0',
  licenseBookIntro: '; the book under',
  licenseBook: 'CC BY-NC 4.0',
  licenseTrademarks: '. “McKinsey” and “MECE” are referenced descriptively — see the',
  licenseNotices: 'third-party notices',

  /** The keyboard-shortcuts overlay. */
  shortcutsSubtitle:
    "These work on the canvas (ignored while you're typing in a field); the last few live where they're marked.",
  shortcutRows,
  /** Separates two alternative keycaps for the same action. */
  shortcutKeyOr: 'or',

  /** Service-worker toasts: a waiting update, and the first successful precache. */
  updateAvailable: 'A new version is available.',
  refreshNow: 'Refresh now',
  offlineReady: 'Ready to use offline.',
};
