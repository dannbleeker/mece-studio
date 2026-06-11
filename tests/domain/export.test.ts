import { describe, expect, it } from 'vitest';
import { toMarkdown } from '@/domain/export';
import { createDoc } from '@/domain/factory';
import { recomputeMece } from '@/domain/mece';
import { addChild, setDecomposition, setDetail } from '@/domain/tree';

describe('toMarkdown', () => {
  it('renders the root as H1 with its MECE note and children as bullets', () => {
    let doc = createDoc('Why is profit down?', 1000);
    doc = addChild(doc, doc.rootId, 'Revenue').doc;
    doc = addChild(doc, doc.rootId, 'Cost').doc;
    doc = setDecomposition(doc, doc.rootId, 'binary');
    doc = recomputeMece(doc);

    const md = toMarkdown(doc);
    expect(md).toContain('# Why is profit down?');
    expect(md).toContain('- Revenue');
    expect(md).toContain('- Cost');
    expect(md).toContain('ME:pass');
  });

  it('includes node notes as an italic line', () => {
    let doc = createDoc('Root', 1000);
    doc = setDetail(doc, doc.rootId, 'Key assumption: demand is flat.');
    const { doc: d1, childId } = addChild(doc, doc.rootId, 'Branch');
    doc = setDetail(d1, childId, 'Owner: finance.');
    const md = toMarkdown(doc);
    expect(md).toContain('_Key assumption: demand is flat._');
    expect(md).toContain('_Owner: finance._');
  });

  it('nests descendants with indentation', () => {
    let doc = createDoc('Root', 1000);
    const { doc: d1, childId } = addChild(doc, doc.rootId, 'Parent');
    doc = addChild(d1, childId, 'Child').doc;
    const md = toMarkdown(doc);
    expect(md).toContain('- Parent');
    expect(md).toContain('  - Child');
  });
});
