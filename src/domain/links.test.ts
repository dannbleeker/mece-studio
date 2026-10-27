import { describe, expect, it } from 'vitest';
import { en } from '@/i18n/locales/en';
import { toMarkdown } from './export';
import { createDoc } from './factory';
import { addLink, linksFor, linksOf, pruneLinks, removeLink, setLinkNote } from './links';
import { recomputeMece } from './mece';
import { addChild, removeNode } from './tree';
import type { IssueTreeDoc } from './types';

function tree() {
  let doc: IssueTreeDoc = createDoc('Why are page loads slow?', 0);
  const db = addChild(doc, doc.rootId, 'Database slow at peak');
  doc = db.doc;
  const link = addChild(doc, doc.rootId, 'Network link full');
  doc = link.doc;
  const cache = addChild(doc, doc.rootId, 'Cache misses');
  doc = cache.doc;
  return { doc, db: db.childId, net: link.childId, cache: cache.childId };
}

describe('combined-cause links', () => {
  it('adds a link once per pair, in either direction', () => {
    let { doc, db, net } = tree();
    doc = addLink(doc, { id: 'l1', a: db, b: net, note: ' only together ' });
    expect(addLink(doc, { id: 'l2', a: net, b: db })).toBe(doc);
    expect(linksOf(doc)).toEqual([{ id: 'l1', a: db, b: net, note: 'only together' }]);
    expect(linksFor(doc, net).map((l) => l.id)).toEqual(['l1']);
  });

  it('refuses the root, a self-link and an unknown node', () => {
    const { doc, db } = tree();
    expect(addLink(doc, { id: 'x', a: db, b: doc.rootId })).toBe(doc);
    expect(addLink(doc, { id: 'x', a: db, b: db })).toBe(doc);
    expect(addLink(doc, { id: 'x', a: db, b: 'nope' as typeof db })).toBe(doc);
  });

  it('edits and removes a link, dropping the field when none are left', () => {
    let { doc, db, net } = tree();
    doc = addLink(doc, { id: 'l1', a: db, b: net });
    doc = setLinkNote(doc, 'l1', 'slow back end x busy link');
    expect(linksOf(doc)[0]?.note).toBe('slow back end x busy link');
    expect(setLinkNote(doc, 'l1', 'slow back end x busy link')).toBe(doc);
    doc = setLinkNote(doc, 'l1', '');
    expect(linksOf(doc)[0]).not.toHaveProperty('note');
    doc = removeLink(doc, 'l1');
    expect(doc).not.toHaveProperty('links');
  });

  it('goes with a removed node', () => {
    let { doc, db, net, cache } = tree();
    doc = addLink(doc, { id: 'l1', a: db, b: net });
    doc = addLink(doc, { id: 'l2', a: cache, b: net });
    doc = removeNode(doc, db);
    expect(doc.links?.map((l) => l.id)).toEqual(['l2']);
  });

  it('drops malformed, dangling and repeated links from a file', () => {
    const { doc, db, net } = tree();
    const raw = {
      ...doc,
      links: [
        { id: 'ok', a: db, b: net },
        { id: 'dup', a: net, b: db },
        { id: 'gone', a: db, b: 'deleted' },
        { id: 'self', a: db, b: db },
        { a: db, b: net },
        'junk',
      ],
    } as unknown as IssueTreeDoc;
    expect(linksOf(raw).map((l) => l.id)).toEqual(['ok']);
    expect(pruneLinks(raw).links?.map((l) => l.id)).toEqual(['ok']);
  });

  it('never touches the tree or its MECE result', () => {
    const { doc, db, net } = tree();
    const linked = addLink(doc, { id: 'l1', a: db, b: net });
    expect(linked.splits).toBe(doc.splits);
    expect(recomputeMece(linked).splits).toEqual(recomputeMece(doc).splits);
  });

  it('lists the links after the tree in the Markdown outline', () => {
    let { doc, db, net } = tree();
    doc = addLink(doc, { id: 'l1', a: db, b: net, note: 'only together' });
    const md = toMarkdown(doc, en);
    expect(md).toContain(
      `${en.exports.linksHeading}\n\n${en.exports.linkLine({ a: 'Database slow at peak', b: 'Network link full', note: 'only together' })}`
    );
    expect(md.indexOf(en.exports.linksHeading)).toBeGreaterThan(md.indexOf('Cache misses'));
  });
});
