// Diagnosis — the "is / is not" facts any root cause must explain, each
// hypothesis's verdict against them, and the test that could kill it.
//
// Kepner-Tregoe's specification: describe the problem by what it IS and the
// closest thing it IS NOT, then judge every candidate cause against the whole
// list. A cause that can't explain "Germany only" is in trouble however much
// evidence it has. This is a reasoning aid, not a verdict machine: the user
// marks each verdict; the domain only collects and summarises them.
//
// Every field here is optional and additive, and can arrive from a file, so it
// is read only through `factsOf()` and `explainsOf()`.
import { childrenOf } from './tree';
import type {
  DiagnosticFact,
  ExplainVerdict,
  FactDimension,
  IssueNode,
  IssueTreeDoc,
  NodeId,
} from './types';

export const FACT_DIMENSIONS: readonly FactDimension[] = ['what', 'where', 'when', 'extent'];
const DIMENSIONS: ReadonlySet<string> = new Set(FACT_DIMENSIONS);
const VERDICTS: ReadonlySet<string> = new Set<ExplainVerdict>(['yes', 'partly', 'no']);

function isFact(v: unknown): v is DiagnosticFact {
  if (typeof v !== 'object' || v === null) return false;
  const f = v as Record<string, unknown>;
  return (
    typeof f.id === 'string' &&
    typeof f.dimension === 'string' &&
    DIMENSIONS.has(f.dimension) &&
    typeof f.is === 'string'
  );
}

/** The document's facts, in the user's order, with malformed entries dropped. */
export function factsOf(doc: Pick<IssueTreeDoc, 'facts'>): DiagnosticFact[] {
  const raw: unknown = doc.facts;
  if (!Array.isArray(raw)) return [];
  return raw.filter(isFact).map((f) => {
    const clean: DiagnosticFact = { id: f.id, dimension: f.dimension, is: f.is };
    if (typeof f.isNot === 'string' && f.isNot.trim() !== '') clean.isNot = f.isNot;
    return clean;
  });
}

/** A node's verdicts, keyed by fact id, with anything that isn't a verdict dropped. */
export function explainsOf(node: Pick<IssueNode, 'explains'>): Record<string, ExplainVerdict> {
  const raw: unknown = node.explains;
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {};
  const out: Record<string, ExplainVerdict> = {};
  for (const [id, v] of Object.entries(raw)) {
    if (typeof v === 'string' && VERDICTS.has(v)) out[id] = v as ExplainVerdict;
  }
  return out;
}

function withFacts(doc: IssueTreeDoc, facts: DiagnosticFact[]): IssueTreeDoc {
  const next = { ...doc };
  if (facts.length === 0) delete next.facts;
  else next.facts = facts;
  return next;
}

/** Append a fact. The caller supplies the id so tests and imports stay deterministic. */
export function addFact(doc: IssueTreeDoc, fact: DiagnosticFact): IssueTreeDoc {
  const facts = factsOf(doc);
  if (facts.some((f) => f.id === fact.id)) return doc;
  const clean: DiagnosticFact = { id: fact.id, dimension: fact.dimension, is: fact.is.trim() };
  if (fact.isNot?.trim()) clean.isNot = fact.isNot.trim();
  return withFacts(doc, [...facts, clean]);
}

/** Edit a fact's dimension or text. Trimmed; an empty is-not clears it; no-op if unchanged. */
export function updateFact(
  doc: IssueTreeDoc,
  id: string,
  patch: { dimension?: FactDimension; is?: string; isNot?: string }
): IssueTreeDoc {
  const facts = factsOf(doc);
  const at = facts.findIndex((f) => f.id === id);
  const fact = facts[at];
  if (!fact) return doc;
  const next: DiagnosticFact = { ...fact };
  if (patch.dimension !== undefined && DIMENSIONS.has(patch.dimension)) {
    next.dimension = patch.dimension;
  }
  if (patch.is !== undefined) next.is = patch.is.trim();
  if (patch.isNot !== undefined) {
    const isNot = patch.isNot.trim();
    if (isNot) next.isNot = isNot;
    else delete next.isNot;
  }
  if (next.dimension === fact.dimension && next.is === fact.is && next.isNot === fact.isNot) {
    return doc;
  }
  return withFacts(
    doc,
    facts.map((f, i) => (i === at ? next : f))
  );
}

/** Remove a fact and every verdict any node holds on it. */
export function removeFact(doc: IssueTreeDoc, id: string): IssueTreeDoc {
  const facts = factsOf(doc);
  if (!facts.some((f) => f.id === id)) return doc;
  const nodes = { ...doc.nodes };
  for (const [nodeId, node] of Object.entries(doc.nodes) as [NodeId, IssueNode][]) {
    const verdicts = explainsOf(node);
    if (!(id in verdicts)) continue;
    delete verdicts[id];
    const updated = { ...node };
    if (Object.keys(verdicts).length === 0) delete updated.explains;
    else updated.explains = verdicts;
    nodes[nodeId] = updated;
  }
  return withFacts(
    { ...doc, nodes },
    facts.filter((f) => f.id !== id)
  );
}

function patchNode(
  doc: IssueTreeDoc,
  nodeId: NodeId,
  fn: (node: IssueNode) => IssueNode | null
): IssueTreeDoc {
  const node = doc.nodes[nodeId];
  if (!node) return doc;
  const next = fn(node);
  return next === null ? doc : { ...doc, nodes: { ...doc.nodes, [nodeId]: next } };
}

/**
 * Record how a hypothesis fares against one fact, or clear it with `null`.
 * A verdict on a fact the document doesn't have is ignored.
 */
export function setExplains(
  doc: IssueTreeDoc,
  nodeId: NodeId,
  factId: string,
  verdict: ExplainVerdict | null
): IssueTreeDoc {
  if (!factsOf(doc).some((f) => f.id === factId)) return doc;
  return patchNode(doc, nodeId, (node) => {
    const verdicts = explainsOf(node);
    if ((verdicts[factId] ?? null) === verdict) return null;
    if (verdict === null) delete verdicts[factId];
    else verdicts[factId] = verdict;
    const next = { ...node };
    if (Object.keys(verdicts).length === 0) delete next.explains;
    else next.explains = verdicts;
    return next;
  });
}

function setText(
  doc: IssueTreeDoc,
  nodeId: NodeId,
  key: 'killTest' | 'prediction',
  value: string
): IssueTreeDoc {
  const text = value.trim();
  return patchNode(doc, nodeId, (node) => {
    if ((node[key] ?? '') === text) return null;
    const next = { ...node };
    if (text) next[key] = text;
    else delete next[key];
    return next;
  });
}

/** What would prove this hypothesis wrong. Empty clears it. */
export function setKillTest(doc: IssueTreeDoc, nodeId: NodeId, value: string): IssueTreeDoc {
  return setText(doc, nodeId, 'killTest', value);
}

/** What we expect to see next time if it is true. Empty clears it. */
export function setPrediction(doc: IssueTreeDoc, nodeId: NodeId, value: string): IssueTreeDoc {
  return setText(doc, nodeId, 'prediction', value);
}

/** One hypothesis's standing against the fact list (fact ids, in fact order). */
export interface CoverageRow {
  nodeId: NodeId;
  yes: string[];
  partly: string[];
  no: string[];
  unjudged: string[];
  /** Explains every fact outright ("partly" doesn't count). */
  explainsAll: boolean;
  /** Fails to explain at least one fact — the strongest sign it isn't the cause. */
  ruledOutByFacts: boolean;
}

/**
 * Every judged hypothesis (a non-root node with at least one verdict on a
 * current fact), in tree order, with its verdicts grouped. Empty when the
 * document has no facts.
 */
export function coverage(doc: IssueTreeDoc): CoverageRow[] {
  const facts = factsOf(doc);
  if (facts.length === 0) return [];
  const rows: CoverageRow[] = [];
  const visit = (id: NodeId) => {
    const node = doc.nodes[id];
    if (!node) return;
    if (id !== doc.rootId) {
      const verdicts = explainsOf(node);
      if (facts.some((f) => f.id in verdicts)) {
        const pick = (v: ExplainVerdict) =>
          facts.filter((f) => verdicts[f.id] === v).map((f) => f.id);
        const yes = pick('yes');
        const no = pick('no');
        rows.push({
          nodeId: id,
          yes,
          partly: pick('partly'),
          no,
          unjudged: facts.filter((f) => !(f.id in verdicts)).map((f) => f.id),
          explainsAll: yes.length === facts.length,
          ruledOutByFacts: no.length > 0,
        });
      }
    }
    for (const child of childrenOf(doc, id)) visit(child.id);
  };
  visit(doc.rootId);
  return rows;
}
