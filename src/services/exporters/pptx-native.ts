/**
 * Export the issue tree as a **native**, editable PowerPoint slide — a rounded
 * box + text per node and a connector line per edge, placed from the dagre
 * layout — instead of one flattened raster image (see `pptx.ts`, still used as
 * the fallback for very large trees). Every node's text is passed to pptxgenjs
 * `addText` as a plain string; pptxgenjs escapes it into inert Office Open XML,
 * so — like the raster path — the file can never carry live markup (see
 * `components/canvas/export-safety.test.ts`).
 *
 * The geometry mirrors the start-page thumbnail (`components/start/TreePreview.tsx`):
 * dagre positions (px, top-left) scaled to fit the slide, edges drawn
 * source-right-centre → target-left-centre. `pptxgenjs` is imported lazily so it
 * stays off the eager bundle.
 */

import type { Edge } from '@xyflow/react';
import type { IssueFlowNode } from '@/components/canvas/projection';
import { NODE_HEIGHT, NODE_WIDTH } from '@/domain/constants';
import type { ExportHeader } from './image';

// Default 16:9 slide is 10 × 5.625 inches; keep a small uniform margin. A header
// (title + date) reserves a band at the top, matching the raster exporter.
const SLIDE_W = 10;
const SLIDE_H = 5.625;
const MARGIN = 0.3;
const HEADER_PAD = 0.7;

/** Beyond this many nodes a one-slide native render is unreadable — fall back to raster. */
const NATIVE_PPTX_MAX = 150;

/** Native rendering is viable for a non-empty tree up to the readable node cap. */
export function nativePptxViable(nodeCount: number): boolean {
  return nodeCount > 0 && nodeCount <= NATIVE_PPTX_MAX;
}

// Status left-stripe colours (mirrors IssueNode.tsx); open has no stripe.
const STATUS_STRIPE: Record<IssueFlowNode['data']['status'], string | null> = {
  open: null,
  supported: '3F7D54',
  refuted: 'BD4A3A',
  parked: '9A958A',
};
const CHECK_GLYPH: Record<'pass' | 'warn' | 'unknown', string> = {
  pass: '✓',
  warn: '!',
  unknown: '–',
};
const PRIORITY_COLOR: Record<'low' | 'medium' | 'high', string> = {
  high: '3F6FB0',
  medium: '8A5A14',
  low: '7A766C',
};

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface TextSpec extends Rect {
  text: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  color: string;
  align: 'left' | 'center' | 'right';
  valign: 'top' | 'middle' | 'bottom';
}
/** Everything to draw for one node: the box, its status stripe, and its text lines. */
interface PptxNodeSpec {
  id: string;
  box: Rect;
  stripe: (Rect & { color: string }) | null;
  texts: TextSpec[];
}
/** A connector: pptxgenjs draws a line inside `x,y,w,h`, oriented by flip flags. */
interface PptxLineSpec extends Rect {
  flipH: boolean;
  flipV: boolean;
}
interface PptxShapes {
  nodes: PptxNodeSpec[];
  lines: PptxLineSpec[];
}

const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));

/** A node's on-screen size — measured when available (live canvas), else the constants. */
function nodeDims(n: IssueFlowNode): { w: number; h: number } {
  return {
    w: n.measured?.width ?? n.width ?? NODE_WIDTH,
    h: n.measured?.height ?? n.height ?? NODE_HEIGHT,
  };
}

/** Bounding box over all nodes in px (top-left positions + their sizes). */
function treeBounds(nodes: IssueFlowNode[]): Rect | null {
  if (nodes.length === 0) return null;
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const n of nodes) {
    const { w, h } = nodeDims(n);
    minX = Math.min(minX, n.position.x);
    minY = Math.min(minY, n.position.y);
    maxX = Math.max(maxX, n.position.x + w);
    maxY = Math.max(maxY, n.position.y + h);
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/** The one-line detail under a node's label: value · evidence · dimension · ME/CE. */
function detailText(data: IssueFlowNode['data']): string {
  const parts: string[] = [];
  if (data.value) parts.push(`${data.value.amount}${data.value.unit ? ` ${data.value.unit}` : ''}`);
  if (data.evidence) {
    const ev: string[] = [];
    if (data.evidence.supports > 0) ev.push(`✓${data.evidence.supports}`);
    if (data.evidence.contradicts > 0) ev.push(`✗${data.evidence.contradicts}`);
    if (ev.length > 0) parts.push(ev.join(' '));
  }
  if (data.hasChildren && data.dimension) parts.push(`by ${data.dimension}`);
  if (data.hasChildren && data.mece) {
    parts.push(
      `ME ${CHECK_GLYPH[data.mece.exclusive.state]}  CE ${CHECK_GLYPH[data.mece.exhaustive.state]}`
    );
  }
  return parts.join('   ');
}

/**
 * Pure geometry: map dagre px positions to slide inches and produce the box /
 * stripe / text / line specs. No pptxgenjs dependency, so it is unit-testable.
 */
export function layoutPptxShapes(
  nodes: IssueFlowNode[],
  edges: Edge[],
  opts: { hasHeader: boolean }
): PptxShapes {
  const bounds = treeBounds(nodes);
  if (!bounds || bounds.w <= 0 || bounds.h <= 0) return { nodes: [], lines: [] };

  const topPad = opts.hasHeader ? HEADER_PAD : 0;
  const availW = SLIDE_W - MARGIN * 2;
  const availH = SLIDE_H - MARGIN * 2 - topPad;
  const scale = Math.min(availW / bounds.w, availH / bounds.h);
  const offsetX = MARGIN + (availW - bounds.w * scale) / 2;
  const offsetY = MARGIN + topPad + (availH - bounds.h * scale) / 2;
  const tx = (px: number): number => offsetX + (px - bounds.x) * scale;
  const ty = (py: number): number => offsetY + (py - bounds.y) * scale;

  const dimsById = new Map<string, { w: number; h: number }>();
  const posById = new Map<string, { x: number; y: number }>();
  const nodeSpecs: PptxNodeSpec[] = nodes.map((n) => {
    const { w, h } = nodeDims(n);
    dimsById.set(n.id, { w, h });
    posById.set(n.id, n.position);
    const box: Rect = { x: tx(n.position.x), y: ty(n.position.y), w: w * scale, h: h * scale };
    const pad = Math.min(0.06, box.w * 0.06);
    const labelPt = clamp(Math.round(box.h * 72 * 0.22), 6, 13);
    const detailPt = clamp(labelPt - 2, 5, 11);
    const stripeColor = STATUS_STRIPE[n.data.status];
    const stripe = stripeColor
      ? { x: box.x, y: box.y, w: Math.min(0.06, box.w * 0.08), h: box.h, color: stripeColor }
      : null;

    const prioW = n.data.priority ? box.w * 0.34 : 0;
    const texts: TextSpec[] = [
      {
        text: n.data.label || 'Untitled',
        x: box.x + pad,
        y: box.y + pad,
        w: box.w - pad * 2 - prioW,
        h: box.h * 0.5,
        fontSize: labelPt,
        bold: true,
        italic: false,
        color: '1F2937',
        align: 'left',
        valign: 'top',
      },
    ];
    if (n.data.priority) {
      texts.push({
        text: n.data.priority.toUpperCase(),
        x: box.x + box.w - prioW - pad,
        y: box.y + pad,
        w: prioW,
        h: labelPt / 72 + 0.05,
        fontSize: clamp(labelPt - 3, 5, 9),
        bold: true,
        italic: false,
        color: PRIORITY_COLOR[n.data.priority],
        align: 'right',
        valign: 'top',
      });
    }
    const detail = detailText(n.data);
    if (detail) {
      texts.push({
        text: detail,
        x: box.x + pad,
        y: box.y + box.h * 0.5,
        w: box.w - pad * 2,
        h: box.h * 0.5 - pad,
        fontSize: detailPt,
        bold: false,
        italic: false,
        color: '5B5B5B',
        align: 'left',
        valign: 'top',
      });
    }
    return { id: n.id, box, stripe, texts };
  });

  const lines: PptxLineSpec[] = [];
  for (const e of edges) {
    const sPos = posById.get(e.source);
    const tPos = posById.get(e.target);
    const sDim = dimsById.get(e.source);
    const tDim = dimsById.get(e.target);
    if (!sPos || !tPos || !sDim || !tDim) continue;
    const x1 = tx(sPos.x + sDim.w);
    const y1 = ty(sPos.y + sDim.h / 2);
    const x2 = tx(tPos.x);
    const y2 = ty(tPos.y + tDim.h / 2);
    lines.push({
      x: Math.min(x1, x2),
      y: Math.min(y1, y2),
      w: Math.abs(x2 - x1),
      h: Math.abs(y2 - y1),
      flipH: x2 < x1,
      flipV: y2 < y1,
    });
  }

  return { nodes: nodeSpecs, lines };
}

/**
 * Build and save a native, editable one-slide PPTX of the tree. `nodes` are the
 * live React Flow nodes (they carry measured sizes + positions + data), `edges`
 * the projected splits. Falls back to the raster exporter should be handled by
 * the caller for very large trees (see `nativePptxViable`).
 */
export async function saveTreePptxNative(
  nodes: IssueFlowNode[],
  edges: Edge[],
  fileName: string,
  header?: ExportHeader
): Promise<void> {
  const PptxGenJS = (await import('pptxgenjs')).default;
  const pptx = new PptxGenJS();
  const slide = pptx.addSlide();

  if (header) {
    slide.addText(header.title, {
      x: 0.3,
      y: 0.15,
      w: SLIDE_W - 0.6,
      h: 0.4,
      fontSize: 18,
      bold: true,
      color: '1F2937',
    });
    if (header.subtitle) {
      slide.addText(header.subtitle, {
        x: 0.3,
        y: 0.52,
        w: SLIDE_W - 0.6,
        h: 0.25,
        fontSize: 10,
        color: '6B7280',
      });
    }
  }

  const { nodes: nodeSpecs, lines } = layoutPptxShapes(nodes, edges, { hasHeader: !!header });

  // Edges first, so the node boxes sit on top of the connectors.
  for (const ln of lines) {
    slide.addShape(pptx.ShapeType.line, {
      x: ln.x,
      y: ln.y,
      w: ln.w,
      h: ln.h,
      flipH: ln.flipH,
      flipV: ln.flipV,
      line: { color: 'CFCBC0', width: 1 },
    });
  }
  for (const spec of nodeSpecs) {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: spec.box.x,
      y: spec.box.y,
      w: spec.box.w,
      h: spec.box.h,
      rectRadius: Math.min(0.08, spec.box.h * 0.18),
      fill: { color: 'FFFFFF' },
      line: { color: 'D7D4CB', width: 1 },
    });
    if (spec.stripe) {
      slide.addShape(pptx.ShapeType.rect, {
        x: spec.stripe.x,
        y: spec.stripe.y,
        w: spec.stripe.w,
        h: spec.stripe.h,
        fill: { color: spec.stripe.color },
        line: { type: 'none' },
      });
    }
    for (const t of spec.texts) {
      slide.addText(t.text, {
        x: t.x,
        y: t.y,
        w: t.w,
        h: t.h,
        fontSize: t.fontSize,
        bold: t.bold,
        italic: t.italic,
        color: t.color,
        align: t.align,
        valign: t.valign,
        margin: 1,
        wrap: true,
      });
    }
  }

  await pptx.writeFile({ fileName });
}
