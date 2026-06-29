/**
 * Render the live issue-tree canvas to a raster PNG.
 *
 * The diagram is exported only as a **raster** image — never live SVG/HTML — so
 * no user text can be re-serialised into an executable document. This is a
 * deliberate XSS-safety property locked in by
 * `components/canvas/export-safety.test.ts`; see that file before adding any
 * live-SVG/HTML diagram export. `html-to-image` is imported lazily so it stays
 * off the eager bundle. Mirrors TP Studio's `services/exporters/image.ts`.
 */

import { getNodesBounds, getViewportForBounds, type Node } from '@xyflow/react';

/** A rendered canvas image: a PNG data URL plus its pixel dimensions. */
export interface RenderedImage {
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Render the React Flow viewport to a PNG data URL, sized to fit `nodes`
 * (React Flow's recommended bounds recipe). Resolves to `null` when the
 * viewport element isn't mounted.
 */
export async function renderCanvasPng(nodes: Node[]): Promise<RenderedImage | null> {
  const bounds = getNodesBounds(nodes);
  const width = Math.max(640, Math.min(2600, Math.round(bounds.width + 160)));
  const height = Math.max(480, Math.min(2600, Math.round(bounds.height + 160)));
  const { x, y, zoom } = getViewportForBounds(bounds, width, height, 0.5, 2, 0.12);
  const viewport = document.querySelector<HTMLElement>('.react-flow__viewport');
  if (!viewport) return null;
  const { toPng } = await import('html-to-image');
  const dataUrl = await toPng(viewport, {
    backgroundColor: '#faf9f5',
    width,
    height,
    style: {
      width: `${width}px`,
      height: `${height}px`,
      transform: `translate(${x}px, ${y}px) scale(${zoom})`,
    },
  });
  return { dataUrl, width, height };
}
