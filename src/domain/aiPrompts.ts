import type { Messages } from '@/i18n/types';
import { toMarkdown } from './export';
import type { IssueTreeDoc, NodeId } from './types';

/**
 * A ready-to-paste prompt asking an AI (Claude, ChatGPT, …) to critique the
 * tree's MECE and structure. Keyless by design — the app has no backend, so we
 * hand the user a prompt to run in their own tool rather than call an API. The
 * wording is the reader's, so a Danish tree gets critiqued in Danish.
 */
export function critiquePrompt(doc: IssueTreeDoc, m: Messages): string {
  return m.exports.aiCritique({ tree: toMarkdown(doc, m) });
}

/** A prompt asking an AI to propose a MECE decomposition for one node. */
export function decomposePrompt(doc: IssueTreeDoc, nodeId: NodeId, m: Messages): string {
  return m.exports.aiDecompose({
    label: doc.nodes[nodeId]?.label ?? '',
    tree: toMarkdown(doc, m),
  });
}
