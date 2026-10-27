// Timeline: what happened in the investigation, and when.
//
// Two kinds of dated event already live on the tree: evidence (dated by the
// day the fact was observed, falling back to when it was added) and status
// changes (each stamped when it happened). This module lines them up, so the
// user can read the investigation in order and write a "what changed since
// Tuesday" update without retyping it. Pure, and read only through the
// validating readers, because every field here can arrive from a file.
import type { EditorMessages } from '@/i18n/types';
import { dayToTime, evidenceDate, safeUrl, statusLogOf } from './provenance';
import { childrenOf } from './tree';
import type { EvidenceItem, IssueTreeDoc, NodeId, StatusChange } from './types';

export type TimelineEvent =
  | {
      kind: 'evidence';
      /** Epoch ms used for ordering: the observed day, else when it was added. */
      at: number;
      /** True when `at` is a calendar day the user gave, not the time it was typed in. */
      dated: boolean;
      nodeId: NodeId;
      evidence: EvidenceItem;
    }
  | { kind: 'status'; at: number; nodeId: NodeId; change: StatusChange };

/**
 * Every dated event on the tree, oldest first. Ties keep tree order, with a
 * node's evidence before its status changes (the evidence usually tipped it).
 * Evidence with neither a date nor an `addedAt` is left out: it has no place
 * on a timeline.
 */
export function timelineEvents(doc: IssueTreeDoc): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const visit = (id: NodeId) => {
    const node = doc.nodes[id];
    if (!node) return;
    for (const e of node.evidence ?? []) {
      const day = evidenceDate(e);
      if (day)
        events.push({ kind: 'evidence', at: dayToTime(day), dated: true, nodeId: id, evidence: e });
      else if (typeof e.addedAt === 'number' && Number.isFinite(e.addedAt)) {
        events.push({ kind: 'evidence', at: e.addedAt, dated: false, nodeId: id, evidence: e });
      }
    }
    for (const change of statusLogOf(node)) {
      events.push({ kind: 'status', at: change.at, nodeId: id, change });
    }
    for (const child of childrenOf(doc, id)) visit(child.id);
  };
  visit(doc.rootId);
  // Array.prototype.sort is stable, so equal times keep the tree-order push.
  return events.sort((a, b) => a.at - b.at);
}

/** The events on or after `since` (epoch ms). */
export function eventsSince(doc: IssueTreeDoc, since: number): TimelineEvent[] {
  return timelineEvents(doc).filter((e) => e.at >= since);
}

/**
 * A pasteable Markdown update: what changed since `since`, grouped by node in
 * tree order, each node with its current status. Empty string when nothing
 * changed, so the caller can say so instead of copying a heading alone.
 */
export function changesMarkdown(doc: IssueTreeDoc, since: number, m: EditorMessages): string {
  const events = eventsSince(doc, since);
  if (events.length === 0) return '';
  const byNode = new Map<NodeId, TimelineEvent[]>();
  for (const e of events) byNode.set(e.nodeId, [...(byNode.get(e.nodeId) ?? []), e]);

  const lines = [
    m.exports.changesHeading({ since, question: doc.nodes[doc.rootId]?.label ?? '' }),
    '',
  ];
  const order: NodeId[] = [];
  const walk = (id: NodeId) => {
    if (byNode.has(id)) order.push(id);
    for (const child of childrenOf(doc, id)) walk(child.id);
  };
  walk(doc.rootId);
  for (const id of order) {
    const node = doc.nodes[id];
    if (!node) continue;
    lines.push(
      m.exports.changesNode({ label: node.label || m.content.untitled, status: node.status })
    );
    for (const e of byNode.get(id) ?? []) {
      if (e.kind === 'status') {
        lines.push(
          `  - ${m.exports.changesStatus({
            at: e.change.at,
            from: e.change.from,
            to: e.change.to,
            ...(e.change.reason ? { reason: e.change.reason } : {}),
          })}`
        );
      } else {
        const url = safeUrl(e.evidence.url);
        const day = evidenceDate(e.evidence);
        lines.push(
          `  - ${m.exports.changesEvidence({
            summary: e.evidence.summary,
            supports: e.evidence.supports,
            strength: e.evidence.strength,
            ...(day ? { day } : {}),
            ...(e.evidence.author ? { author: e.evidence.author } : {}),
            ...(url ? { url } : {}),
          })}`
        );
      }
    }
  }
  return lines.join('\n');
}
