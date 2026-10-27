// Combined-cause links: "these two may only cause it together".
//
// An issue tree is strict: each node sits under exactly one parent, and the
// MECE checks assume it. Real causes sometimes need each other (a slower back
// end is fine on a fast link and a busy link is fine with a fast back end;
// together they're the problem). A link records that as a note over the tree:
// it is drawn as an overlay, never laid out, never seen by the MECE engine,
// and never makes a node reachable twice. Read only through `linksOf()`,
// because links can arrive from a file.
import type { CauseLink, IssueTreeDoc, NodeId } from './types';

/** An unordered pair key, so A–B and B–A are the same link. */
const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

/**
 * The document's links, in the user's order: malformed entries, links to a
 * node that no longer exists, self-links and repeated pairs are dropped.
 */
export function linksOf(doc: Pick<IssueTreeDoc, 'links' | 'nodes'>): CauseLink[] {
  const raw: unknown = doc.links;
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: CauseLink[] = [];
  for (const v of raw) {
    if (typeof v !== 'object' || v === null) continue;
    const l = v as Record<string, unknown>;
    if (typeof l.id !== 'string' || typeof l.a !== 'string' || typeof l.b !== 'string') continue;
    if (l.a === l.b || !doc.nodes[l.a as NodeId] || !doc.nodes[l.b as NodeId]) continue;
    const key = pairKey(l.a, l.b);
    if (seen.has(key)) continue;
    seen.add(key);
    const link: CauseLink = { id: l.id, a: l.a as NodeId, b: l.b as NodeId };
    if (typeof l.note === 'string' && l.note.trim() !== '') link.note = l.note;
    out.push(link);
  }
  return out;
}

/** The links touching one node. */
export function linksFor(doc: IssueTreeDoc, nodeId: NodeId): CauseLink[] {
  return linksOf(doc).filter((l) => l.a === nodeId || l.b === nodeId);
}

function withLinks(doc: IssueTreeDoc, links: CauseLink[]): IssueTreeDoc {
  const next = { ...doc };
  if (links.length === 0) delete next.links;
  else next.links = links;
  return next;
}

/**
 * Link two nodes. No-op for the root (it is the question, not a cause), a
 * node linked to itself, an unknown node, or a pair already linked. The
 * caller supplies the id so tests and imports stay deterministic.
 */
export function addLink(doc: IssueTreeDoc, link: CauseLink): IssueTreeDoc {
  const { a, b } = link;
  if (a === b || a === doc.rootId || b === doc.rootId) return doc;
  if (!doc.nodes[a] || !doc.nodes[b]) return doc;
  const links = linksOf(doc);
  if (links.some((l) => l.id === link.id || pairKey(l.a, l.b) === pairKey(a, b))) return doc;
  const clean: CauseLink = { id: link.id, a, b };
  if (link.note?.trim()) clean.note = link.note.trim();
  return withLinks(doc, [...links, clean]);
}

export function removeLink(doc: IssueTreeDoc, id: string): IssueTreeDoc {
  const links = linksOf(doc);
  if (!links.some((l) => l.id === id)) return doc;
  return withLinks(
    doc,
    links.filter((l) => l.id !== id)
  );
}

/** Set how the two combine. Trimmed; empty clears; no-op if unchanged. */
export function setLinkNote(doc: IssueTreeDoc, id: string, note: string): IssueTreeDoc {
  const links = linksOf(doc);
  const at = links.findIndex((l) => l.id === id);
  const link = links[at];
  if (!link) return doc;
  const text = note.trim();
  if ((link.note ?? '') === text) return doc;
  const next: CauseLink = { id: link.id, a: link.a, b: link.b };
  if (text) next.note = text;
  return withLinks(
    doc,
    links.map((l, i) => (i === at ? next : l))
  );
}

/** Drop links whose nodes are gone. Called after node removal so a save stays clean. */
export function pruneLinks(doc: IssueTreeDoc): IssueTreeDoc {
  if (doc.links === undefined) return doc;
  const links = linksOf(doc);
  return links.length === doc.links.length ? doc : withLinks(doc, links);
}
