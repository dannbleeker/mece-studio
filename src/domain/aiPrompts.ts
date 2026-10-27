import type { EditorMessages } from '@/i18n/types';
import { toMarkdown } from './export';
import { childrenOf } from './tree';
import type { IssueTreeDoc, NodeId } from './types';

/**
 * A ready-to-paste prompt asking an AI (Claude, ChatGPT, …) to critique the
 * tree's MECE and structure. Keyless by design — the app has no backend, so we
 * hand the user a prompt to run in their own tool rather than call an API. The
 * wording is the reader's, so a Danish tree gets critiqued in Danish.
 */
export function critiquePrompt(doc: IssueTreeDoc, m: EditorMessages): string {
  return m.exports.aiCritique({ tree: toMarkdown(doc, m) });
}

/** A prompt asking an AI to propose a MECE decomposition for one node. */
export function decomposePrompt(doc: IssueTreeDoc, nodeId: NodeId, m: EditorMessages): string {
  return m.exports.aiDecompose({
    label: doc.nodes[nodeId]?.label ?? '',
    tree: toMarkdown(doc, m),
  });
}

/**
 * A prompt asking an AI to judge ONE split's MECE on meaning. The rule engine
 * compares wording only, so a split it can't prove ("not proven") is exactly
 * where a reader's judgement — or an AI's — has to take over. Names the parent
 * and its branches up front so the answer stays on this split.
 */
export function splitCheckPrompt(doc: IssueTreeDoc, nodeId: NodeId, m: EditorMessages): string {
  return m.exports.aiSplitCheck({
    label: doc.nodes[nodeId]?.label ?? '',
    branches: childrenOf(doc, nodeId).map((c) => c.label),
    tree: toMarkdown(doc, m),
  });
}
