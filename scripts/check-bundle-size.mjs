// Bundle-size budget — the last stage of the gate. Measures the gzipped size of
// the EAGER entry chunk(s): the /assets/*.js files referenced by dist/index.html
// (via <script> or <link rel="modulepreload">), checked against the budget in
// bundle-budget.json. Lazily-imported chunks load on demand and are deliberately
// NOT counted, so heavy optional libs (e.g. image export) can be code-split
// without inflating the first-load budget.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const budget = JSON.parse(readFileSync('bundle-budget.json', 'utf8'));
const indexHtml = path.join('dist', 'index.html');

if (!existsSync(indexHtml)) {
  process.stderr.write('No dist/index.html — run `pnpm build` first.\n');
  process.exit(1);
}

const html = readFileSync(indexHtml, 'utf8');
const refs = new Set();
for (const m of html.matchAll(/(?:src|href)="\/(assets\/[^"]+\.js)"/g)) {
  refs.add(m[1]);
}

if (refs.size === 0) {
  process.stderr.write('No eager JS chunks referenced by dist/index.html.\n');
  process.exit(1);
}

let totalBytes = 0;
const rows = [];
for (const rel of refs) {
  const gz = gzipSync(readFileSync(path.join('dist', rel))).length;
  totalBytes += gz;
  rows.push({ file: rel.replace('assets/', ''), kb: gz / 1024 });
}

rows.sort((a, b) => b.kb - a.kb);
for (const { file, kb } of rows) {
  process.stdout.write(`  ${kb.toFixed(1).padStart(7)} KB gz  ${file}\n`);
}

const totalKb = totalBytes / 1024;
const limit = budget.totalJsGzipKb;
process.stdout.write(`  ${'-'.repeat(30)}\n`);
process.stdout.write(`  ${totalKb.toFixed(1).padStart(7)} KB gz  eager total (budget ${limit} KB)\n`);

if (totalKb > limit) {
  process.stderr.write(
    `\nEager bundle over budget by ${(totalKb - limit).toFixed(1)} KB. Trim it, code-split it, or bump bundle-budget.json deliberately.\n`
  );
  process.exit(1);
}
process.stdout.write('Within budget.\n');
