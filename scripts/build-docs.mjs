// Render repo Markdown docs to standalone, styled HTML pages in public/, so they
// ship at the site root (/notices.html, /user-guide.html) and are linked from the
// in-app About dialog. marked only; node-form, runs in the gate and the deploy
// build. Pages whose source file is absent are skipped (USER_GUIDE.md arrives with
// the user-manual artifact).
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { marked } from 'marked';
import { BOOK_SLUG } from './lib/bookChapters.mjs';

const PAGES = [
  {
    source: 'NOTICE.md',
    output: 'public/notices.html',
    title: 'Notices — MECE Studio',
    h1: 'Third-party notices &amp; trademarks',
  },
  {
    source: 'USER_GUIDE.md',
    output: 'public/user-guide.html',
    title: 'User Guide — MECE Studio',
    h1: 'MECE Studio — User Guide',
  },
];

const STYLES = `
  :root { color-scheme: light; --ink:#1f2937; --muted:#6b7280; --line:#e8e6df; --primary:#3f6fb0; --bg:#faf9f5; --code:#f3f1ea; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); font:16px/1.65 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; -webkit-font-smoothing:antialiased; }
  main { max-width: 46rem; margin: 0 auto; padding: 24px 22px 80px; }
  .page-header { display:flex; align-items:baseline; gap:12px; padding-bottom:16px; margin-bottom:24px; border-bottom:1px solid var(--line); }
  .page-header .brand { font-weight:600; color:var(--primary); }
  .page-header .back { margin-left:auto; font-size:14px; text-decoration:none; color:var(--primary); }
  h1 { font-size: 28px; letter-spacing:-0.01em; margin: 0 0 24px; }
  h2 { font-size: 21px; margin: 38px 0 12px; padding-bottom:6px; border-bottom:1px solid var(--line); }
  h3 { font-size: 16px; margin: 26px 0 8px; }
  a { color: var(--primary); }
  p, li { color: var(--ink); }
  ul, ol { padding-left: 1.3em; }
  li { margin: 4px 0; }
  code { background: var(--code); padding: 1px 5px; border-radius: 4px; font-size: 0.88em; font-family: ui-monospace,SFMono-Regular,Menlo,monospace; }
  pre { background: var(--code); padding: 14px 16px; border-radius: 8px; overflow-x: auto; }
  pre code { background: none; padding: 0; }
  blockquote { margin: 16px 0; padding: 4px 16px; border-left: 3px solid var(--primary); color: var(--muted); }
  table { border-collapse: collapse; width: 100%; margin: 16px 0; font-size: 14.5px; }
  th, td { border: 1px solid var(--line); padding: 7px 10px; text-align: left; vertical-align: top; }
  th { background: #f3f1ea; font-weight: 600; }
  kbd { background:#fff; border:1px solid var(--line); border-bottom-width:2px; border-radius:5px; padding:1px 6px; font-size:0.82em; font-family:ui-monospace,monospace; }
  hr { border:0; border-top:1px solid var(--line); margin: 28px 0; }
  footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid var(--line); color: var(--muted); font-size: 13px; }
`;

function page({ title, h1, body }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>${STYLES}</style>
</head>
<body>
  <main>
    <header class="page-header"><span class="brand">MECE Studio</span><a class="back" href="/">← back to the app</a></header>
    <h1>${h1}</h1>
    ${body}
    <footer>Rendered from the canonical Markdown in the MECE Studio repository.</footer>
  </main>
</body>
</html>
`;
}

let built = 0;
for (const p of PAGES) {
  if (!existsSync(p.source)) continue;
  const md = readFileSync(p.source, 'utf8').replace(/^#\s+.+?\n+/, ''); // drop leading H1; the shell adds its own
  const body = marked.parse(md, { async: false });
  writeFileSync(p.output, page({ title: p.title, h1: p.h1, body }));
  process.stdout.write(`  ${p.source} -> ${p.output}\n`);
  built++;
}

// Copy the built book artifacts into public/ so they ship to the site root
// (/Issue-Trees-with-MECE-Studio.pdf / .epub), get cached offline, and can be
// linked from the About dialog. Skipped until `pnpm book` has produced them.
for (const ext of ['pdf', 'epub']) {
  const src = `docs/guide/${BOOK_SLUG}.${ext}`;
  if (existsSync(src)) {
    copyFileSync(src, `public/${BOOK_SLUG}.${ext}`);
    process.stdout.write(`  ${src} -> public/${BOOK_SLUG}.${ext}\n`);
  }
}
process.stdout.write(`docs: rendered ${built} page(s).\n`);
