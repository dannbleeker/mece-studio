// Build the EPUB from docs/guide/*.md. Pure Node (marked + jszip) — no browser —
// so it runs fast and fails early on markdown problems. The PDF builder consumes
// the same chapters + the same diagram source, so the two stay in lockstep.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import { marked } from 'marked';
import {
  BOOK_AUTHOR,
  BOOK_DESCRIPTION,
  BOOK_ID,
  BOOK_LANG,
  BOOK_PUBLISHER,
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
const OUT = path.join(GUIDE, `${BOOK_SLUG}.epub`);
// The book's canonical date (git-derived) drives every timestamp, so a no-change
// rebuild is byte-identical instead of stamping the current build time.
const DATE = bookDate();
const PUB_DATE = DATE.toISOString().slice(0, 10);
const MODIFIED = DATE.toISOString().replace(/\.\d+Z$/, 'Z');

const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]
  );

const VOID = new Set(['br', 'hr', 'img', 'meta', 'link', 'input', 'area', 'col', 'wbr']);
const expand = (md) => md.replace(/<!--\s*ISSUE_TREE\s*-->/g, () => `\n\n${issueTreeSvg()}\n\n`);
// Self-close void elements so marked's HTML5 output is well-formed XHTML.
const toXhtml = (html) =>
  html.replace(/<(\w+)([^>]*?)\s*\/?>/g, (m, tag, attrs) =>
    VOID.has(tag.toLowerCase()) ? `<${tag}${attrs} />` : m
  );

function loadChapters() {
  return CHAPTER_FILES.map((file) => {
    const full = path.join(GUIDE, file);
    if (!existsSync(full)) throw new Error(`missing chapter: ${full}`);
    const md = readFileSync(full, 'utf8');
    const slug = slugOf(file);
    const title = titleOf(md, file);
    const html = marked.parse(expand(md), { async: false });
    const withId = html.replace(/<h1([^>]*)>/, `<h1$1 id="${slug}">`);
    return { file, slug, title, body: toXhtml(withId) };
  });
}

const chapterXhtml = (title, body) => `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${BOOK_LANG}">
<head><meta charset="utf-8" /><title>${esc(title)}</title><link rel="stylesheet" type="text/css" href="styles.css" /></head>
<body><section epub:type="chapter">${body}</section></body>
</html>`;

const coverXhtml = () => `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${BOOK_LANG}">
<head><meta charset="utf-8" /><title>${esc(BOOK_TITLE)}</title><link rel="stylesheet" type="text/css" href="styles.css" /></head>
<body><section class="cover"><h1 class="cover-title">${esc(BOOK_TITLE)}</h1><p class="cover-sub">${esc(BOOK_SUBTITLE)}</p><p class="cover-author">${esc(BOOK_AUTHOR)}</p></section></body>
</html>`;

const CONTAINER_XML = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml" /></rootfiles>
</container>`;

function contentOpf(chapters) {
  const manifest = [
    '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav" />',
    '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml" />',
    '<item id="styles" href="styles.css" media-type="text/css" />',
    '<item id="cover" href="cover.xhtml" media-type="application/xhtml+xml" />',
    ...chapters.map(
      (c, i) =>
        `<item id="ch${String(i).padStart(2, '0')}" href="chapter-${String(i).padStart(2, '0')}.xhtml" media-type="application/xhtml+xml" />`
    ),
  ].join('\n    ');
  const spine = [
    '<itemref idref="cover" />',
    ...chapters.map((_, i) => `<itemref idref="ch${String(i).padStart(2, '0')}" />`),
  ].join('\n    ');
  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="${BOOK_LANG}">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">${BOOK_ID}</dc:identifier>
    <dc:title>${esc(BOOK_TITLE)}</dc:title>
    <dc:creator>${esc(BOOK_AUTHOR)}</dc:creator>
    <dc:language>${BOOK_LANG}</dc:language>
    <dc:publisher>${esc(BOOK_PUBLISHER)}</dc:publisher>
    <dc:description>${esc(BOOK_DESCRIPTION)}</dc:description>
    <dc:date>${PUB_DATE}</dc:date>
    <meta property="dcterms:modified">${MODIFIED}</meta>
  </metadata>
  <manifest>
    ${manifest}
  </manifest>
  <spine toc="ncx">
    ${spine}
  </spine>
</package>`;
}

function navXhtml(chapters) {
  const groups = groupChapters(chapters)
    .map((g) => {
      const items = g.items
        .map(
          (c) =>
            `<li><a href="chapter-${String(chapters.indexOf(c)).padStart(2, '0')}.xhtml">${esc(c.title)}</a></li>`
        )
        .join('\n        ');
      return `<li>${esc(g.label)}<ol>\n        ${items}\n      </ol></li>`;
    })
    .join('\n      ');
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${BOOK_LANG}">
<head><meta charset="utf-8" /><title>Contents</title><link rel="stylesheet" type="text/css" href="styles.css" /></head>
<body><nav epub:type="toc" id="toc"><h1>Contents</h1><ol>
      ${groups}
    </ol></nav></body>
</html>`;
}

function tocNcx(chapters) {
  const points = chapters
    .map(
      (c, i) =>
        `<navPoint id="ch${i}" playOrder="${i + 1}"><navLabel><text>${esc(c.title)}</text></navLabel><content src="chapter-${String(i).padStart(2, '0')}.xhtml" /></navPoint>`
    )
    .join('\n    ');
  return `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1" xml:lang="${BOOK_LANG}">
  <head><meta name="dtb:uid" content="${BOOK_ID}" /><meta name="dtb:depth" content="1" /></head>
  <docTitle><text>${esc(BOOK_TITLE)}</text></docTitle>
  <navMap>
    ${points}
  </navMap>
</ncx>`;
}

const STYLES = `
  html { font-family: serif; }
  body { margin: 1em 1.2em; line-height: 1.5; color: #1a1a1a; }
  h1 { font-size: 1.7em; line-height: 1.2; margin: 0.6em 0 0.5em; }
  h2 { font-size: 1.3em; margin: 1.4em 0 0.4em; }
  h3 { font-size: 1.1em; margin: 1.2em 0 0.3em; }
  p { margin: 0.6em 0; }
  ul, ol { margin: 0.6em 0; padding-left: 1.4em; }
  li { margin: 0.25em 0; }
  code { font-family: monospace; background: #f0f0f0; padding: 0 0.2em; border-radius: 3px; }
  pre { background: #f0f0f0; padding: 0.8em; border-radius: 6px; overflow-x: auto; }
  blockquote { margin: 1em 0; padding: 0.2em 1em; border-left: 3px solid #3f6fb0; color: #555; font-style: italic; }
  table { border-collapse: collapse; width: 100%; margin: 1em 0; }
  th, td { border: 1px solid #ccc; padding: 0.4em 0.6em; text-align: left; }
  th { background: #eef2f8; }
  .figure { margin: 1.4em 0; text-align: center; }
  .figure svg { max-width: 100%; height: auto; }
  .figcaption { font-size: 0.85em; color: #666; margin-top: 0.4em; font-style: italic; }
  .cover { text-align: center; margin-top: 28%; }
  .cover-title { font-size: 2.2em; color: #3f6fb0; border: none; }
  .cover-sub { font-size: 1.1em; color: #444; margin-top: 0.4em; }
  .cover-author { margin-top: 2.5em; font-size: 1.05em; color: #333; }
`;

async function main() {
  const chapters = loadChapters();
  const zip = new JSZip();
  // mimetype MUST be first and stored (uncompressed) per the EPUB spec.
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
  zip.file('META-INF/container.xml', CONTAINER_XML);
  zip.file('OEBPS/content.opf', contentOpf(chapters));
  zip.file('OEBPS/nav.xhtml', navXhtml(chapters));
  zip.file('OEBPS/toc.ncx', tocNcx(chapters));
  zip.file('OEBPS/styles.css', STYLES);
  zip.file('OEBPS/cover.xhtml', coverXhtml());
  chapters.forEach((c, i) => {
    zip.file(`OEBPS/chapter-${String(i).padStart(2, '0')}.xhtml`, chapterXhtml(c.title, c.body));
  });
  // Stamp EVERY entry with the book's canonical date — including the META-INF/ and
  // OEBPS/ folder entries jszip auto-creates, which otherwise carry the build time
  // (jszip uses UTC, so this matches between local and CI) and make a no-change
  // rebuild byte-different.
  for (const name of Object.keys(zip.files)) zip.files[name].date = DATE;
  const buf = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
    mimeType: 'application/epub+zip',
  });
  writeFileSync(OUT, buf);
  process.stdout.write(`EPUB: ${OUT} (${chapters.length} chapters, ${(buf.length / 1024).toFixed(0)} KB)\n`);
}

main().catch((e) => {
  process.stderr.write(`book:epub failed — ${e.message}\n`);
  process.exit(1);
});
