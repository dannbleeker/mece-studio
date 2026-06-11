import { describe, expect, it } from 'vitest';
import { createDoc, createEvidence } from '@/domain/factory';
import { addEvidence, removeEvidence, updateEvidence } from '@/domain/tree';

describe('evidence', () => {
  it('adds, updates, and removes evidence on a node', () => {
    const doc0 = createDoc('Root', 1000);
    const item = createEvidence('Survey shows X', true, 'strong');

    const d1 = addEvidence(doc0, doc0.rootId, item);
    expect(d1.nodes[doc0.rootId]?.evidence).toHaveLength(1);
    expect(d1.nodes[doc0.rootId]?.evidence[0]?.supports).toBe(true);

    const d2 = updateEvidence(d1, doc0.rootId, item.id, { supports: false });
    expect(d2.nodes[doc0.rootId]?.evidence[0]?.supports).toBe(false);

    const d3 = removeEvidence(d2, doc0.rootId, item.id);
    expect(d3.nodes[doc0.rootId]?.evidence).toHaveLength(0);
  });

  it('createEvidence defaults strength to indicative and assigns an id', () => {
    const e = createEvidence('note', true);
    expect(e.strength).toBe('indicative');
    expect(e.id).toBeTruthy();
  });
});
