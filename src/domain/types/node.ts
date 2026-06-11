import type { NodeId } from './ids';

/** Hypothesis-tracking state for a node's claim. */
export type NodeStatus = 'open' | 'supported' | 'refuted' | 'parked';

export type Level = 'low' | 'medium' | 'high';

/** Branch prioritisation signal (the 80/20 pruning). */
export interface Priority {
  /** How much resolving this branch moves the overall answer. */
  impact: Level;
  /** How easy / how confident we are that we can resolve it. */
  ease: Level;
}

export type EvidenceStrength = 'anecdote' | 'indicative' | 'strong';

/** A piece of evidence hung on a node (especially leaves). Shape adapted from TP Studio. */
export interface EvidenceItem {
  id: string;
  summary: string;
  source?: string;
  strength: EvidenceStrength;
  /** true = supports the node's claim; false = contradicts it. */
  supports: boolean;
}

/** A numeric value on a node, used by value-driver (formula) splits. */
export interface NumericValue {
  amount: number;
  unit?: string;
}

/**
 * A node in the issue tree: a question, sub-issue, or driver.
 * Parent/child structure lives in `Split`, never here.
 */
export interface IssueNode {
  id: NodeId;
  /** Short claim or question — the box text. */
  label: string;
  /** Optional longer notes (markdown). */
  detail?: string;
  status: NodeStatus;
  priority?: Priority;
  evidence: EvidenceItem[];
  value?: NumericValue;
  collapsed?: boolean;
}
