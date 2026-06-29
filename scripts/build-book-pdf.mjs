// Build the PDF from docs/guide/*.md. Renders one HTML document (cover + clickable
// TOC + chapters) in headless Chromium (the Playwright binary already installed for
// e2e), prints it with page.pdf(), then post-processes with pdf-lib to attach full
// document metadata + language. Same chapters + diagram source as the EPUB builder.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { marked } from 'marked';
import { PDFArray, PDFDocument, PDFHexString, PDFName, PDFString } from 'pdf-lib';
import {
  BOOK_AUTHOR,
  BOOK_ID,
  BOOK_KEYWORDS,
  BOOK_LANG,
  BOOK_SLUG,
  BOOK_SUBTITLE,
  BOOK_TITLE,
  CHAPTER_FILES,
  groupChapters,
  slugOf,
  titleOf,
} from './lib/bookChapters.mjs';
import { bookDate } from './lib/bookDate.mjs';
import { issueTreeSvg } from './lib/issueTreeSvg.mjs';

const GUIDE = 'docs/guide';
const OUT = path.join(GUIDE, `${BOOK_SLUG}.pdf`);

const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]
  );
const expand = (md) => md.replace(/<!--\s*ISSUE_TREE\s*-->/g, () => `\n\n${issueTreeSvg()}\n\n`);

function loadChapters() {
  return CHAPTER_FILES.map((file) => {
    const full = path.join(GUIDE, file);
    if (!existsSync(full)) throw new Error(`missing chapter: ${full}`);
    const md = readFileSync(full, 'utf8');
    const slug = slugOf(file);
    const html = marked.parse(expand(md), { async: false });
    return { file, slug, title: titleOf(md, file), body: html.replace(/<h1([^>]*)>/, `<h1$1 id="${slug}">`) };
  });
}

const PRINT_CSS = `
  @page { size: A4; margin: 20mm 18mm 22mm; }
  html { font-family: Georgia, 'Times New Roman', serif; color: #1a1a1a; }
  body { font-size: 11pt; line-height: 1.5; }
  h1 { font-size: 20pt; color: #3f6fb0; line-height: 1.2; margin: 0 0 0.6em; }
  h2 { font-size: 14pt; margin: 1.5em 0 0.4em; }
  h3 { font-size: 12pt; margin: 1.2em 0 0.3em; }
  p { margin: 0.5em 0; orphans: 2; widows: 2; }
  ul, ol { margin: 0.5em 0; padding-left: 1.4em; }
  li { margin: 0.2em 0; }
  code { font-family: 'DejaVu Sans Mono', monospace; background: #f0f0f0; padding: 0 0.2em; border-radius: 3px; font-size: 0.9em; }
  pre { background: #f3f1ea; padding: 0.7em 0.9em; border-radius: 6px; overflow: hidden; white-space: pre-wrap; }
  blockquote { margin: 1em 0; padding: 0.2em 1em; border-left: 3px solid #3f6fb0; color: #555; font-style: italic; }
  table { border-collapse: collapse; width: 100%; margin: 1em 0; font-size: 9.5pt; }
  th, td { border: 1px solid #ccc; padding: 0.35em 0.5em; text-align: left; }
  th { background: #eef2f8; }
  kbd { border: 1px solid #bbb; border-bottom-width: 2px; border-radius: 4px; padding: 0 0.3em; font-family: monospace; font-size: 0.85em; }
  .figure { margin: 1.4em 0; text-align: center; page-break-inside: avoid; }
  .figure svg { max-width: 100%; height: auto; }
  .figcaption { font-size: 9pt; color: #666; margin-top: 0.4em; font-style: italic; }
  .cover { height: 247mm; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; page-break-after: always; }
  .cover-title { font-size: 30pt; color: #3f6fb0; font-weight: bold; max-width: 80%; }
  .cover-sub { font-size: 14pt; color: #444; margin-top: 0.6em; max-width: 70%; }
  .cover-author { margin-top: 3em; font-size: 12pt; color: #333; }
  .toc-page { page-break-after: always; }
  .toc-title { font-size: 18pt; color: #3f6fb0; margin-bottom: 0.6em; }
  .toc-group { font-weight: bold; margin: 0.9em 0 0.2em; color: #555; font-size: 10pt; text-transform: uppercase; letter-spacing: 0.04em; }
  .toc-item a { text-decoration: none; color: #1a1a1a; }
  .chapter { page-break-before: always; }
`;

function buildHtml(chapters) {
  const cover = `<section class="cover"><div class="cover-title">${esc(BOOK_TITLE)}</div><div class="cover-sub">${esc(BOOK_SUBTITLE)}</div><div class="cover-author">${esc(BOOK_AUTHOR)}</div></section>`;
  const toc = `<section class="toc-page"><div class="toc-title">Contents</div>${groupChapters(chapters)
    .map(
      (g) =>
        `<div class="toc-group">${esc(g.label)}</div>${g.items
          .map((c) => `<div class="toc-item"><a href="#${c.slug}">${esc(c.title)}</a></div>`)
          .join('')}`
    )
    .join('')}</section>`;
  const body = chapters.map((c) => `<section class="chapter">${c.body}</section>`).join('\n');
  return `<!doctype html><html lang="${BOOK_LANG}"><head><meta charset="utf-8" /><title>${esc(BOOK_TITLE)}</title><style>${PRINT_CSS}</style></head><body>${cover}${toc}${body}</body></html>`;
}

async function main() {
  const chapters = loadChapters();
  const html = buildHtml(chapters);

  // Honour an explicit Chromium path when set (headless / sandboxed CI where the
  // default Playwright browser build isn't present); otherwise use the default.
  const executablePath = process.env.PW_CHROMIUM_PATH;
  const browser = await chromium.launch(executablePath ? { executablePath } : {});
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle' });
  const pdfBytes = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
  await browser.close();

  // Full metadata + language (Chromium only writes Title/Creator).
  const doc = await PDFDocument.load(pdfBytes);
  const when = bookDate();
  doc.setTitle(BOOK_TITLE);
  doc.setAuthor(BOOK_AUTHOR);
  doc.setSubject(BOOK_SUBTITLE);
  doc.setKeywords(BOOK_KEYWORDS);
  doc.setProducer('MECE Studio book builder (Playwright + pdf-lib)');
  doc.setCreator('MECE Studio book builder');
  doc.setCreationDate(when);
  doc.setModificationDate(when);
  doc.catalog.set(PDFName.of('Lang'), PDFString.of(BOOK_LANG));
  // Deterministic trailer /ID from the stable book id — Chromium emits a random
  // /ID each run, which would otherwise make every rebuild byte-different.
  const idHex = createHash('sha256').update(BOOK_ID).digest('hex').slice(0, 32).toUpperCase();
  const id = PDFArray.withContext(doc.context);
  id.push(PDFHexString.of(idHex));
  id.push(PDFHexString.of(idHex));
  doc.context.trailerInfo.ID = id;
  const out = await doc.save();
  writeFileSync(OUT, out);
  process.stdout.write(`PDF: ${OUT} (${chapters.length} chapters, ${(out.length / 1024).toFixed(0)} KB)\n`);
}

main().catch((e) => {
  process.stderr.write(`book:pdf failed — ${e.message}\n`);
  process.exit(1);
});
