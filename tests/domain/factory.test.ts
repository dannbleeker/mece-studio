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

  it('createSplit starts with unknown MECE and no children', () => {
    const parent = createNode('Revenue');
    const split = createSplit(parent.id, 'formula');
    expect(split.decomposition).toBe('formula');
    expect(split.childIds).toEqual([]);
    expect(split.mece.exclusive.state).toBe('unknown');
    expect(split.mece.exhaustive.state).toBe('unknown');
  });
});
