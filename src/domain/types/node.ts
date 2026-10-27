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
  /** Where it came from, as free text ("Teams: Weekend crashes", "Grafana"). */
  source?: string;
  strength: EvidenceStrength;
  /** true = supports the node's claim; false = contradicts it. */
  supports: boolean;
  /**
   * The day the fact was observed or reported, as an ISO calendar date
   * (`YYYY-MM-DD`) — not when it was typed in. A date rather than a timestamp,
   * because "what happened on Saturday 24 Oct" is a calendar fact with no
   * time zone. Optional; read through `evidenceDate()`, which rejects anything
   * that isn't a real calendar day.
   */
  date?: string;
  /** Who reported or observed it. Optional. */
  author?: string;
  /**
   * A link back to the original (a chat message, a ticket, a dashboard).
   * Optional, and never trusted: it is rendered only through `safeUrl()`, which
   * passes http(s) and nothing else, because a tree can arrive from a file.
   */
  url?: string;
  /** When it was added to the tree (epoch ms). Set automatically; optional on older saves. */
  addedAt?: number;
}

/**
 * One change of a node's hypothesis status: the reasoning trail behind "ruled
 * out", "reopened" and the rest. Appended automatically whenever the status
 * changes; the `reason` and the `evidenceId` that tipped it are the user's.
 */
export interface StatusChange {
  /** When the change happened (epoch ms). */
  at: number;
  from: NodeStatus;
  to: NodeStatus;
  /** Why it changed, in the user's words. Optional. */
  reason?: string;
  /** The evidence item on this node that tipped it, if one did. */
  evidenceId?: string;
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
  /**
   * Every status change, oldest first. Optional and additive: an older save has
   * none, and a file may carry a malformed one, so read it through
   * `statusLogOf()`, never directly.
   */
  statusLog?: StatusChange[];
}
