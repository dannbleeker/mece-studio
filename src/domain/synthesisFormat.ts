import { synthesise } from './synthesis';
import type { IssueTreeDoc } from './types';

/** A typed line of the answer-first synthesis — for rich (non-`<pre>`) rendering. */
type SynthLineKind =
  | 'title'
  | 'situation'
  | 'complication'
  | 'answer'
  | 'verdict'
  | 'lead'
  | 'branch'
  | 'insight'
  | 'meta'
  | 'blank';

export interface SynthLine {
  kind: SynthLineKind;
  text: string;
  /** Nesting depth (0 = top branch) — from the source indentation. */
  depth: number;
}

/** Drop the Markdown emphasis the synthesis uses so display text reads cleanly. */
function stripEmphasis(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/_\(([^)]*)\)_/g, '($1)')
    .replace(/_\[([^\]]*)\]_/g, '[$1]');
}

/**
 * Parse the `synthesise()` Markdown into typed lines so the same content can be
 * rendered as a formatted panel (React) or a one-page HTML deliverable — instead
 * of a raw monospace block. Pure; the Markdown stays the single source of truth.
 */
export function formatSynthesis(md: string): SynthLine[] {
  const out: SynthLine[] = [];
  for (const raw of md.split('\n')) {
    if (raw.trim() === '') {
      out.push({ kind: 'blank', text: '', depth: 0 });
      continue;
    }
    if (raw.startsWith('# ')) {
      out.push({ kind: 'title', text: raw.slice(2).trim(), depth: 0 });
      continue;
    }
    if (raw.startsWith('**Answer:**')) {
      out.push({ kind: 'answer', text: raw.replace('**Answer:**', '').trim(), depth: 0 });
      continue;
    }
    if (raw.startsWith('**Situation:**')) {
      out.push({ kind: 'situation', text: raw.replace('**Situation:**', '').trim(), depth: 0 });
      continue;
    }
    if (raw.startsWith('**Complication:**')) {
      out.push({
        kind: 'complication',
        text: raw.replace('**Complication:**', '').trim(),
        depth: 0,
      });
      continue;
    }
    const trimmed = raw.trimStart();
    const depth = Math.floor((raw.length - trimmed.length) / 2);
    if (/^_Verdict:/.test(trimmed)) {
      out.push({ kind: 'verdict', text: trimmed.replace(/^_/, '').replace(/_$/, ''), depth: 0 });
      continue;
    }
    if (trimmed.startsWith('» ')) {
      out.push({ kind: 'insight', text: stripEmphasis(trimmed.slice(2)), depth });
      continue;
    }
    if (trimmed.startsWith('- ')) {
      out.push({ kind: 'branch', text: stripEmphasis(trimmed.slice(2)), depth });
      continue;
    }
    if (/^(value:|rolls up|most sensitive to:|evidence:)/.test(trimmed)) {
      out.push({ kind: 'meta', text: stripEmphasis(trimmed), depth });
      continue;
    }
    out.push({ kind: 'lead', text: stripEmphasis(trimmed), depth: 0 });
  }
  return out;
}

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * A standalone, self-contained one-page HTML deliverable of the answer-first
 * synthesis — a governing thesis on top, a verdict, then the branches in
 * priority order. Reads like a memo, not a canvas screenshot. Pure string.
 */
export function answerPageHtml(doc: IssueTreeDoc): string {
  const lines = formatSynthesis(synthesise(doc));
  const body = lines
    .map((l) => {
      const indent = l.depth * 18;
      switch (l.kind) {
        case 'title':
          return `<h1>${escapeHtml(l.text)}</h1>`;
        case 'situation':
          return `<p class="brief"><strong>Situation.</strong> ${escapeHtml(l.text)}</p>`;
        case 'complication':
          return `<p class="brief"><strong>Complication.</strong> ${escapeHtml(l.text)}</p>`;
        case 'answer':
          return `<p class="answer">${escapeHtml(l.text)}</p>`;
        case 'verdict':
          return `<p class="verdict">${escapeHtml(l.text)}</p>`;
        case 'lead':
          return `<p class="lead">${escapeHtml(l.text)}</p>`;
        case 'branch':
          return `<div class="branch" style="margin-left:${indent}px">${escapeHtml(l.text)}</div>`;
        case 'insight':
          return `<div class="insight" style="margin-left:${indent}px">→ ${escapeHtml(l.text)}</div>`;
        case 'meta':
          return `<div class="meta" style="margin-left:${indent + 18}px">${escapeHtml(l.text)}</div>`;
        default:
          return '';
      }
    })
    .join('\n');

  const title = escapeHtml(doc.nodes[doc.rootId]?.label ?? 'MECE Studio answer');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<style>
  :root { color-scheme: light; }
  body { margin: 0; background: #faf9f5; color: #2b2a27;
    font: 15px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  main { max-width: 760px; margin: 40px auto; background: #fff; padding: 48px 56px;
    border: 1px solid #e7e4dc; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,.05); }
  h1 { margin: 0 0 4px; font-size: 22px; color: #3f6fb0; letter-spacing: -.01em; }
  .answer { font-size: 18px; font-weight: 600; color: #1f2937; margin: 12px 0 4px; }
  .brief { color: #4b5563; margin: 2px 0; }
  .verdict { color: #8a5a14; font-style: italic; margin: 0 0 12px; }
  .lead { color: #4b5563; margin: 0 0 16px; }
  .branch { padding: 3px 0; }
  .insight { color: #3f6fb0; font-style: italic; padding: 1px 0; }
  .meta { color: #6b7280; font-size: 13px; padding: 1px 0; }
  footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #eee;
    color: #9ca3af; font-size: 12px; }
</style>
</head>
<body>
<main>
${body}
<footer>Answer-first synthesis · generated by MECE Studio</footer>
</main>
</body>
</html>
`;
}
