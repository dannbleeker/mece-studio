// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { childrenOf } from '@/domain/tree';
import { en } from '@/i18n/locales/en';
import { type ImportLabels, opmlToDoc } from './opmlImport';

// Real catalogue values, so the test fails if the labels stop being wired
// through from the active locale.
const LABELS: ImportLabels = {
  root: en.content.importedOutlineLabel,
  untitled: en.content.untitled,
};

const OPML = `<?xml version="1.0"?>
<opml version="2.0"><head><title>T</title></head><body>
<outline text="Why are sales down?">
  <outline text="Pricing"><outline text="Too high"/></outline>
  <outline text="Demand"/>
</outline>
</body></opml>`;

describe('opmlToDoc', () => {
  it('builds a tree from a nested OPML outline', () => {
    const doc = opmlToDoc(OPML, 1, LABELS);
    expect(doc).not.toBeNull();
    if (!doc) return;
    expect(doc.nodes[doc.rootId]?.label).toBe('Why are sales down?');
    const kids = childrenOf(doc, doc.rootId);
    expect(kids.map((n) => n.label)).toEqual(['Pricing', 'Demand']);
    const pricing = kids[0];
    if (pricing) expect(childrenOf(doc, pricing.id).map((n) => n.label)).toEqual(['Too high']);
  });

  it('words an unnamed outline from the catalogue, not a hardcoded English label', () => {
    const doc = opmlToDoc(
      '<opml version="2.0"><body><outline text="Root"><outline/></outline></body></opml>',
      1,
      { root: LABELS.root, untitled: 'ZZ-untitled' }
    );
    expect(doc).not.toBeNull();
    if (!doc) return;
    expect(childrenOf(doc, doc.rootId)[0]?.label).toBe('ZZ-untitled');
  });

  it('returns null when there are no outlines to import', () => {
    expect(opmlToDoc('<opml><body></body></opml>', 1, LABELS)).toBeNull();
    expect(opmlToDoc('not xml at all', 1, LABELS)).toBeNull();
  });

  it('caps a pathologically large OPML at the node limit', () => {
    const children = Array.from({ length: 600 }, (_, i) => `<outline text="n${i}"/>`).join('');
    const big = `<opml version="2.0"><body><outline text="Root">${children}</outline></body></opml>`;
    const doc = opmlToDoc(big, 1, LABELS);
    expect(doc).not.toBeNull();
    if (!doc) return;
    const count = Object.keys(doc.nodes).length;
    expect(count).toBeLessThanOrEqual(500); // capped
    expect(count).toBeGreaterThan(400); // but did import the bulk
  });
});
