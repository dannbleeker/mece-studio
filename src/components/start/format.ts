import { DECOMPOSITION_LABELS } from '@/domain/constants';
import { splitOf } from '@/domain/tree';
import type { IssueTreeDoc } from '@/domain/types';

/** A short "kind" label for a tree — how its root decomposes, or 'Issue tree' if undecomposed. */
export function treeKind(doc: IssueTreeDoc): string {
  const root = splitOf(doc, doc.rootId);
  if (!root) return 'Issue tree';
  // Drop the parenthetical from the label ("Formula (A = B + C)" → "Formula") for a compact chip.
  return DECOMPOSITION_LABELS[root.decomposition].replace(/\s*\(.*\)$/, '');
}

/** A coarse "edited 2h ago" string. `now` is injectable so it's testable. */
export function relativeTime(ts: number, now: number = Date.now()): string {
  const diff = Math.max(0, now - ts);
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}
