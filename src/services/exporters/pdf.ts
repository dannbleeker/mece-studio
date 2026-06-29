/**
 * Export the rendered canvas image as a single-page PDF.
 *
 * `jspdf` is imported lazily so it stays off the eager bundle. The page embeds
 * the same raster PNG the other image exporters use — no live markup. Mirrors
 * TP Studio's `services/exporters/pdf.ts`.
 */

import type { RenderedImage } from './image';

/** Build a single-page PDF that fills the page with `image`, and save it. */
export async function saveTreePdf(image: RenderedImage, fileName: string): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({
    orientation: image.width >= image.height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [image.width, image.height],
  });
  pdf.addImage(image.dataUrl, 'PNG', 0, 0, image.width, image.height);
  pdf.save(fileName);
}
