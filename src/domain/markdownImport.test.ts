import { describe, expect, it } from 'vitest';
import { toMarkdown } from './export';
import { markdownToDoc } from './markdownImport';
import { childrenOf } from './tree';

/** Labels of a node's children, in order. */
function childLabels(doc: ReturnType<typeof markdownToDoc>, id: string): string[] {
  if (!doc) return [];
  return childrenOf(doc, id as never).map((n) => n.label);
}

describe('markdownToDoc', () => {
  it('returns null for empty / whitespace input', () => {
    expect(markdownToDoc('', 1)).toBeNull();
    expect(markdownToDoc('   \n\n', 1)).toBeNull();
  });

  it('makes the first heading the root and bullets its children', () => {
    const doc = markdownToDoc('# Why are sales down?\n- Pricing\n- Demand\n- Distribution', 1);
    expect(doc).not.toBeNull();
    expect(doc?.nodes[doc.rootId]?.label).toBe('Why are sales down?');
    expect(childLabels(doc, doc?.rootId ?? '')).toEqual(['Pricing', 'Demand', 'Distribution']);
  });

  it('nests by indentation', () => {
    const doc = markdownToDoc('# Root\n- A\n  - A1\n  - A2\n- B', 1);
    const rootKids = childrenOf(doc as never, doc?.rootId as never);
    expect(rootKids.map((n) => n.label)).toEqual(['A', 'B']);
    const a = rootKids[0];
    expect(childLabels(doc, a?.id ?? '')).toEqual(['A1', 'A2']);
  });

  it('accepts numbered and *-bullets, and a bare first line as the root', () => {
    const doc = markdownToDoc('My question\n1. First\n2. Second\n   * Nested', 1);
    expect(doc?.nodes[doc.rootId]?.label).toBe('My question');
    const kids = childrenOf(doc as never, doc?.rootId as never);
    expect(kids.map((n) => n.label)).toEqual(['First', 'Second']);
    expect(childLabels(doc, kids[1]?.id ?? '')).toEqual(['Nested']);
  });

  it('round-trips the structure of an exported Markdown outline', () => {
    const source = markdownToDoc('# Sales\n- Pricing\n  - Too high\n- Demand', 1);
    const md = toMarkdown(source as never);
    const back = markdownToDoc(md, 2);
    // The hierarchy survives a round-trip (labels carry export meta, so compare shape).
    expect(back?.nodes[back.rootId]?.label).toContain('Sales');
    const kids = childrenOf(back as never, back?.rootId as never);
    expect(kids).toHaveLength(2);
    expect(childLabels(back, kids[0]?.id ?? '')).toHaveLength(1); // Pricing → Too high
  });

  it('drops exported evidence lines rather than turning them into nodes', () => {
    const doc = markdownToDoc('# Root\n- Claim\n  - ✓ (strong) supporting fact', 1);
    const claim = childrenOf(doc as never, doc?.rootId as never)[0];
    expect(claim?.label).toBe('Claim');
    expect(childLabels(doc, claim?.id ?? '')).toEqual([]); // evidence line skipped
  });
});
