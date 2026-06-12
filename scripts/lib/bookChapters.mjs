// Shared manifest for the book builders (build-book-epub.mjs + build-book-pdf.mjs).
// Single source of truth for chapter order, metadata, and the stable identifier —
// so the PDF and EPUB are assembled from exactly the same inputs.

export const BOOK_TITLE = 'Issue Trees with MECE Studio';
export const BOOK_SUBTITLE = 'A practitioner’s guide to structured problem solving';
export const BOOK_AUTHOR = 'Dann Bleeker Pedersen';
export const BOOK_PUBLISHER = 'mece-studio.struktureretsundfornuft.dk';
export const BOOK_LANG = 'en';
export const BOOK_DESCRIPTION =
  'A practitioner’s guide to structured problem solving with issue trees — decomposing a question MECE, working hypotheses, weighing evidence, doing the numbers, and communicating answer-first — taught alongside the free MECE Studio tool.';
export const BOOK_KEYWORDS = [
  'MECE',
  'issue tree',
  'hypothesis-driven problem solving',
  'structured problem solving',
  'problem structuring',
  'consulting',
  'McKinsey method',
  'MECE Studio',
];

// Stable identifier — generated once and PINNED. Kindle and other readers cache a
// book by this id; a new id every rebuild would force readers to re-add it as a
// fresh copy. Never change this for the life of the book.
export const BOOK_ID = 'urn:uuid:mece-studio-issue-trees-2026-v1';

// File base for the produced artifacts (…-.pdf / …-.epub).
export const BOOK_SLUG = 'Issue-Trees-with-MECE-Studio';

// Chapter order — hand-listed (not a directory sort) so re-ordering and renaming
// is explicit and appendices never intermix with numbered chapters.
export const CHAPTER_FILES = [
  '00-foreword.md',
  '01-the-question.md',
  '02-the-issue-tree.md',
  '03-mece.md',
  '04-ways-to-decompose.md',
  '05-hypotheses.md',
  '06-prioritise.md',
  '07-evidence.md',
  '08-the-numbers.md',
  '09-synthesis.md',
  '10-a-worked-example.md',
  'appendix-a-glossary.md',
  'appendix-b-keyboard.md',
  'appendix-c-further-reading.md',
];

// TOC parts — grouped labels for the contents page (PDF) and nav (EPUB).
export const TOC_GROUPS = [
  { label: 'Beginning', match: (f) => f.startsWith('00-') },
  { label: 'Structuring the problem', match: (f) => /^0[1-4]-/.test(f) },
  { label: 'Working the tree', match: (f) => /^0[5-8]-/.test(f) },
  { label: 'Communicating the answer', match: (f) => /^(09|10)-/.test(f) },
  { label: 'Appendices', match: (f) => f.startsWith('appendix-') },
];

/** Slug (and in-document anchor id) for a chapter file: filename without `.md`. */
export const slugOf = (file) => file.replace(/\.md$/, '');

/** First H1 in the markdown, used as the chapter title (falls back to the slug). */
export function titleOf(markdown, file) {
  const m = markdown.match(/^#\s+(.+?)\s*$/m);
  return m ? m[1].trim() : slugOf(file);
}

/** Group the ordered chapter list under TOC_GROUPS, dropping empty groups. */
export function groupChapters(chapters) {
  return TOC_GROUPS.map((g) => ({
    label: g.label,
    items: chapters.filter((c) => g.match(c.file)),
  })).filter((g) => g.items.length > 0);
}
