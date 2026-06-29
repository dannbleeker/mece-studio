/**
 * Issue-tree exporters — one function per format. The image-based formats
 * (PNG → PDF / PPTX) render the live canvas to a raster; JSON serializes the
 * document. Heavy libraries (`html-to-image`, `jspdf`, `pptxgenjs`) are
 * imported lazily inside each exporter so they stay off the eager bundle.
 *
 * SVG export is allowed but **sanitised at the sink** (`renderCanvasSvg` →
 * `sanitizeSvg`) so an exported file can never execute script — see
 * `components/canvas/export-safety.test.ts` for the XSS-safety rationale.
 */

export { renderCanvasPng, renderCanvasSvg } from './image';
export { treeToJson } from './json';
export { saveTreePdf } from './pdf';
export { saveTreePptx } from './pptx';
