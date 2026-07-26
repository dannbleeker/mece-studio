import { createDoc } from '@/domain/factory';
import { MAX_NODES } from '@/domain/markdownImport';
import { addChild } from '@/domain/tree';
import type { IssueTreeDoc, NodeId } from '@/domain/types';

/** Locale-supplied fallback labels for an import that names things poorly. */
export interface ImportLabels {
  /** Root question when the source names no top-level outline. */
  root: string;
  /** Node label when an outline carries neither `text` nor `title`. */
  untitled: string;
}

/** An OPML `<outline>`'s label — `text` (the OPML standard) or `title`. */
function outlineLabel(el: Element): string {
  return (el.getAttribute('text') ?? el.getAttribute('title') ?? '').trim();
}

/** Direct `<outline>` children of an element. */
function childOutlines(el: Element): Element[] {
  return [...el.children].filter((c) => c.tagName.toLowerCase() === 'outline');
}

/**
 * Parse an OPML document (the outliner / mind-map interchange format —
 * MindManager, OmniOutliner, Workflowy, Dynalist) into a fresh issue tree. The
 * first `<body>` outline is the root; nested `<outline>`s become children. Uses
 * `DOMParser`, so it lives in services (not the framework-free domain). Returns
 * null when the text isn't parseable OPML.
 */
export function opmlToDoc(
  text: string,
  now: number,
  /**
   * Names for outlines the OPML leaves unlabelled. Passed in because they are
   * words that become node labels — seeded content, read from the active locale
   * by the caller (`m.content.importedOutlineLabel` / `m.content.untitled`).
   */
  labels: ImportLabels
): IssueTreeDoc | null {
  let dom: Document;
  try {
    dom = new DOMParser().parseFromString(text, 'application/xml');
  } catch {
    return null;
  }
  if (dom.querySelector('parsererror')) return null;

  const body = dom.querySelector('opml > body') ?? dom.querySelector('body');
  const tops = body ? childOutlines(body) : [];
  const first = tops[0];
  if (!first) return null;

  let doc = createDoc(outlineLabel(first) || labels.root, now);

  // Cap total nodes (like the Markdown importer) so a pathologically wide/deep
  // third-party OPML can't hang or overflow the tab on import. Bounding the count
  // also bounds recursion depth, so no depth-bomb.
  let count = 1; // the root
  const graft = (el: Element, parentId: NodeId): void => {
    for (const child of childOutlines(el)) {
      if (count >= MAX_NODES) return;
      const added = addChild(doc, parentId, outlineLabel(child) || labels.untitled);
      doc = added.doc;
      count++;
      graft(child, added.childId);
    }
  };
  graft(first, doc.rootId);
  // Extra top-level outlines (a flat OPML) become further branches of the root.
  for (const sibling of tops.slice(1)) {
    if (count >= MAX_NODES) break;
    const added = addChild(doc, doc.rootId, outlineLabel(sibling) || labels.untitled);
    doc = added.doc;
    count++;
    graft(sibling, added.childId);
  }
  return doc;
}
