import { nanoid } from 'nanoid';
import type {
  DecompositionType,
  DocId,
  EvidenceItem,
  EvidenceStrength,
  IssueNode,
  IssueTreeDoc,
  LocaleCode,
  NodeId,
  Split,
  SplitId,
} from './types';
import { SCHEMA_VERSION } from './types/document';
import { freshMece } from './types/split';

/** Create a fresh leaf node (no parent/children — structure lives in splits). */
export function createNode(label: string): IssueNode {
  return {
    id: nanoid() as NodeId,
    label,
    status: 'open',
    evidence: [],
  };
}

/** Create an empty split that decomposes `parentId` via the given strategy. */
export function createSplit(parentId: NodeId, decomposition: DecompositionType): Split {
  return {
    id: nanoid() as SplitId,
    parentId,
    childIds: [],
    decomposition,
    mece: freshMece(),
  };
}

/**
 * Create a fresh document seeded with a single root question.
 *
 * `title` and `locale` come from the caller because both are language-bound:
 * the title is a word, and the locale records which language this document's
 * seeded labels were written in. `title` defaults to empty rather than to an
 * English placeholder — display surfaces supply their own localised fallback.
 */
export function createDoc(
  rootQuestion: string,
  now: number,
  options: { title?: string; locale?: LocaleCode } = {}
): IssueTreeDoc {
  const root = createNode(rootQuestion);
  return {
    schemaVersion: SCHEMA_VERSION,
    id: nanoid() as DocId,
    title: options.title ?? '',
    ...(options.locale ? { locale: options.locale } : {}),
    rootId: root.id,
    nodes: { [root.id]: root },
    splits: {},
    layout: { direction: 'LR' },
    createdAt: now,
    updatedAt: now,
  };
}

/** Create an evidence item to attach to a node. */
export function createEvidence(
  summary: string,
  supports: boolean,
  strength: EvidenceStrength = 'indicative'
): EvidenceItem {
  return { id: nanoid(), summary, supports, strength };
}
