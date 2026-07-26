import { describe, expect, it } from 'vitest';
import { createDoc } from './factory';
import { matchesQuery, searchNodes } from './search';
import { addChild } from './tree';

describe('matchesQuery', () => {
  it('matches case-insensitively as a substring', () => {
    expect(matchesQuery('Pricing strategy', 'price', 'en')).toBe(false); // not a substring
    expect(matchesQuery('Pricing strategy', 'pric', 'en')).toBe(true);
    expect(matchesQuery('Pricing strategy', 'STRATEGY', 'en')).toBe(true);
  });

  it('treats a blank query as no match', () => {
    expect(matchesQuery('anything', '', 'en')).toBe(false);
    expect(matchesQuery('anything', '   ', 'en')).toBe(false);
  });
});

describe('searchNodes', () => {
  it('returns the ids of every matching node', () => {
    let doc = createDoc('Why are costs high?', 1);
    const a = addChild(doc, doc.rootId, 'Labour cost');
    doc = a.doc;
    const b = addChild(doc, doc.rootId, 'Material cost');
    doc = b.doc;
    const c = addChild(doc, doc.rootId, 'Overheads');
    doc = c.doc;

    const hits = searchNodes(doc, 'cost', 'en');
    expect(hits).toContain(a.childId);
    expect(hits).toContain(b.childId);
    expect(hits).toContain(doc.rootId); // "...costs high?"
    expect(hits).not.toContain(c.childId);
  });

  it('returns nothing for a blank query', () => {
    const doc = createDoc('Root', 1);
    expect(searchNodes(doc, '', 'en')).toEqual([]);
  });
});
