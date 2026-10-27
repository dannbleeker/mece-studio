// Provenance — where a piece of evidence came from, and how a hypothesis got to
// its current status. Pure readers over optional, additive fields.
//
// Every field read here can arrive from a file someone else wrote (open, import,
// share link, template), and `coerceDoc` only checks the tree's shape, not each
// optional field. So nothing outside this module reads `url`, `date` or
// `statusLog` directly: these readers are the one place a malformed or hostile
// value is turned into "absent".
import type { EvidenceItem, IssueNode, NodeStatus, StatusChange } from './types';

const NODE_STATUSES: ReadonlySet<string> = new Set<NodeStatus>([
  'open',
  'supported',
  'refuted',
  'parked',
]);

/**
 * A link that is safe to put in an `href`, or `undefined`. Only absolute
 * http(s) URLs pass: `javascript:`, `data:`, protocol-relative and the rest
 * are dropped, whatever their casing or leading whitespace.
 */
export function safeUrl(url: string | undefined): string | undefined {
  if (typeof url !== 'string') return undefined;
  const trimmed = url.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return undefined;
  }
  return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? trimmed : undefined;
}

const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * The evidence's calendar day (`YYYY-MM-DD`), or `undefined` when absent or not
 * a real day. "2026-02-30" is rejected rather than silently rolled into March.
 */
export function evidenceDate(e: Pick<EvidenceItem, 'date'>): string | undefined {
  const d = e.date;
  if (typeof d !== 'string') return undefined;
  const m = ISO_DAY.exec(d);
  if (!m) return undefined;
  const [y, mo, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const probe = new Date(Date.UTC(y, mo - 1, day));
  return probe.getUTCFullYear() === y &&
    probe.getUTCMonth() === mo - 1 &&
    probe.getUTCDate() === day
    ? d
    : undefined;
}

/** The epoch-ms midnight (UTC) of a valid ISO day — for sorting and formatting. */
export function dayToTime(day: string): number {
  const [y, mo, d] = day.split('-').map(Number);
  return Date.UTC(y as number, (mo as number) - 1, d as number);
}

function isStatusChange(v: unknown): v is StatusChange {
  if (typeof v !== 'object' || v === null) return false;
  const c = v as Record<string, unknown>;
  return (
    typeof c.at === 'number' &&
    Number.isFinite(c.at) &&
    typeof c.from === 'string' &&
    NODE_STATUSES.has(c.from) &&
    typeof c.to === 'string' &&
    NODE_STATUSES.has(c.to)
  );
}

/**
 * A node's status history, oldest first, with malformed entries dropped and
 * mistyped optional fields stripped. Always an array.
 */
export function statusLogOf(node: Pick<IssueNode, 'statusLog'>): StatusChange[] {
  const raw: unknown = node.statusLog;
  if (!Array.isArray(raw)) return [];
  return raw.filter(isStatusChange).map((c) => {
    const clean: StatusChange = { at: c.at, from: c.from, to: c.to };
    if (typeof c.reason === 'string' && c.reason.trim() !== '') clean.reason = c.reason;
    if (typeof c.evidenceId === 'string') clean.evidenceId = c.evidenceId;
    return clean;
  });
}
