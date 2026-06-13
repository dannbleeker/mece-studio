import { readFileSync } from 'node:fs';
const s = JSON.parse(readFileSync('coverage/coverage-summary.json', 'utf8'));
const norm = (k) => k.replace(/\\/g, '/').replace(/.*\/src\//, 'src/');
const rows = Object.entries(s)
  .filter(([k]) => k !== 'total')
  .map(([k, v]) => ({ f: norm(k), st: v.statements.pct, br: v.branches.pct, fn: v.functions.pct }))
  .filter((r) => r.st < 100 || r.br < 100)
  .sort((a, b) => a.st - b.st || a.br - b.br);
console.log(`TOTAL st ${s.total.statements.pct}% br ${s.total.branches.pct}%`);
console.log('--- files below 100% (st / br / fn) ---');
for (const r of rows) {
  console.log(`${String(r.st).padStart(5)} ${String(r.br).padStart(5)} ${String(r.fn).padStart(5)}  ${r.f}`);
}
