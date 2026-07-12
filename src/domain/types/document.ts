import type { DocId, NodeId, SplitId } from './ids';
import type { IssueNode } from './node';
import type { Split } from './split';

export type LayoutDirection = 'LR' | 'TB';

/** The schema version this app writes. Bump + add a migration on breaking changes. */
export const SCHEMA_VERSION = 1;

/**
 * A structured problem brief framing the tree — a "Problem Identity Card" after
 * Minto's problem-definition sheet and Chevallier's identity card. Every field is
 * optional. The key question is the root node's label and the day-1 answer is the
 * doc's `answer`, so neither is duplicated here.
 */
export interface ProblemBrief {
  /** The stable, non-controversial context — the relevant key facts. */
  situation?: string;
  /** What changed or is under threat — the need for change now. */
  complication?: string;
  /** Who owns the problem. */
  owner?: string;
  /** Who is involved in making the decision. */
  decisionMakers?: string;
  /** How a solution will be judged good. */
  successCriteria?: string;
  /** Deliverables / questions inside the project boundary. */
  inScope?: string;
  /** What we decide upfront NOT to tackle. */
  outOfScope?: string;
  /** What should be true at the end of the project. */
  desiredOutcome?: string;
}

export interface IssueTreeDoc {
  schemaVersion: number;
  id: DocId;
  title: string;
  /** The root node — the key question. */
  rootId: NodeId;
  nodes: Record<NodeId, IssueNode>;
  splits: Record<SplitId, Split>;
  /** The governing hypothesis / day-1 answer the tree argues for (optional). */
  answer?: string;
  /** A structured problem brief framing the tree (Situation / Complication / scope / …). Optional. */
  problemBrief?: ProblemBrief;
  /** 'LR' (left-to-right) is the classic McKinsey look. */
  layout: { direction: LayoutDirection };
  createdAt: number;
  updatedAt: number;
}
