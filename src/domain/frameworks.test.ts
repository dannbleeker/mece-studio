import { describe, expect, it } from 'vitest';
import { en } from '@/i18n/locales/en';
import { buildFrameworkTree, FRAMEWORK_TEMPLATES } from './frameworks';
import { childrenOf, splitOf } from './tree';

describe('framework templates', () => {
  it('exposes named frameworks with unique ids and names', () => {
    expect(FRAMEWORK_TEMPLATES.length).toBeGreaterThanOrEqual(8);
    expect(new Set(FRAMEWORK_TEMPLATES.map((t) => t.id)).size).toBe(FRAMEWORK_TEMPLATES.length);
    const names = FRAMEWORK_TEMPLATES.map((t) => en.content.frameworks[t.id].name);
    expect(new Set(names).size).toBe(FRAMEWORK_TEMPLATES.length);
    for (const t of FRAMEWORK_TEMPLATES) {
      expect(en.content.frameworks[t.id].blurb).toBeTruthy();
      expect(en.content.frameworks[t.id].children.length).toBeGreaterThanOrEqual(2);
      // These are named lenses / funnels — never the provable split types.
      expect(['framework', 'process']).toContain(t.decomposition);
    }
  });

  it('builds each into a single split carrying the canonical children, in order', () => {
    for (const t of FRAMEWORK_TEMPLATES) {
      const content = en.content.frameworks[t.id];
      const doc = buildFrameworkTree(t, en);
      expect(doc.nodes[doc.rootId]?.label).toBe(content.root);
      const split = splitOf(doc, doc.rootId);
      expect(split?.decomposition).toBe(t.decomposition);
      expect(childrenOf(doc, doc.rootId).map((n) => n.label)).toEqual([...content.children]);
      // Every split references nodes that exist.
      for (const s of Object.values(doc.splits)) {
        expect(doc.nodes[s.parentId]).toBeDefined();
        for (const id of s.childIds) expect(doc.nodes[id]).toBeDefined();
      }
    }
  });

  it('never claims a false MECE guarantee — exhaustiveness stays unchecked for these split types', () => {
    for (const t of FRAMEWORK_TEMPLATES) {
      const doc = buildFrameworkTree(t, en);
      const split = splitOf(doc, doc.rootId);
      // framework / process splits can't be auto-proven exhaustive: honest
      // 'unknown', never a 'pass' that would mislead the user.
      expect(split?.mece.exhaustive.state).toBe('unknown');
    }
  });
});
