import { describe, expect, it } from 'vitest';
import { toFlow } from '@/components/canvas/projection';
import { createDoc } from '@/domain/factory';
import { recomputeMece } from '@/domain/mece';
import { addChild, setDetail } from '@/domain/tree';

describe('toFlow', () => {
  it('produces a node per issue and an edge per parent->child', () => {
    let doc = createDoc('Root', 1000);
    doc = addChild(doc, doc.rootId, 'A').doc;
    doc = addChild(doc, doc.rootId, 'B').doc;
    doc = recomputeMece(doc);

    const { nodes, edges } = toFlow(doc, null);
    expect(nodes).toHaveLength(3);
    expect(edges).toHaveLength(2);
    expect(nodes.every((n) => n.type === 'issue')).toBe(true);
    expect(nodes.every((n) => Number.isFinite(n.position.x))).toBe(true);
  });

  it('marks the selected node and exposes MECE on decomposed nodes', () => {
    let doc = createDoc('Root', 1000);
    doc = addChild(doc, doc.rootId, 'A').doc;
    doc = recomputeMece(doc);

    const { nodes } = toFlow(doc, doc.rootId);
    const root = nodes.find((n) => n.id === doc.rootId);
    expect(root?.data.selected).toBe(true);
    expect(root?.data.hasChildren).toBe(true);
    expect(root?.data.mece).not.toBeNull();
  });

  it('flags nodes that carry notes', () => {
    let doc = createDoc('Root', 1000);
    doc = setDetail(doc, doc.rootId, 'Some rationale.');
    doc = recomputeMece(doc);
    const root = toFlow(doc, null).nodes.find((n) => n.id === doc.rootId);
    expect(root?.data.hasNote).toBe(true);
  });
});
