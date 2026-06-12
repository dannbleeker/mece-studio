// The book's canonical date: the commit time of the last change to a book *input*.
// Both builders stamp every timestamp from this, so identical sources produce
// byte-identical artifacts and a no-change rebuild doesn't churn the committed files.
//
// The pathspec lists the markdown and the builders explicitly — NOT the whole
// `docs/guide` directory, which also holds the generated .pdf/.epub. Keying off the
// directory would let each rebuild commit bump the date and feed the next build a new
// stamp, churning forever.
import { spawnSync } from 'node:child_process';

const INPUTS = [
  'docs/guide/*.md',
  'scripts/build-book-pdf.mjs',
  'scripts/build-book-epub.mjs',
  'scripts/lib/bookChapters.mjs',
  'scripts/lib/issueTreeSvg.mjs',
  'scripts/lib/bookDate.mjs',
];

const FALLBACK = new Date('2026-06-12T00:00:00Z');

export function bookDate() {
  const r = spawnSync('git', ['log', '-1', '--format=%cI', '--', ...INPUTS], { encoding: 'utf8' });
  const iso = (r.stdout || '').trim();
  const d = iso ? new Date(iso) : FALLBACK;
  return Number.isNaN(d.getTime()) ? FALLBACK : d;
}
