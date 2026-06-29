/**
 * Render the live issue-tree canvas to an image — a raster PNG, or an SVG that
 * is **sanitised** before it leaves the app.
 *
 * The canvas content is inert (React-escaped text, never raw HTML — see
 * `components/canvas/export-safety.test.ts`). PNG is raster, so it can never
 * carry script. SVG is a live document a browser executes when opened, so the
 * SVG path runs the serialised markup through `sanitizeSvg` at the sink before
 * it is written — stripping any script element, inline handler, or
 * script-bearing URL. `html-to-image` is imported lazily so it stays off the
 * eager bundle. Mirrors TP Studio's `services/exporters/image.ts`.
 */

import { getNodesBounds, getViewportForBounds, type Node } from '@xyflow/react';
import { sanitizeSvg } from './svgSanitize';

/** A rendered canvas image: a PNG data URL plus its pixel dimensions. */
export interface RenderedImage {
  dataUrl: string;
  width: number;
  height: number;
}

/** A rendered, already-sanitised SVG document plus its pixel dimensions. */
export interface RenderedSvg {
  svg: string;
  width: number;
  height: number;
}

interface CaptureConfig {
  viewport: HTMLElement;
  width: number;
  height: number;
  options: {
    backgroundColor: string;
    width: number;
    height: number;
    style: Record<string, string>;
  };
}

/**
 * Common sizing for both image exporters: fit `nodes` (React Flow's bounds
 * recipe) and locate the viewport element. Returns `null` when the viewport
 * isn't mounted.
 */
function captureConfig(nodes: Node[]): CaptureConfig | null {
  const bounds = getNodesBounds(nodes);
  const width = Math.max(640, Math.min(2600, Math.round(bounds.width + 160)));
  const height = Math.max(480, Math.min(2600, Math.round(bounds.height + 160)));
  const { x, y, zoom } = getViewportForBounds(bounds, width, height, 0.5, 2, 0.12);
  const viewport = document.querySelector<HTMLElement>('.react-flow__viewport');
  if (!viewport) return null;
  return {
    viewport,
    width,
    height,
    options: {
      backgroundColor: '#faf9f5',
      width,
      height,
      style: {
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${x}px, ${y}px) scale(${zoom})`,
      },
    },
  };
}

/** Render the React Flow viewport to a PNG data URL. `null` if unmounted. */
export async function renderCanvasPng(nodes: Node[]): Promise<RenderedImage | null> {
  const cfg = captureConfig(nodes);
  if (!cfg) return null;
  const { toPng } = await import('html-to-image');
  const dataUrl = await toPng(cfg.viewport, cfg.options);
  return { dataUrl, width: cfg.width, height: cfg.height };
}

/** The markup of an SVG data URL produced by html-to-image (URL-decoded). */
function decodeSvgDataUrl(dataUrl: string): string {
  const comma = dataUrl.indexOf(',');
  return comma === -1 ? '' : decodeURIComponent(dataUrl.slice(comma + 1));
}

/**
 * Render the React Flow viewport to an SVG, **sanitised** before return so the
 * exported file can never execute script. Resolves to `null` when the viewport
 * isn't mounted or the sanitised SVG is empty (e.g. an unparseable render).
 */
export async function renderCanvasSvg(nodes: Node[]): Promise<RenderedSvg | null> {
  const cfg = captureConfig(nodes);
  if (!cfg) return null;
  const { toSvg } = await import('html-to-image');
  const dataUrl = await toSvg(cfg.viewport, cfg.options);
  const svg = sanitizeSvg(decodeSvgDataUrl(dataUrl));
  if (!svg) return null;
  return { svg, width: cfg.width, height: cfg.height };
}
