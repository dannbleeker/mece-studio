// Compute project metrics -> public/stats.json (+ append public/stats-history.json).
//
// Runs in CI after `vitest --coverage` and `vite build`; the stats workflow then
// commits the refreshed JSON back. Pure Node: git via spawnSync (shell:false,
// AppLocker-safe), files walked with fs, no external deps. Missing inputs degrade
// gracefully (no coverage/ -> null coverage; no dist/ -> zero bundle).
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const root = process.cwd();
const round = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d;

function git(...args) {
  const r = spawnSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return r.status === 0 ? r.stdout : '';
}
function readJson(p) {
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}
function readText(p) {
  try {
    return readFileSync(p, 'utf8');
  } catch {
    return '';
  }
}
// Recursively list files under `dir` whose name ends in one of `exts`.
function walk(dir, exts, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git' || name === 'dist') continue;
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, exts, out);
    else if (exts.some((e) => name.endsWith(e))) out.push(full);
  }
  return out;
}
const lineCount = (f) => readText(f).split('\n').length;
const sumLines = (files) => files.reduce((n, f) => n + lineCount(f), 0);
const rel = (p) => path.relative(root, p).split(path.sep).join('/');
const countAll = (files, re) => files.reduce((n, f) => n + (readText(f).match(re)?.length || 0), 0);

// ---- file inventory ----
const tsx = ['.ts', '.tsx'];
const srcAll = walk('src', tsx);
const srcApp = srcAll.filter((f) => !/\.test\.tsx?$/.test(f));
const srcTestFiles = srcAll.filter((f) => /\.test\.tsx?$/.test(f));
const unitTests = [...walk('tests', tsx), ...srcTestFiles];
const e2eTests = walk('e2e', tsx);
const scripts = walk('scripts', ['.mjs']);
const styles = walk('src', ['.css']);
const rootMd = readdirSync('.')
  .filter((n) => n.endsWith('.md'))
  .map((n) => path.join(root, n));
const docsMd = [...walk('docs', ['.md']), ...rootMd];

// ---- test counts ----
const TEST_RE = /(?:^|\s)(?:it|test)(?:\.\w+)?\s*\(/g;
const countTests = (files) => files.reduce((n, f) => n + (readText(f).match(TEST_RE)?.length || 0), 0);
const unitCount = countTests(unitTests);
const e2eCount = countTests(e2eTests);

// ---- coverage (from vitest --coverage json-summary; may be absent) ----
const cov = readJson('coverage/coverage-summary.json');
const covPart = (k) =>
  cov?.total?.[k] ? { pct: cov.total[k].pct, covered: cov.total[k].covered, total: cov.total[k].total } : null;
const coverage = cov
  ? { lines: covPart('lines'), statements: covPart('statements'), functions: covPart('functions'), branches: covPart('branches') }
  : null;
const linePct = coverage?.lines?.pct ?? null;
const perFile = [];
if (cov) {
  for (const [abs, e] of Object.entries(cov)) {
    if (abs === 'total' || !e?.lines) continue;
    const r = abs.replace(/\\/g, '/');
    const i = r.indexOf('/src/');
    const file = i >= 0 ? r.slice(i + 1) : r;
    if (file.startsWith('src/')) perFile.push({ file, pct: e.lines.pct });
  }
}
const leastCovered = [...perFile].sort((a, b) => a.pct - b.pct).slice(0, 6);

// ---- bundle (gzip dist assets; eager = chunks referenced by index.html) ----
const gzKb = (file) => gzipSync(readFileSync(file)).length / 1024;
const assetsDir = 'dist/assets';
const assets = existsSync(assetsDir) ? readdirSync(assetsDir) : [];
const eager = new Set();
for (const m of readText('dist/index.html').matchAll(/(?:src|href)="\/(assets\/[^"]+\.js)"/g)) {
  eager.add(m[1].replace('assets/', ''));
}
const sumGz = (names) => names.reduce((n, f) => n + gzKb(path.join(assetsDir, f)), 0);
const budgetKb = readJson('bundle-budget.json')?.totalJsGzipKb ?? 0;
const eagerJsGz = sumGz([...eager]);
const bundle = {
  eagerJsGzipKb: round(eagerJsGz),
  totalJsGzipKb: round(sumGz(assets.filter((n) => n.endsWith('.js')))),
  cssGzipKb: round(sumGz(assets.filter((n) => n.endsWith('.css')))),
  budgetKb,
  withinBudget: eagerJsGz <= budgetKb,
};

// ---- churn (90d, src only) + risky (high-churn ∩ low-coverage) ----
const churnMap = new Map();
for (const line of git('log', '--since=90 days ago', '--name-only', '--format=', '--', 'src').split('\n')) {
  const f = line.trim();
  if (f.startsWith('src/') && /\.tsx?$/.test(f)) churnMap.set(f, (churnMap.get(f) || 0) + 1);
}
const churnAll = [...churnMap.entries()].map(([file, commits]) => ({ file, commits })).sort((a, b) => b.commits - a.commits);
const lowCov = new Set(perFile.filter((f) => f.pct < 70).map((f) => f.file));
const risky = churnAll
  .slice(0, 15)
  .filter((c) => lowCov.has(c.file))
  .map((c) => ({ ...c, pct: perFile.find((p) => p.file === c.file)?.pct ?? null }))
  .slice(0, 6);

// ---- hygiene (src app code only) ----
const hygiene = {
  todo: countAll(srcApp, /TODO/gi),
  fixme: countAll(srcApp, /FIXME/gi),
  hack: countAll(srcApp, /\bHACK\b/g),
  anyCount: countAll(srcApp, /:\s*any\b/g) + countAll(srcApp, /\bas\s+any\b/g),
  tsIgnore: countAll(srcApp, /@ts-ignore/g),
  tsExpectError: countAll(srcApp, /@ts-expect-error/g),
  biomeIgnore: countAll(srcApp, /biome-ignore/g),
  nonNull: countAll(srcApp, /[\w)\]]!(?!=)/g),
};

// ---- feature catalogue coverage ----
const cat = readJson('docs/features.json') || { features: [], areas: [] };
const feats = cat.features;
const fTotal = feats.length;
const pctOf = (n) => (fTotal ? round((n / fTotal) * 100) : 0);
const fManual = feats.filter((f) => f.manual).length;
const fBook = feats.filter((f) => f.book).length;
const fExample = feats.filter((f) => f.bookExample).length;
const byArea = {};
for (const f of feats) {
  (byArea[f.area] ||= { total: 0, manual: 0, book: 0 }).total++;
  if (f.manual) byArea[f.area].manual++;
  if (f.book) byArea[f.area].book++;
}
const featureCoverage = {
  total: fTotal,
  manual: fManual,
  manualPct: pctOf(fManual),
  book: fBook,
  bookPct: pctOf(fBook),
  bookExample: fExample,
  bookExamplePct: pctOf(fExample),
  byArea,
  gaps: {
    noManual: feats.filter((f) => !f.manual).map((f) => ({ id: f.id, name: f.name, since: f.since })),
    noBook: feats.filter((f) => !f.book).map((f) => ({ id: f.id, name: f.name, since: f.since })),
  },
};

// ---- footprint / domain / docs / git ----
const pkg = readJson('package.json') || {};
const footprint = {
  depsProd: Object.keys(pkg.dependencies || {}).length,
  depsDev: Object.keys(pkg.devDependencies || {}).length,
  biggestFiles: srcApp
    .map((f) => ({ name: rel(f).replace(/^src\//, ''), lines: lineCount(f) }))
    .sort((a, b) => b.lines - a.lines)
    .slice(0, 6),
};
const domain = {
  features: fTotal,
  areas: (cat.areas || []).length,
  domainModules: walk('src/domain', tsx).filter((f) => !/\.test\.tsx?$/.test(f)).length,
  components: walk('src/components', ['.tsx']).length,
  exporters: byArea.Export?.total || 0,
};
const guideMd = walk('docs/guide', ['.md']);
const docs = {
  bookWords: guideMd.reduce((n, f) => n + readText(f).trim().split(/\s+/).filter(Boolean).length, 0),
  chapters: guideMd.length,
  appLoc: sumLines(srcApp),
  docToCodeRatio: sumLines(srcApp) ? round(sumLines(docsMd) / sumLines(srcApp), 2) : 0,
};
const bornIso = (git('log', '--max-parents=0', '--format=%aI', 'HEAD').trim().split('\n').pop() || '').trim();
const ageDays = bornIso ? Math.max(1, Math.round((Date.now() - new Date(bornIso).getTime()) / 86400000)) : 0;
const authorTally = {};
for (const a of git('log', '--format=%an', 'HEAD').split('\n')) {
  const n = a.trim();
  if (n) authorTally[n] = (authorTally[n] || 0) + 1;
}
let added = 0;
let removed = 0;
for (const line of git('log', '--since=30 days ago', '--numstat', '--format=').split('\n')) {
  const c = line.split('\t');
  if (c.length === 3) {
    added += Number(c[0]) || 0;
    removed += Number(c[1]) || 0;
  }
}
const gitInfo = {
  born: bornIso,
  ageDays,
  commits: Number(git('rev-list', '--count', 'HEAD').trim()) || 0,
  commits7d: Number(git('rev-list', '--count', '--since=7 days ago', 'HEAD').trim()) || 0,
  authors: Object.entries(authorTally)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6),
  churn30d: { added, removed },
  changelogEntries: (readText('CHANGELOG.md').match(/^- \*\*/gm) || []).length,
};

// ---- assemble ----
const linesTsJs = sumLines(srcApp) + sumLines(unitTests) + sumLines(e2eTests) + sumLines(scripts);
const stats = {
  generatedAt: new Date().toISOString(),
  commit: git('rev-parse', '--short', 'HEAD').trim(),
  headline: {
    linesTsJs,
    tests: unitCount + e2eCount,
    lineCoveragePct: linePct,
    commits: gitInfo.commits,
    ageDays,
    trackedFiles: git('ls-files').split('\n').filter(Boolean).length,
    featureManualPct: featureCoverage.manualPct,
    featureBookPct: featureCoverage.bookPct,
    featureExamplePct: featureCoverage.bookExamplePct,
  },
  code: [
    { category: 'App code (src, excl. tests)', files: srcApp.length, lines: sumLines(srcApp) },
    { category: 'Unit tests', files: unitTests.length, lines: sumLines(unitTests) },
    { category: 'E2E tests (Playwright)', files: e2eTests.length, lines: sumLines(e2eTests) },
    { category: 'Build scripts', files: scripts.length, lines: sumLines(scripts) },
    { category: 'Styles (CSS)', files: styles.length, lines: sumLines(styles) },
    { category: 'Docs (Markdown)', files: docsMd.length, lines: sumLines(docsMd) },
  ],
  coverage,
  tests: { unit: unitCount, e2e: e2eCount },
  domain,
  footprint,
  quality: { leastCovered, churnHotspots: churnAll.slice(0, 6), risky },
  hygiene,
  bundle,
  docs,
  featureCoverage,
  git: gitInfo,
};

writeFileSync('public/stats.json', `${JSON.stringify(stats, null, 2)}\n`);

// ---- rolling history (one upserted row per day, capped at 180) ----
const today = new Date().toISOString().slice(0, 10);
const histPath = 'public/stats-history.json';
const hist = readJson(histPath) || [];
const row = {
  date: today,
  linesTsJs,
  coveragePct: linePct,
  tests: unitCount + e2eCount,
  bundleKb: bundle.eagerJsGzipKb,
  featureManualPct: featureCoverage.manualPct,
  featureBookPct: featureCoverage.bookPct,
  featureExamplePct: featureCoverage.bookExamplePct,
};
const idx = hist.findIndex((h) => h.date === today);
if (idx >= 0) hist[idx] = row;
else hist.push(row);
writeFileSync(histPath, `${JSON.stringify(hist.slice(-180), null, 2)}\n`);

process.stdout.write(
  `stats.json written — ${linesTsJs} LOC, ${unitCount + e2eCount} tests, ` +
    `${linePct == null ? 'no' : `${linePct}%`} coverage, ${fTotal} features, ` +
    `eager bundle ${bundle.eagerJsGzipKb} KB / ${budgetKb} KB.\n`
);
