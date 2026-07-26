import { describe, expect, it } from 'vitest';
import { en } from '@/i18n/locales/en';
import { critiquePrompt, decomposePrompt } from './aiPrompts';
import { toMarkdown } from './export';
import { createDoc } from './factory';
import { addChild } from './tree';
import type { NodeId } from './types';

describe('critiquePrompt', () => {
  it('embeds the tree as Markdown and asks for a MECE critique', () => {
    let doc = createDoc('Why are profits down?', 0);
    doc = addChild(doc, doc.rootId, 'Revenue').doc;
    const out = critiquePrompt(doc, en);
    expect(out).toBe(en.exports.aiCritique({ tree: toMarkdown(doc, en) }));
    expect(out).toContain('# Why are profits down?'); // the embedded Markdown
    expect(out).toContain('- Revenue');
  });
});

describe('decomposePrompt', () => {
  it('names the node to decompose', () => {
    const doc = createDoc('Root question', 0);
    expect(decomposePrompt(doc, doc.rootId, en)).toBe(
      en.exports.aiDecompose({ label: 'Root question', tree: toMarkdown(doc, en) })
    );
  });

  it('uses an empty label when the node is missing', () => {
    const doc = createDoc('Root', 0);
    expect(decomposePrompt(doc, 'no-such-node' as NodeId, en)).toBe(
      en.exports.aiDecompose({ label: '', tree: toMarkdown(doc, en) })
    );
  });
});
