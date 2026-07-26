// @vitest-environment happy-dom
/**
 * The pseudo-locale smoke test — the check that actually proves the extraction
 * is complete.
 *
 * `scripts/check-i18n.mjs` scans source text, so it can be fooled: a string
 * assembled in a helper, pulled from a module constant, or built by `.join()`
 * never appears as a JSX literal. This test asks the only question that can't be
 * dodged — *render the screen and see whether every word came from the
 * catalogue*. Under `en-XA` every catalogue string comes back bracketed, so
 * anything still reading as plain English is a string that escaped.
 *
 * User content is deliberately exempt: node labels are the user's own words and
 * must render verbatim. The fixture stamps them with a sentinel so the walker
 * can tell "text the user typed" from "text we forgot to extract".
 */
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StartPage } from '@/components/start/StartPage';
import type { NodeId } from '@/domain/types';
import { useStore } from '@/store';
import { Workspace } from '@/Workspace';
import { PSEUDO_CLOSE, PSEUDO_OPEN, pseudoMessages } from './pseudo';
import { EditorMessagesProvider } from './useEditorMessages';
import { MessagesProvider } from './useMessages';

/**
 * Marks every string the *user* owns, so the walker can skip it.
 *
 * Each label gets a *distinct* sentinel word rather than a shared prefix plus a
 * suffix: a shared content word makes the MECE engine flag the split as an
 * overlap, which pins the health chip and the review dock in their flagged
 * state — so the clean-state wording (`MECE clean`, the empty dock) never
 * renders and never gets checked. The fixture has to leave the tree MECE-clean
 * for this test to see the whole UI.
 */
const USER = 'Zzuser';

/**
 * Text that is legitimately the same in every language, with the reason. Keep
 * this list tiny: each entry is a hole in the check, so anything added here
 * needs to be genuinely untranslatable rather than merely inconvenient.
 */
const NOT_TRANSLATABLE = new Map([['MECE Studio', 'Brand name — never translated.']]);

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const FRESH = useStore.getState();
const s = () => useStore.getState();

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  localStorage.clear();
  useStore.setState(FRESH, true);
  // Every piece of user content carries the sentinel, and no two share a word.
  s().setRootQuestion(`${USER}root`);
  s().addChild(s().doc.rootId, `${USER}alpha`);
  s().addChild(s().doc.rootId, `${USER}beta`);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** Two or more consecutive letters reads as a word rather than a glyph. */
const HAS_WORD = /\p{L}{2,}/u;

/**
 * Every rendered text node that looks like prose but is neither pseudo-localised
 * nor user content. Also catches `title` / `aria-label` / `placeholder`, which
 * are invisible to a text-node walk but very much user-facing.
 */
function untranslated(root: HTMLElement): string[] {
  const found: string[] = [];

  const check = (raw: string) => {
    const text = raw.trim();
    if (text === '' || !HAS_WORD.test(text)) return;
    if (text.includes(USER)) return;
    if (text.includes(PSEUDO_OPEN) || text.includes(PSEUDO_CLOSE)) return;
    if (NOT_TRANSLATABLE.has(text)) return;
    found.push(text);
  };

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    check(node.textContent ?? '');
    node = walker.nextNode();
  }

  for (const el of root.querySelectorAll('[title],[aria-label],[placeholder],[alt]')) {
    for (const attr of ['title', 'aria-label', 'placeholder', 'alt']) {
      const value = el.getAttribute(attr);
      if (value) check(value);
    }
  }

  return [...new Set(found)];
}

/**
 * Both halves have to be overridden: the core provider alone leaves the editor
 * namespaces composing themselves from the real catalogue, so the inspector and
 * the review dock would render in plain English and the test would pass while
 * checking nothing.
 */
function renderPseudo(ui: React.ReactElement) {
  const messages = pseudoMessages();
  return render(
    <MessagesProvider messages={messages}>
      <EditorMessagesProvider messages={messages}>{ui}</EditorMessagesProvider>
    </MessagesProvider>
  );
}

describe('pseudo-locale', () => {
  it('accents and brackets a plain catalogue string', () => {
    expect(pseudoMessages().review.chipClean).toBe(`${PSEUDO_OPEN}ṀÉÇÉ çłéáñ${PSEUDO_CLOSE}`);
  });

  it('wraps render functions so their result is pseudo-localised too', () => {
    const rendered = pseudoMessages().review.openCount({ count: 3 });
    expect(rendered.startsWith(PSEUDO_OPEN)).toBe(true);
    expect(rendered.endsWith(PSEUDO_CLOSE)).toBe(true);
  });

  it('preserves the catalogue shape (still a valid Messages)', () => {
    const p = pseudoMessages();
    expect(Object.keys(p).sort()).toEqual(Object.keys(pseudoMessages()).sort());
    expect(Array.isArray(p.content.scaffold.binary)).toBe(true);
  });

  it('leaves no untranslated English on the workspace', () => {
    const { container } = renderPseudo(<Workspace />);
    expect(untranslated(container)).toEqual([]);
  });

  it('leaves no untranslated English on the inspector with a node selected', () => {
    const childId = Object.keys(s().doc.nodes).find((k) => k !== s().doc.rootId);
    s().select(childId as NodeId);
    const { container } = renderPseudo(<Workspace />);
    expect(untranslated(container)).toEqual([]);
  });

  it('leaves no untranslated English on the review dock', () => {
    s().setDecomposition(s().doc.rootId, 'segment'); // no "Other" → a CE gap to show
    s().setReviewOpen(true);
    const { container } = renderPseudo(<Workspace />);
    expect(untranslated(container)).toEqual([]);
  });

  it('leaves no untranslated English on the Start page', () => {
    const { container } = renderPseudo(<StartPage />);
    expect(untranslated(container)).toEqual([]);
  });
});
