/**
 * English wording for the tree canvas — its toolbar, the node cards, the
 * first-run coach, and the multi-select action bar.
 *
 * Enum words (status, level, MECE check state) are not repeated here: the call
 * sites read them from `enums`, so a status reads the same on a node, in the
 * inspector, and in an export.
 */
import type { Level } from '@/domain/types';
import { num, plur } from './_locale';

/** Level shorthand for the multi-select bar's three priority buttons. */
const levelAbbr: Record<Level, string> = {
  high: 'H',
  medium: 'M',
  low: 'L',
};

/**
 * React Flow ships its own English accessibility strings for the controls, the
 * minimap and the keyboard hints. They are rendered inside our app, so they are
 * ours to translate — passed back to `<ReactFlow ariaLabelConfig={…}>`. Keys are
 * React Flow's; only the wording is ours.
 */
const flowAria = {
  'node.a11yDescription.default':
    'Press enter or space to select a node. Press delete to remove it and escape to cancel.',
  'node.a11yDescription.keyboardDisabled':
    'Press enter or space to select a node. You can then use the arrow keys to move the node around. Press delete to remove it and escape to cancel.',
  'edge.a11yDescription.default':
    'Press enter or space to select an edge. You can then press delete to remove it or escape to cancel.',
  'controls.ariaLabel': 'Control Panel',
  'controls.zoomIn.ariaLabel': 'Zoom In',
  'controls.zoomOut.ariaLabel': 'Zoom Out',
  'controls.fitView.ariaLabel': 'Fit View',
  'controls.interactive.ariaLabel': 'Toggle Interactivity',
  'minimap.ariaLabel': 'Mini Map',
  'handle.ariaLabel': 'Handle',
};

export const canvas = {
  flowAria,

  /** The canvas region, and the title band of a PDF / PPTX export. */
  regionLabel: ({ title }: { title: string }) => `Issue tree: ${title}`,
  /** Stands in for the root's question when a tree hasn't got one. */
  fallbackTitle: 'Issue tree',

  /** Top-left toolbar: search, and collapse / expand the whole tree. */
  findPlaceholder: 'Find…',
  findLabel: 'Find nodes',
  collapseAll: 'Collapse all',
  expandAll: 'Expand all',
  noMatches: 'No matches',
  matchCount: ({ count }: { count: number }) =>
    `${num(count)} ${plur(count, { one: 'match', other: 'matches' })}`,

  /**
   * The one-time coach card, shown while a tree is still just its root. Split
   * into fragments because the sentence carries inline emphasis (a keycap and
   * the panel's name), which a single string can't hold.
   */
  coachTitle: 'Start your tree.',
  coachBeforeKey: 'Select a node and press',
  coachKey: 'Tab',
  coachBeforePanel: 'to add a branch — then in the',
  coachPanel: 'Logic',
  coachAfterPanel:
    'panel choose how it splits (segment · binary · formula …) to turn on MECE checks.',
  coachDismiss: 'Dismiss tip',

  /** A node card: inline editing, the value line, evidence tallies, notes. */
  editLabel: 'Edit node label',
  nodeValue: ({ amount, unit }: { amount: number; unit?: string }) =>
    `${num(amount)}${unit ? ` ${unit}` : ''}`,
  evidenceSupports: ({ count }: { count: number }) => `✓ ${num(count)}`,
  evidenceContradicts: ({ count }: { count: number }) => `✗ ${num(count)}`,
  hasNotes: 'Has notes',
  statusCaption: ({ status }: { status: string }) => `Status: ${status}`,

  /** The axis a node's split is cut on. */
  splitByTitle: ({ dimension }: { dimension: string }) => `Split by ${dimension}`,
  splitBy: ({ dimension }: { dimension: string }) => `by ${dimension}`,

  /** The two MECE dots under a decomposed node — long name, short badge, caption. */
  meceExclusive: 'Mutually exclusive',
  meceExclusiveShort: 'ME',
  meceExhaustive: 'Collectively exhaustive',
  meceExhaustiveShort: 'CE',
  meceCaption: ({ axis, state }: { axis: string; state: string }) => `${axis}: ${state}`,

  /** Per-node affordances: fold the subtree, or branch from here. */
  collapseSubtree: 'Collapse subtree',
  expandSubtree: 'Expand subtree',
  collapsedCount: ({ count }: { count: number }) => `▶ ${num(count)}`,
  addChildTitle: 'Add a sub-issue',
  addChildLabel: 'Add sub-issue',

  /** The floating bar for a 2+ node selection. */
  selectionCount: ({ count }: { count: number }) => `${num(count)} selected`,
  setStatusTitle: ({ status }: { status: string }) => `Set ${status} for the selection`,
  setStatusLabel: ({ status }: { status: string }) => `Set status ${status}`,
  priorityHeading: 'Priority',
  setPriorityLabel: ({ level }: { level: string }) => `Set priority ${level}`,
  levelAbbr,
  clearPriority: 'clear',
  deleteSelection: 'Delete',
  clearSelection: 'Clear',
};
