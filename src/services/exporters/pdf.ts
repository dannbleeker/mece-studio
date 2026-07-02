/**
 * Export the rendered canvas image as a single-page PDF.
 *
 * `jspdf` is imported lazily so it stays off the eager bundle. The page embeds
 * the same raster PNG the other image exporters use — no live markup. Mirrors
 * TP Studio's `services/exporters/pdf.ts`.
 */

import type { ExportHeader, RenderedImage } from './image';

const HEADER_H = 64; // px band above the image when a title header is given

/** Build a single-page PDF of `image`, optionally with a title band, and save it. */
export async function saveTreePdf(
  image: RenderedImage,
  fileName: string,
  header?: ExportHeader
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const bandH = header ? HEADER_H : 0;
  const pageH = image.height + bandH;
  const pdf = new jsPDF({
    orientation: image.width >= pageH ? 'landscape' : 'portrait',
    unit: 'px',
    format: [image.width, pageH],
  });
  if (header) {
    pdf.setFillColor(63, 111, 176); // #3f6fb0 accent
    pdf.rect(0, 0, image.width, 5, 'F'); // accent bar
    pdf.setTextColor(31, 41, 55); // #1f2937
    pdf.setFontSize(16);
    pdf.text(header.title, 20, 34, { maxWidth: image.width - 40 });
    if (header.subtitle) {
      pdf.setTextColor(107, 114, 128); // #6b7280
      pdf.setFontSize(10);
      pdf.text(header.subtitle, 20, 52, { maxWidth: image.width - 40 });
    }
  }
  pdf.addImage(image.dataUrl, 'PNG', 0, bandH, image.width, image.height);
  pdf.save(fileName);
}
