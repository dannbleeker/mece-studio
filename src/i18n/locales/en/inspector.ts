/**
 * English wording for the inspector — the per-node editor beside the canvas.
 *
 * The panel is tabbed (Issue · Logic · Evidence · Value), so the keys are grouped
 * the same way. Words for domain enum members (status, level, split logic, split
 * order, evidence strength, decomposition) are NOT here — they live once in
 * `./enums` because the pickers, the coaching messages and the exports all say them.
 */
import type { SplitLogic } from '@/domain/types';
import { num, plur } from './_locale';

/** Which way a piece of evidence points — the ✓ / ✗ toggle on a row. */
type Stance = 'supports' | 'contradicts';

/** Why an inductive grouping and a deductive chain get checked differently. */
const splitLogicHint: Record<SplitLogic, string> = {
  inductive: 'A grouping of same-kind branches — kept MECE.',
  deductive: 'An argument chain (premise → premise → conclusion) — not overlap-checked.',
};

const stanceTitle: Record<Stance, string> = {
  supports: 'Supports — click to flip',
  contradicts: 'Contradicts — click to flip',
};

const stanceLabel: Record<Stance, string> = {
  supports: 'Supports — flip stance',
  contradicts: 'Contradicts — flip stance',
};

export const inspector = {
  /** Nothing selected: the panel explains itself. Three parts so the action name stays emphasised. */
  emptyLead: 'Select a node to edit it. Use',
  emptyAction: 'Add sub-issue',
  emptyTail:
    'to decompose it — the dots show whether each split is mutually exclusive (ME) and collectively exhaustive (CE).',

  /** Panel header. */
  multiSelected: ({ count }: { count: number }) =>
    `${num(count)} ${plur(count, { one: 'node', other: 'nodes' })} selected — ` +
    `bulk actions in the canvas toolbar`,

  /** The four facets, shown one at a time. */
  tabs: {
    issue: 'Issue',
    logic: 'Logic',
    evidence: 'Evidence',
    value: 'Value',
  },

  /** Coaching advisories — an info-only channel, never a MECE finding. */
  coachingHeading: 'Coaching',

  /** Issue tab: the question / label, notes and status. */
  keyQuestionLabel: 'Key question',
  issueLabel: 'Issue',
  notesLabel: 'Notes',
  notesPlaceholder: 'Rationale, assumptions, data sources…',
  statusLabel: 'Status',

  /** Issue tab: the impact × ease priority matrix. */
  priorityLabel: 'Priority',
  priorityCellLabel: ({ impact, ease }: { impact: string; ease: string }) =>
    `Impact ${impact}, ease ${ease}`,
  priorityCellTitle: ({ impact, ease, band }: { impact: string; ease: string; band: string }) =>
    `Impact ${impact} · ease ${ease} → ${band} priority`,
  priorityAxes: 'impact ↓ · ease →',
  clearPriority: 'Clear priority',

  /** Logic tab: how this node decomposes. */
  decompositionLabel: 'How it splits',
  dimensionLabel: 'Split dimension',
  dimensionPlaceholder: 'the one axis — e.g. customer, geography, product…',
  dimensionHint:
    "Name the one axis you're splitting on — keeps the level MECE (one dimension per split).",
  /** The usual MECE cuts, offered as one-click dimension fills. */
  commonAxes: ['customer', 'geography', 'product', 'time', 'stage'],

  /** Logic tab: Minto's horizontal relationship, the so-what, and the sibling order. */
  splitLogicLabel: 'Logic',
  splitLogicHint,
  summaryLabel: 'So-what (insight)',
  summaryPlaceholder: 'the one takeaway these branches support…',
  summaryHint: 'The conclusion these children add up to — leads the branch in the synthesis.',
  orderLabel: 'Order',
  orderOptionLabel: ({ order }: { order: string }) => `Order ${order}`,
  orderDefaultLabel: 'Order default',
  orderHint:
    'How the branches are ordered (Minto). Time and structure keep your order; importance sorts by priority.',
  operatorLabel: 'Combine children by',

  /** Logic tab: the two MECE checks on this split. */
  exclusiveAxis: 'Mutually exclusive',
  exhaustiveAxis: 'Collectively exhaustive',
  /** The bolded lead-in before a finding, e.g. "Mutually exclusive." */
  axisLead: ({ axis }: { axis: string }) => `${axis}.`,
  /** The check glyph's tooltip, e.g. "Mutually exclusive: needs review". */
  axisState: ({ axis, state }: { axis: string; state: string }) => `${axis}: ${state}`,
  notYetChecked: 'Not yet checked.',

  /** Logic tab, formula splits: roll-up and driver sensitivity. */
  rollUpAction: ({ value }: { value: number }) => `Roll up children → ${num(value)}`,
  sensitivityLabel: 'Sensitivity (±10%)',
  driverSwing: ({ value }: { value: number }) => num(value, { maximumFractionDigits: 2 }),
  sensitivityHint: 'Range of this value as each driver shifts ±10%, one at a time.',

  /** Logic tab for a leaf: pick a decomposition, or have an AI suggest one. */
  decomposeHeading: 'Decompose by',
  decomposeHint: 'Seeds clean starter sub-issues you can rename.',
  aiPromptTitle:
    'Copy a prompt to suggest a MECE split for this node — paste it into Claude or ChatGPT',
  aiPromptAction: 'Copy an AI prompt to suggest a split →',
  aiPasteSummary: "…then paste the AI's split back →",
  aiPastePlaceholder: "Paste the AI's Markdown outline…\n- Sub-issue\n  - nested",
  aiPasteAction: 'Add these sub-issues',

  /** Evidence tab. */
  evidenceHeading: 'Evidence',
  evidencePlaceholder: 'Add evidence…',
  evidenceTextLabel: 'Edit evidence text',
  stanceTitle,
  stanceLabel,
  strengthLabel: 'Strength',
  strengthOptionLabel: ({ strength }: { strength: string }) => `Set strength ${strength}`,
  removeTitle: 'Remove',
  removeEvidenceLabel: 'Remove evidence',
  addSupports: '+ Supports',
  addContradicts: '+ Contradicts',

  /** Value tab. */
  valueLabel: 'Value (optional)',
  amountPlaceholder: 'e.g. 100',
  unitPlaceholder: 'unit',
  unitTitle: 'Unit (e.g. DKK, %, hrs) — set an amount first',
  valueHint:
    'A measured number for this node. Formula splits can roll their children up into it from the Logic tab.',

  /** Structural actions at the foot of the panel. */
  addSubIssue: '+ Add sub-issue',
  moveUp: '↑ Move up',
  moveDown: '↓ Move down',
  duplicateSubtree: 'Duplicate subtree',
  deleteIssue: 'Delete issue',
};
