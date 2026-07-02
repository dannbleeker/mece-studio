/**
 * Export the rendered canvas image as a one-slide PowerPoint deck.
 *
 * `pptxgenjs` is imported lazily so it stays off the eager bundle. The slide
 * embeds the same raster PNG the other image exporters use. Mirrors TP Studio's
 * `services/exporters/pptx.ts`.
 */

import type { ExportHeader, RenderedImage } from './image';

// Default 16:9 slide is 10 × 5.625 inches; keep a small uniform margin.
const SLIDE_W = 10;
const SLIDE_H = 5.625;
const MARGIN = 0.3;

/** Add `image` centred and fit to one slide (optionally titled), then save. */
export async function saveTreePptx(
  image: RenderedImage,
  fileName: string,
  header?: ExportHeader
): Promise<void> {
  const PptxGenJS = (await import('pptxgenjs')).default;
  const pptx = new PptxGenJS();
  const slide = pptx.addSlide();

  const topPad = header ? 0.7 : 0;
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

  const aspect = image.width / image.height;
  const availH = SLIDE_H - MARGIN * 2 - topPad;
  let w = SLIDE_W - MARGIN * 2;
  let h = w / aspect;
  if (h > availH) {
    h = availH;
    w = h * aspect;
  }
  slide.addImage({
    data: image.dataUrl,
    x: (SLIDE_W - w) / 2,
    y: MARGIN + topPad + (availH - h) / 2,
    w,
    h,
  });
  await pptx.writeFile({ fileName });
}
