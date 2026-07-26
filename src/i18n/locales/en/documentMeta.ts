/**
 * Document-level metadata — the strings that live outside the React tree.
 *
 * `index.html` ships these in English as the pre-hydration default (so a crawler
 * or a slow first paint still sees something sensible); `useDocumentLanguage`
 * then keeps them in step with the active locale at runtime.
 */
export const documentMeta = {
  /** The brand name is deliberately not translated. */
  documentTitle: 'MECE Studio',
  documentDescription: 'Build McKinsey-style issue trees with built-in MECE checking.',
};
