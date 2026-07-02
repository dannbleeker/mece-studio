import type { IssueTreeDoc } from './types';

/**
 * Strip a document down to a reusable template: its structure and labels (nodes,
 * splits, decomposition, dimension, operator) with all instance data removed —
 * values, evidence, priority, notes, hypothesis status, and the governing answer.
 * So a saved template seeds a clean starting point, not a filled-in analysis. Pure.
 */
export function templateFromDoc(doc: IssueTreeDoc): IssueTreeDoc {
  const nodes = {} as IssueTreeDoc['nodes'];
  for (const n of Object.values(doc.nodes)) {
    nodes[n.id] = { id: n.id, label: n.label, status: 'open', evidence: [] };
  }
  const template: IssueTreeDoc = { ...doc, nodes };
  delete template.answer;
  return template;
}
