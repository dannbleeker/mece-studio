// `pnpm book` — build the EPUB then the PDF from docs/guide/*.md. EPUB first: it's
// pure-Node and fails fast on markdown problems before the slower Chromium PDF run.
// Node-form spawns (shell:false) so it runs under the local AppLocker policy.
import { spawnSync } from 'node:child_process';

function run(args) {
  const r = spawnSync('node', args, { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

run(['./scripts/build-book-epub.mjs']);
run(['./scripts/build-book-pdf.mjs']);
