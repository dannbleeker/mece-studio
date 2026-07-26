import { splitOf } from '@/domain/tree';
import type { IssueTreeDoc, LocaleCode } from '@/domain/types';
import { formatRelativeTime } from '@/i18n/format';
import type { CoreMessages } from '@/i18n/types';

/**
 * A short "kind" label for a tree — how its root decomposes. An undecomposed
 * root has no split type yet, and `freeform` is where the catalogue keeps the
 * generic wording for exactly that case.
 */
export function treeKind(doc: IssueTreeDoc, m: CoreMessages): string {
  const root = splitOf(doc, doc.rootId);
  return m.enums.treeKind[root?.decomposition ?? 'freeform'];
}

/**
 * A coarse "edited 2 hours ago" for a tree card, in the reader's language.
 * `Intl` owns the wording and the plural rules; `now` stays injectable so the
 * cards' timestamps are testable.
 */
export function relativeTime(locale: LocaleCode, ts: number, now: number = Date.now()): string {
  return formatRelativeTime(locale, ts, now);
}
