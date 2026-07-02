import { describe, expect, it } from 'vitest';
import { toFlow } from '@/components/canvas/projection';
import { createDoc, createEvidence } from '@/domain/factory';
import { recomputeMece } from '@/domain/mece';
import {
  addChild,
  addEvidence,
  setDecomposition,
  setDimension,
  setNodeValue,
  setPriority,
  setStatus,
} from '@/domain/tree';
import { layoutPptxShapes, nativePptxViable } from './pptx-native';

// 10 × 5.625" slide with a 0.3" margin (mirrors the exporter constants).
const SLIDE_W = 10;
const SLIDE_H = 5.625;
const MARGIN = 0.3;

function sample() {
  let doc = createDoc('Root', 0);
  const rev = addChild(doc, doc.rootId, 'Revenue');
  doc = rev.doc;
  const cost = addChild(doc, doc.rootId, 'Costs');
  doc = cost.doc;
  doc = setDecomposition(doc, doc.rootId, 'segment');
  doc = setDimension(doc, doc.rootId, 'geography');
  doc = setNodeValue(doc, rev.childId, { amount: 100, unit: 'M' });
  doc = setPriority(doc, rev.childId, { impact: 'high', ease: 'high' });
  doc = setStatus(doc, rev.childId, 'supported');
  doc = addEvidence(doc, rev.childId, createEvidence('supports it', true));
  return { doc: recomputeMece(doc), revenueId: rev.childId, rootId: doc.rootId };
}

describe('pptx-native layout', () => {
  it('produces one box per node and one line per edge', () => {
    const { doc } = sample();
    const { nodes, edges } = toFlow(doc);
    const shapes = layoutPptxShapes(nodes, edges, { hasHeader: false });
    expect(shapes.nodes).toHaveLength(nodes.length); // root + 2
    expect(shapes.lines).toHaveLength(edges.length); // 2
  });

  it('scales every box inside the slide content area', () => {
    const { doc } = sample();
    const { nodes, edges } = toFlow(doc);
    const shapes = layoutPptxShapes(nodes, edges, { hasHeader: true });
    for (const spec of shapes.nodes) {
      expect(spec.box.x).toBeGreaterThanOrEqual(MARGIN - 0.01);
      expect(spec.box.y).toBeGreaterThanOrEqual(MARGIN - 0.01);
      expect(spec.box.x + spec.box.w).toBeLessThanOrEqual(SLIDE_W - MARGIN + 0.01);
      expect(spec.box.y + spec.box.h).toBeLessThanOrEqual(SLIDE_H - MARGIN + 0.01);
    }
  });

  it('draws a status stripe in the status colour, and none for open nodes', () => {
    const { doc, revenueId, rootId } = sample();
    const { nodes, edges } = toFlow(doc);
    const byId = new Map(
      layoutPptxShapes(nodes, edges, { hasHeader: false }).nodes.map((s) => [s.id, s])
    );
    expect(byId.get(revenueId)?.stripe?.color).toBe('3F7D54'); // supported
    expect(byId.get(rootId)?.stripe).toBeNull(); // open → no stripe
  });

  it('carries the label, priority, and a value/evidence detail line', () => {
    const { doc, revenueId, rootId } = sample();
    const { nodes, edges } = toFlow(doc);
    const byId = new Map(
      layoutPptxShapes(nodes, edges, { hasHeader: false }).nodes.map((s) => [s.id, s])
    );
    const rev = byId.get(revenueId);
    expect(rev?.texts[0]?.text).toBe('Revenue');
    expect(rev?.texts.some((t) => t.text === 'HIGH')).toBe(true);
    expect(rev?.texts.some((t) => /100 M/.test(t.text) && /✓1/.test(t.text))).toBe(true);
    // The parent carries the ME/CE glyph line and the named dimension.
    const root = byId.get(rootId);
    expect(root?.texts.some((t) => /ME .* CE /.test(t.text) && /by geography/.test(t.text))).toBe(
      true
    );
  });

  it('gates the native path on a readable node count', () => {
    expect(nativePptxViable(0)).toBe(false);
    expect(nativePptxViable(1)).toBe(true);
    expect(nativePptxViable(150)).toBe(true);
    expect(nativePptxViable(151)).toBe(false);
  });
});
