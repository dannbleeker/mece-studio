import { toMarkdown } from './export';
import type { IssueTreeDoc, NodeId } from './types';

/**
 * A ready-to-paste prompt asking an AI (Claude, ChatGPT, …) to critique the
 * tree's MECE and structure. Keyless by design — the app has no backend, so we
 * hand the user a prompt to run in their own tool rather than call an API.
 */
export function critiquePrompt(doc: IssueTreeDoc): string {
  return [
    'You are a McKinsey-style problem-solving coach. Below is an issue tree in',
    'Markdown — each decomposition is annotated with its MECE status (ME = mutually',
    'exclusive, CE = collectively exhaustive).',
    '',
    'Critique it:',
    '1. For each split, is it genuinely MECE? Call out overlaps (not ME) and gaps (not CE).',
    '2. Are the branches framed as sharp, testable issues — and are the right ones prioritised?',
    "3. What's missing, redundant, or mis-framed? Reference node labels.",
    '',
    'Tree:',
    '',
    toMarkdown(doc),
  ].join('\n');
}

/** A prompt asking an AI to propose a MECE decomposition for one node. */
export function decomposePrompt(doc: IssueTreeDoc, nodeId: NodeId): string {
  const label = doc.nodes[nodeId]?.label ?? '';
  return [
    'You are a McKinsey-style problem-solving coach. Below is an issue tree in Markdown.',
    `Propose a MECE decomposition for the node "${label}": 2–5 mutually exclusive,`,
    'collectively exhaustive sub-issues (short labels), and name the single dimension you',
    'split on. Keep it consistent with the rest of the tree.',
    '',
    'Tree:',
    '',
    toMarkdown(doc),
    '',
    `Node to decompose: "${label}"`,
  ].join('\n');
}
