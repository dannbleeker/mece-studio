import { describe, expect, it } from 'vitest';
import { createDoc, createNode, createSplit } from '@/domain/factory';

describe('factory', () => {
  it('createDoc seeds a single root question', () => {
    const doc = createDoc('Why are sales down?', 1_000);
    expect(doc.schemaVersion).toBe(1);
    expect(doc.layout.direction).toBe('LR');
    expect(Object.keys(doc.splits)).toHaveLength(0);
    expect(doc.createdAt).toBe(1_000);

    const root = doc.nodes[doc.rootId];
    expect(root?.label).toBe('Why are sales down?');
    expect(root?.status).toBe('open');
  });

  it('createNode starts open with no evidence', () => {
    const node = createNode('Pricing too high');
    expect(node.status).toBe('open');
    expect(node.evidence).toEqual([]);
  });

  // `locale` is written but not yet read by any behaviour (see the field's
  // JSDoc). These pin it so it can't be silently dropped on the way to the
  // feature that will read it — knip can't see an interface field, so a test is
  // the only thing standing between "recorded for later" and dead weight.
  it('createDoc stamps the locale it was seeded in, when given one', () => {
    expect(createDoc('Q', 1, { locale: 'en' }).locale).toBe('en');
  });

  it('createDoc omits locale entirely when none is given, rather than guessing', () => {
    const doc = createDoc('Q', 1);
    expect('locale' in doc).toBe(false);
  });

  it('createDoc takes its title from the caller and defaults to empty, not English', () => {
    expect(createDoc('Q', 1, { title: 'Mit træ' }).title).toBe('Mit træ');
    expect(createDoc('Q', 1).title).toBe('');
  });

  it('createSplit starts with unknown MECE and no children', () => {
    const parent = createNode('Revenue');
    const split = createSplit(parent.id, 'formula');
    expect(split.decomposition).toBe('formula');
    expect(split.childIds).toEqual([]);
    expect(split.mece.exclusive.state).toBe('unknown');
    expect(split.mece.exhaustive.state).toBe('unknown');
  });
});
