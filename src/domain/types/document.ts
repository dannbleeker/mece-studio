import type { DocId, NodeId, SplitId } from './ids';
import type { IssueNode } from './node';
import type { Split } from './split';

export type LayoutDirection = 'LR' | 'TB';

/** The schema version this app writes. Bump + add a migration on breaking changes. */
export const SCHEMA_VERSION = 1;

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
  /** 'LR' (left-to-right) is the classic McKinsey look. */
  layout: { direction: LayoutDirection };
  createdAt: number;
  updatedAt: number;
}
