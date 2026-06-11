import type { IssueTreeDoc } from '@/domain/types';

const KEY = 'mece-studio:doc:v1';

/** localStorage if it's available (guarded for SSR / node test env). */
function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** Light structural guard — enough to reject obviously stale/corrupt JSON. */
function isDoc(value: unknown): value is IssueTreeDoc {
  if (typeof value !== 'object' || value === null) return false;
  const d = value as Record<string, unknown>;
  return (
    typeof d.rootId === 'string' &&
    typeof d.nodes === 'object' &&
    d.nodes !== null &&
    typeof d.splits === 'object' &&
    d.splits !== null
  );
}

export function loadDoc(): IssueTreeDoc | null {
  const s = storage();
  if (!s) return null;
  try {
    const raw = s.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isDoc(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Parse + validate a JSON string as a document (for file import). */
export function parseDoc(json: string): IssueTreeDoc | null {
  try {
    const parsed: unknown = JSON.parse(json);
    return isDoc(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveDoc(doc: IssueTreeDoc): void {
  const s = storage();
  if (!s) return;
  try {
    s.setItem(KEY, JSON.stringify(doc));
  } catch {
    // Quota / serialization errors are non-fatal for a local-first app.
  }
}
