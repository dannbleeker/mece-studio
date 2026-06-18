import { describe, expect, it } from 'vitest';
import { createDoc } from '@/domain/factory';
import { priorityBand, priorityScore } from '@/domain/priority';
import { setPriority } from '@/domain/tree';

describe('priority', () => {
  it('scores impact x ease (1-9)', () => {
    expect(priorityScore({ impact: 'high', ease: 'high' })).toBe(9);
    expect(priorityScore({ impact: 'low', ease: 'low' })).toBe(1);
    expect(priorityScore({ impact: 'high', ease: 'low' })).toBe(3);
  });

  it('bands the score', () => {
    expect(priorityBand({ impact: 'high', ease: 'high' })).toBe('high');
    expect(priorityBand({ impact: 'high', ease: 'low' })).toBe('medium');
    expect(priorityBand({ impact: 'low', ease: 'low' })).toBe('low');
  });

  it('sets and clears a node priority', () => {
    const doc0 = createDoc('Root', 1000);
    const withP = setPriority(doc0, doc0.rootId, { impact: 'high', ease: 'medium' });
    expect(withP.nodes[doc0.rootId]?.priority).toEqual({ impact: 'high', ease: 'medium' });
    const cleared = setPriority(withP, doc0.rootId, undefined);
    expect(cleared.nodes[doc0.rootId]?.priority).toBeUndefined();
  });
});
