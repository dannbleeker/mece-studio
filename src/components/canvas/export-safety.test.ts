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
 * exported file was opened. MECE Studio defends against this on two fronts this
 * test locks in:
 *
 *  1. Diagram exports never carry script. PNG / PDF / PPTX are RASTER (a
 *     `toPng` bitmap embedded via `addImage`), which flattens any markup to
 *     pixels. SVG export IS offered, but is **sanitised at the sink**:
 *     `renderCanvasSvg` runs the serialised markup through `sanitizeSvg`, which
 *     strips `<script>`, inline event handlers, and script-bearing URLs before
 *     the file is written. So every file the app emits is inert. (Guard: any
 *     file using `toSvg` must also use `sanitizeSvg`.)
 *  2. The app never injects raw HTML: no `dangerouslySetInnerHTML`, no
 *     `el.innerHTML = …`. Every user value (labels, values, notes) is a React
 *     text child or a textarea value — escaped on the live canvas and in the
 *     inspector — so the snapshot the exporters serialise starts from inert
 *     content.
 *
 * If a future change adds another live-markup export (SVG/HTML) or renders user
 * content as raw HTML, it must escape/sanitise at the sink (cf.
 * `services/exporters/svgSanitize.ts`) and these guards be updated deliberately.
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

  it('sanitises every SVG export at the sink (toSvg ⇒ sanitizeSvg)', () => {
    const files = sourceFiles();
    // Any file that serialises an SVG via html-to-image's `toSvg` must also run
    // it through the sanitiser — never write raw `toSvg` output to a file.
    const svgExporters = files.filter((rel) => /\btoSvg\b/.test(read(rel)));
    expect(svgExporters.length).toBeGreaterThan(0); // the SVG path exists…
    for (const rel of svgExporters) expect(read(rel)).toMatch(/\bsanitizeSvg\b/); // …and is sanitised
    // Sanity: the raster path is still present (PNG underpins PDF/PPTX too).
    expect(files.some((rel) => /\btoPng\b/.test(read(rel)))).toBe(true);
  });
});
