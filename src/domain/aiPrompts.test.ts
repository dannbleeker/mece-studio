import { describe, expect, it } from 'vitest';
import { critiquePrompt, decomposePrompt } from './aiPrompts';
import { createDoc } from './factory';
import { addChild } from './tree';
import type { NodeId } from './types';

describe('critiquePrompt', () => {
  it('embeds the tree as Markdown and asks for a MECE critique', () => {
    let doc = createDoc('Why are profits down?', 0);
    doc = addChild(doc, doc.rootId, 'Revenue').doc;
    const out = critiquePrompt(doc);
    expect(out).toContain('McKinsey-style problem-solving coach');
    expect(out).toContain('# Why are profits down?'); // the embedded Markdown
    expect(out).toContain('- Revenue');
  });
});

describe('decomposePrompt', () => {
  it('names the node to decompose', () => {
    const doc = createDoc('Root question', 0);
    const out = decomposePrompt(doc, doc.rootId);
    expect(out).toContain('"Root question"');
    expect(out).toContain('Node to decompose: "Root question"');
  });

  it('uses an empty label when the node is missing', () => {
    const doc = createDoc('Root', 0);
    const out = decomposePrompt(doc, 'no-such-node' as NodeId);
    expect(out).toContain('Node to decompose: ""');
  });
});
