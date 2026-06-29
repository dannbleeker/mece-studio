import { createDoc } from './factory';
import { addChild } from './tree';
import type { IssueTreeDoc, NodeId } from './types';

/**
 * Build an issue tree from a pasted Markdown / indented outline.
 *
 * Structural import: it recovers the *hierarchy and labels*, not MECE state or
 * evidence (the JSON path is the lossless one). Accepts ATX headings (`#`…),
 * bullet lists (`-`/`*`/`+`), and numbered lists, with nesting from heading
 * level and/or indentation. The first heading/line becomes the root question;
 * everything else nests beneath it. Pure, so it's unit-testable.
 */

/** A guard against pathological pastes turning into enormous trees. */
const MAX_NODES = 500;
/** Indent (in spaces) that counts as one nesting level. */
const INDENT_WIDTH = 2;

interface OutlineItem {
  depth: number;
  label: string;
}

/** Strip a label of our own export annotations and collapse whitespace. */
function cleanLabel(text: string): string {
  return text
    .replace(/\s*_\[[^\]]*\]_\s*$/, '') // trailing MECE note: _[segment · ME:… · CE:…]_
    .replace(/\s+/g, ' ')
    .trim();
}

/** Parse outline text into depth-tagged items (headings + bullets). */
function parseOutline(text: string): OutlineItem[] {
  const items: OutlineItem[] = [];
  // Depth of the most recent heading, so bullets nest beneath their section.
  let headingDepth = -1;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/\t/g, ' '.repeat(INDENT_WIDTH));
    if (!line.trim()) continue;

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const label = cleanLabel(heading[2] ?? '');
      if (label) {
        const depth = heading[1].length - 1;
        items.push({ depth, label });
        headingDepth = depth;
      }
      continue;
    }

    const bullet = line.match(/^(\s*)(?:[-*+]|\d+[.)])\s+(.+)$/);
    if (bullet) {
      const label = cleanLabel(bullet[2] ?? '');
      // Skip our exported evidence lines ("- ✓ (strength) …" / "- ✗ …").
      if (!label || /^[✓✗]\s/.test(label)) continue;
      const indent = Math.floor((bullet[1]?.length ?? 0) / INDENT_WIDTH);
      items.push({ depth: headingDepth + 1 + indent, label });
      continue;
    }

    // A bare prose line only seeds the root (so a plain title line works); once
    // there's structure, loose prose is ignored rather than turned into nodes.
    if (items.length === 0) {
      const label = cleanLabel(line);
      if (label) {
        items.push({ depth: 0, label });
        headingDepth = 0;
      }
    }
  }
  return items;
}

/** Parse a Markdown / indented outline into a fresh issue tree, or null if empty. */
export function markdownToDoc(text: string, now: number): IssueTreeDoc | null {
  const items = parseOutline(text).slice(0, MAX_NODES);
  const [first, ...rest] = items;
  if (!first) return null;

  // The first (shallowest) item is the root; the rest nest via a depth stack.
  let doc = createDoc(first.label, now);
  const stack: { depth: number; id: NodeId }[] = [{ depth: first.depth, id: doc.rootId }];

  for (const item of rest) {
    // Pop back to the nearest shallower ancestor (root never pops — every node
    // ends up somewhere, so a malformed outline still yields one tree).
    while (stack.length > 1 && (stack[stack.length - 1]?.depth ?? -1) >= item.depth) stack.pop();
    const parent = stack[stack.length - 1];
    if (!parent) break;
    const added = addChild(doc, parent.id, item.label);
    doc = added.doc;
    stack.push({ depth: item.depth, id: added.childId });
  }
  return doc;
}
