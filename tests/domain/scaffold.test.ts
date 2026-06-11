import { describe, expect, it } from 'vitest';
import { createDoc } from '@/domain/factory';
import { recomputeMece } from '@/domain/mece';
import { scaffoldChildren } from '@/domain/scaffold';
import { childrenOf, decompose, splitOf } from '@/domain/tree';

describe('decompose / scaffold', () => {
  it('scaffolds type-appropriate children on a leaf', () => {
    let doc = createDoc('Root', 1000);
    doc = decompose(doc, doc.rootId, 'binary');
    expect(childrenOf(doc, doc.rootId).map((n) => n.label)).toEqual(['A', 'not-A']);
    expect(splitOf(doc, doc.rootId)?.decomposition).toBe('binary');
  });

  it('seeds an Other bucket for segments', () => {
    let doc = createDoc('Root', 1000);
    doc = decompose(doc, doc.rootId, 'segment');
    expect(childrenOf(doc, doc.rootId).map((n) => n.label)).toContain('Other');
  });

  it('changes the type without re-seeding when already decomposed', () => {
    let doc = createDoc('Root', 1000);
    doc = decompose(doc, doc.rootId, 'binary');
    doc = decompose(doc, doc.rootId, 'segment');
    expect(childrenOf(doc, doc.rootId).map((n) => n.label)).toEqual(['A', 'not-A']);
    expect(splitOf(doc, doc.rootId)?.decomposition).toBe('segment');
  });

  it('a scaffolded segment is exhaustive (Other) with no false overlap', () => {
    let doc = createDoc('Root', 1000);
    doc = recomputeMece(decompose(doc, doc.rootId, 'segment'));
    const mece = splitOf(doc, doc.rootId)?.mece;
    expect(mece?.exhaustive.state).toBe('pass');
    expect(mece?.exclusive.state).not.toBe('warn');
  });

  it('every decomposition type seeds at least two children', () => {
    for (const t of ['binary', 'segment', 'process', 'formula', 'framework', 'freeform'] as const) {
      expect(scaffoldChildren(t).length).toBeGreaterThanOrEqual(2);
    }
  });
});
