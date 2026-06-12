import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Export XSS-safety regression guard (sibling-audit follow-up).
 *
 * The sibling MindMap Studio had a stored XSS where user text was re-injected as
 * LIVE markup into an exported SVG and embedded inline in an HTML / print-to-PDF
 * document, so an `<img onerror>` / `javascript:` payload executed when the
 * exported file was opened. MECE Studio is structurally immune, for two reasons
 * this test locks in:
 *
 *  1. The diagram is only ever exported as a RASTER image. `Canvas.tsx`
 *     `renderToImage` uses `html-to-image`'s `toPng` (a bitmap); the PDF and
 *     PPTX exports embed that same PNG via `addImage`. Rasterisation flattens
 *     any markup to pixels and never runs script — there is NO `toSvg`, no
 *     `.svg`/`.html` diagram export, so nowhere can a live `<foreignObject>`
 *     clone be written to a file and re-opened as an executable document.
 *  2. The app never injects raw HTML: no `dangerouslySetInnerHTML`, no
 *     `el.innerHTML = …`. Every user value (labels, values, notes) is a React
 *     text child or a textarea value — escaped on the live canvas and in the
 *     inspector — so even the rasterised snapshot starts from inert content.
 *
 * If a future change adds an SVG/HTML export, or renders user content as raw
 * HTML, it must escape/sanitise at the sink (cf. mindmap-studio
 * src/io/svgSanitize.ts) and these guards be updated deliberately.
 */

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const sourceFiles = (): string[] =>
  readdirSync(SRC, { recursive: true })
    .map(String)
    .filter((f) => (f.endsWith('.ts') || f.endsWith('.tsx')) && !f.includes('.test.'));

const read = (rel: string): string => readFileSync(join(SRC, rel), 'utf8');

describe('export XSS safety', () => {
  it('never injects raw HTML (no dangerouslySetInnerHTML / innerHTML write)', () => {
    const offenders = sourceFiles().filter((rel) => {
      const code = read(rel);
      return code.includes('dangerouslySetInnerHTML') || /\.innerHTML\s*=/.test(code);
    });
    expect(offenders).toEqual([]);
  });

  it('exports stay rasterised — no live-SVG (toSvg) export path', () => {
    const files = sourceFiles();
    expect(files.filter((rel) => /\btoSvg\b/.test(read(rel)))).toEqual([]);
    // Sanity: the raster path the safety argument depends on is actually
    // present, so this test fails loudly if the export is ripped out rather
    // than passing vacuously.
    expect(files.some((rel) => /\btoPng\b/.test(read(rel)))).toBe(true);
  });
});
