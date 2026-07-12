import type { IssueTreeDoc } from './types';

/**
 * Strip a document down to a reusable template: its structure and labels (nodes,
 * splits, decomposition, dimension, operator, and the structural `logic` mode)
 * with all instance data removed — values, evidence, priority, notes, hypothesis
 * status, the governing answer, the problem brief, and each split's "so-what"
 * summary. So a saved template seeds a clean starting point, not a filled-in
 * analysis. Pure.
 */
export function templateFromDoc(doc: IssueTreeDoc): IssueTreeDoc {
  const nodes = {} as IssueTreeDoc['nodes'];
  for (const n of Object.values(doc.nodes)) {
    nodes[n.id] = { id: n.id, label: n.label, status: 'open', evidence: [] };
  }
  // Splits carry structure (kept), but a split's `summary` is instance data.
  const splits = {} as IssueTreeDoc['splits'];
  for (const s of Object.values(doc.splits)) {
    if (s.summary === undefined) {
      splits[s.id] = s;
    } else {
      const next = { ...s };
      delete next.summary;
      splits[s.id] = next;
    }
  }
  const template: IssueTreeDoc = { ...doc, nodes, splits };
  delete template.answer;
  delete template.problemBrief;
  return template;
}
