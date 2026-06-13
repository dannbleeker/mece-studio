import { describe, expect, it } from 'vitest';
import { buildFrameworkTree, FRAMEWORK_TEMPLATES } from './frameworks';
import { childrenOf, splitOf } from './tree';

describe('framework templates', () => {
  it('exposes named frameworks with unique ids and names', () => {
    expect(FRAMEWORK_TEMPLATES.length).toBeGreaterThanOrEqual(8);
    expect(new Set(FRAMEWORK_TEMPLATES.map((t) => t.id)).size).toBe(FRAMEWORK_TEMPLATES.length);
    expect(new Set(FRAMEWORK_TEMPLATES.map((t) => t.name)).size).toBe(FRAMEWORK_TEMPLATES.length);
    for (const t of FRAMEWORK_TEMPLATES) {
      expect(t.blurb).toBeTruthy();
      expect(t.children.length).toBeGreaterThanOrEqual(2);
      // These are named lenses / funnels — never the provable split types.
      expect(['framework', 'process']).toContain(t.decomposition);
    }
  });

  it('builds each into a single split carrying the canonical children, in order', () => {
    for (const t of FRAMEWORK_TEMPLATES) {
      const doc = buildFrameworkTree(t);
      expect(doc.nodes[doc.rootId]?.label).toBe(t.root);
      const split = splitOf(doc, doc.rootId);
      expect(split?.decomposition).toBe(t.decomposition);
      expect(childrenOf(doc, doc.rootId).map((n) => n.label)).toEqual(t.children);
      // Every split references nodes that exist.
      for (const s of Object.values(doc.splits)) {
        expect(doc.nodes[s.parentId]).toBeDefined();
        for (const id of s.childIds) expect(doc.nodes[id]).toBeDefined();
      }
    }
  });

  it('never claims a false MECE guarantee — exhaustiveness stays unchecked for these split types', () => {
    for (const t of FRAMEWORK_TEMPLATES) {
      const doc = buildFrameworkTree(t);
      const split = splitOf(doc, doc.rootId);
      // framework / process splits can't be auto-proven exhaustive: honest
      // 'unknown', never a 'pass' that would mislead the user.
      expect(split?.mece.exhaustive.state).toBe('unknown');
    }
  });
});
