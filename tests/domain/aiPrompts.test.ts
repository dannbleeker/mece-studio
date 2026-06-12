import { describe, expect, it } from 'vitest';
import { critiquePrompt, decomposePrompt } from '@/domain/aiPrompts';
import { createDoc } from '@/domain/factory';
import { addChild } from '@/domain/tree';

describe('aiPrompts', () => {
  it('critiquePrompt embeds the tree and asks for a MECE critique', () => {
    let doc = createDoc('Why is profit down?', 1);
    doc = addChild(doc, doc.rootId, 'Revenue').doc;
    const prompt = critiquePrompt(doc);
    expect(prompt).toContain('Why is profit down?');
    expect(prompt).toContain('Revenue');
    expect(prompt).toMatch(/MECE/);
  });

  it('decomposePrompt names the node and embeds the tree', () => {
    let doc = createDoc('Root', 1);
    const { doc: d1, childId } = addChild(doc, doc.rootId, 'Cost');
    doc = d1;
    const prompt = decomposePrompt(doc, childId);
    expect(prompt).toContain('"Cost"');
    expect(prompt).toContain('Root');
  });
});
