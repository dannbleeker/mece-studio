// Bundle-size budget — the last stage of the gate. Sums the gzipped size of the
// built JS in dist/assets and fails if it exceeds the budget in
// bundle-budget.json (the single source of truth). Runs after `vite build`.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const budget = JSON.parse(readFileSync('bundle-budget.json', 'utf8'));
const assetsDir = path.join('dist', 'assets');

if (!existsSync(assetsDir)) {
  process.stderr.write(`No ${assetsDir} — run \`pnpm build\` first.\n`);
  process.exit(1);
}

let totalBytes = 0;
const rows = [];
for (const file of readdirSync(assetsDir)) {
  if (!file.endsWith('.js')) continue;
  const gz = gzipSync(readFileSync(path.join(assetsDir, file))).length;
  totalBytes += gz;
  rows.push({ file, kb: gz / 1024 });
}

rows.sort((a, b) => b.kb - a.kb);
for (const { file, kb } of rows) {
  process.stdout.write(`  ${kb.toFixed(1).padStart(7)} KB gz  ${file}\n`);
}

const totalKb = totalBytes / 1024;
const limit = budget.totalJsGzipKb;
process.stdout.write(`  ${'-'.repeat(30)}\n`);
process.stdout.write(`  ${totalKb.toFixed(1).padStart(7)} KB gz  total (budget ${limit} KB)\n`);

if (totalKb > limit) {
  process.stderr.write(
    `\nOver budget by ${(totalKb - limit).toFixed(1)} KB. Trim it, or bump bundle-budget.json deliberately (own commit, explain why).\n`
  );
  process.exit(1);
}
process.stdout.write('Within budget.\n');
