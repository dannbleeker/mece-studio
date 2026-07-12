// Coaching advisories — a lightweight, `info`-only channel of tree-quality
// nudges drawn from the problem-structuring canon (Minto; Chevallier; the
// McKinsey Way). DELIBERATELY separate from the MECE engine: these are NOT
// mutual-exclusivity / collective-exhaustiveness findings, so they never enter
// `reviewCount` / `flaggedSplits` and never touch the MECE health chip. Pure,
// and conservative by design — like the ME/CE heuristics, a false positive is
// worse than a miss, so each lint fires only on a clear-cut case.
import { IDEAL_SPLIT_MAX, MAX_SPLIT_CHILDREN } from './constants';
import { childrenOf } from './tree';
import type { IssueNode, IssueTreeDoc, NodeId, Split } from './types';

export type AdvisoryCategory =
  | 'whole-sentence'
  | 'branch-count'
  | 'altitude'
  | 'hypothesis'
  | 'key-question';

export interface Advisory {
  /** Stable, unique id (per category + target) — good as a React key. */
  id: string;
  /**
   * What it points at. `id` is always a NODE id: for a `node` advisory that node
   * itself (shown on the Issue tab); for a `split` advisory the split's parent
   * node (shown on the Logic tab, where that node's decomposition lives).
   */
  target: { kind: 'node' | 'split'; id: NodeId };
  category: AdvisoryCategory;
  /** One-line coaching message. */
  message: string;
}

const words = (label: string): number => label.trim().split(/\s+/).filter(Boolean).length;

const truncate = (s: string, n = 42): string => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

// Openers that mark a label as a question even without a "?".
const QUESTION_WORDS = new Set([
  'how',
  'why',
  'what',
  'which',
  'should',
  'can',
  'could',
  'will',
  'would',
  'does',
  'do',
  'is',
  'are',
  'where',
  'who',
  'when',
]);

function isQuestion(label: string): boolean {
  const t = label.trim();
  if (t.endsWith('?')) return true;
  const first = t.toLowerCase().split(/\s+/)[0] ?? '';
  return QUESTION_WORDS.has(first);
}

/**
 * "It's an idea, not a title." Only for **freeform** issue splits — segment /
 * process / framework / formula / binary branches are legitimately terse nouns
 * ("Enterprise", "Acquisition", "Price"). A single bare word there reads as a
 * topic label, not a question / action / hypothesis.
 */
function wholeSentenceAdvisory(node: IssueNode): Advisory | null {
  const label = node.label.trim();
  if (label.endsWith('?')) return null; // already a question
  if (words(label) !== 1) return null; // only lone-word topics
  if (label.length < 3) return null; // skip "A" / "B" style placeholders
  if (/^\d+$/.test(label)) return null; // a bare number is a value, not a topic
  return {
    id: `whole-sentence:${node.id}`,
    target: { kind: 'node', id: node.id },
    category: 'whole-sentence',
    message: `"${label}" is a topic, not an idea — phrase it as a question, action, or hypothesis.`,
  };
}

/** > 7 branches reads as a laundry list (over-weighting CE). Minto: 3–5 is best. */
function branchCountAdvisory(split: Split): Advisory | null {
  const n = split.childIds.length;
  if (n <= MAX_SPLIT_CHILDREN) return null;
  return {
    id: `branch-count:${split.parentId}`,
    target: { kind: 'split', id: split.parentId },
    category: 'branch-count',
    message: `${n} sub-issues reads as a laundry list — group toward ${IDEAL_SPLIT_MAX} or fewer.`,
  };
}

/**
 * Altitude mismatch (Minto "same level of abstraction"; Chevallier "no outlier").
 * Conservative & lexical so it never fires on the normal "decomposed one branch
 * first" case: only when exactly one sibling is a detailed clause (≥5 words) and
 * every other is a bare fragment (≤2 words).
 */
function altitudeAdvisory(doc: IssueTreeDoc, split: Split): Advisory | null {
  const children = childrenOf(doc, split.parentId);
  if (children.length < 3) return null;
  const detailed = children.filter((c) => words(c.label) >= 5);
  const terse = children.filter((c) => words(c.label) <= 2);
  const outlier = detailed[0];
  if (detailed.length !== 1 || !outlier || terse.length !== children.length - 1) return null;
  return {
    id: `altitude:${split.parentId}`,
    target: { kind: 'split', id: split.parentId },
    category: 'altitude',
    message: `"${truncate(outlier.label)}" is far more specific than its siblings — level the branches to one altitude.`,
  };
}

/** A hypothesis is a statement to prove — not a question. Fires when a node has been judged. */
function hypothesisAdvisory(node: IssueNode): Advisory | null {
  if (node.status !== 'supported' && node.status !== 'refuted') return null;
  if (!node.label.trim().endsWith('?')) return null;
  return {
    id: `hypothesis:${node.id}`,
    target: { kind: 'node', id: node.id },
    category: 'hypothesis',
    message: `Marked ${node.status}, but phrased as a question — state the hypothesis as a claim to prove.`,
  };
}

/** Key-question quality on the root: is it a single, well-scoped question? */
function keyQuestionAdvisories(root: IssueNode): Advisory[] {
  const out: Advisory[] = [];
  const label = root.label.trim();
  if (label === '') return out;

  if (!isQuestion(label)) {
    out.push({
      id: `kq-question:${root.id}`,
      target: { kind: 'node', id: root.id },
      category: 'key-question',
      message: 'Frame the key question as a question (how / why / what / should …).',
    });
  }
  const questionMarks = (label.match(/\?/g) ?? []).length;
  if (questionMarks >= 2 || label.includes(';')) {
    out.push({
      id: `kq-compound:${root.id}`,
      target: { kind: 'node', id: root.id },
      category: 'key-question',
      message:
        'This bundles more than one question — narrow to a single key question (run a second tree for the other).',
    });
  }
  const sentences = label.split(/[.!?]+/).filter((s) => s.trim() !== '').length;
  if (label.length > 160 || sentences > 2) {
    out.push({
      id: `kq-length:${root.id}`,
      target: { kind: 'node', id: root.id },
      category: 'key-question',
      message: 'Tighten the key question to a sentence or two so it stays memorable.',
    });
  }
  return out;
}

/**
 * Every coaching advisory for a document, in no particular order. Pure. The
 * inspector filters these by the selected node (`target.id`); nothing here feeds
 * the MECE review dock.
 */
export function advisories(doc: IssueTreeDoc): Advisory[] {
  const out: Advisory[] = [];

  const root = doc.nodes[doc.rootId];
  if (root) out.push(...keyQuestionAdvisories(root));

  for (const split of Object.values(doc.splits)) {
    const count = branchCountAdvisory(split);
    if (count) out.push(count);
    const altitude = altitudeAdvisory(doc, split);
    if (altitude) out.push(altitude);
    if (split.decomposition === 'freeform') {
      for (const child of childrenOf(doc, split.parentId)) {
        const ws = wholeSentenceAdvisory(child);
        if (ws) out.push(ws);
      }
    }
  }

  for (const node of Object.values(doc.nodes)) {
    if (node.id === doc.rootId) continue; // the root is the question, not a hypothesis
    const hyp = hypothesisAdvisory(node);
    if (hyp) out.push(hyp);
  }

  return out;
}

/** Advisories that point at a given node (either the node itself or its split). */
export function advisoriesFor(doc: IssueTreeDoc, nodeId: NodeId): Advisory[] {
  return advisories(doc).filter((a) => a.target.id === nodeId);
}
