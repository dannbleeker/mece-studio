import type { DocId, NodeId, SplitId } from './ids';
import type { LocaleCode } from './locale';
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

/** Whether the tree asks "why?" (diagnostic — causes) or "how?" (prescriptive — alternatives). */
export type TreeMode = 'why' | 'how';

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
  /** Whether this is a "why?" (diagnostic) or "how?" (prescriptive) tree. Optional; unset = either. */
  mode?: TreeMode;
  /**
   * The app locale in effect when the document was created — i.e. the language
   * its seeded labels ("Segment 1", "Other") were written in. Optional and
   * additive, so no schema bump: an older save simply has none.
   *
   * Recorded but deliberately **not read** by any behaviour yet. It exists so a
   * later change can collate and format a tree in its own language rather than
   * the reader's (a Danish tree opened by an English reader still sorts æ/ø/å
   * correctly), and so an imported tree can say what language it came from.
   * Until then the app setting drives every read path. Covered by round-trip
   * tests in `factory.test.ts` and `services/import.test.ts` so it can't be
   * silently dropped on save/load.
   */
  locale?: LocaleCode;
  /** 'LR' (left-to-right) is the classic McKinsey look. */
  layout: { direction: LayoutDirection };
  createdAt: number;
  updatedAt: number;
}
