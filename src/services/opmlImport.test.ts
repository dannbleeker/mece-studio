// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { childrenOf } from '@/domain/tree';
import { opmlToDoc } from './opmlImport';

const OPML = `<?xml version="1.0"?>
<opml version="2.0"><head><title>T</title></head><body>
<outline text="Why are sales down?">
  <outline text="Pricing"><outline text="Too high"/></outline>
  <outline text="Demand"/>
</outline>
</body></opml>`;

describe('opmlToDoc', () => {
  it('builds a tree from a nested OPML outline', () => {
    const doc = opmlToDoc(OPML, 1);
    expect(doc).not.toBeNull();
    if (!doc) return;
    expect(doc.nodes[doc.rootId]?.label).toBe('Why are sales down?');
    const kids = childrenOf(doc, doc.rootId);
    expect(kids.map((n) => n.label)).toEqual(['Pricing', 'Demand']);
    const pricing = kids[0];
    if (pricing) expect(childrenOf(doc, pricing.id).map((n) => n.label)).toEqual(['Too high']);
  });

  it('returns null when there are no outlines to import', () => {
    expect(opmlToDoc('<opml><body></body></opml>', 1)).toBeNull();
    expect(opmlToDoc('not xml at all', 1)).toBeNull();
  });
});
