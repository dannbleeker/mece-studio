/**
 * Export the rendered canvas image as a one-slide PowerPoint deck.
 *
 * `pptxgenjs` is imported lazily so it stays off the eager bundle. The slide
 * embeds the same raster PNG the other image exporters use. Mirrors TP Studio's
 * `services/exporters/pptx.ts`.
 */

import type { RenderedImage } from './image';

// Default 16:9 slide is 10 × 5.625 inches; keep a small uniform margin.
const SLIDE_W = 10;
const SLIDE_H = 5.625;
const MARGIN = 0.3;

/** Add `image` centred and fit to one slide, then save the deck. */
export async function saveTreePptx(image: RenderedImage, fileName: string): Promise<void> {
  const PptxGenJS = (await import('pptxgenjs')).default;
  const pptx = new PptxGenJS();
  const slide = pptx.addSlide();
  const aspect = image.width / image.height;
  let w = SLIDE_W - MARGIN * 2;
  let h = w / aspect;
  if (h > SLIDE_H - MARGIN * 2) {
    h = SLIDE_H - MARGIN * 2;
    w = h * aspect;
  }
  slide.addImage({ data: image.dataUrl, x: (SLIDE_W - w) / 2, y: (SLIDE_H - h) / 2, w, h });
  await pptx.writeFile({ fileName });
}
