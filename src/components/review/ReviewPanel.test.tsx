// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createDoc } from '@/domain/factory';
import { addChild, childrenOf, setDecomposition } from '@/domain/tree';
import { useStore } from '@/store';
import { ReviewPanel } from './ReviewPanel';

const FRESH = useStore.getState();
const s = () => useStore.getState();
beforeEach(() => {
  localStorage.clear();
  useStore.setState(FRESH, true);
});
afterEach(cleanup);

/** A root segment split with no "Other" bucket → exactly one flagged split (CE gap). */
function flaggedDoc() {
  let doc = createDoc('Root question', 0);
  doc = addChild(doc, doc.rootId, 'A').doc;
  doc = addChild(doc, doc.rootId, 'B').doc;
  doc = setDecomposition(doc, doc.rootId, 'segment');
  return { doc, flaggedId: doc.rootId };
}

describe('ReviewPanel', () => {
  it('shows the clean empty state when nothing is flagged', () => {
    render(<ReviewPanel />);
    expect(screen.getByText(/nothing to review/)).toBeTruthy();
  });

  it('lists a flagged split and locates it on the canvas', () => {
    const { doc, flaggedId } = flaggedDoc();
    s().openDoc(doc);
    render(<ReviewPanel />);
    expect(screen.getByRole('complementary', { name: 'MECE review' })).toBeTruthy();
    fireEvent.click(screen.getByText('Root question'));
    expect(s().selectedId).toBe(flaggedId);
    expect(s().locateNonce).toBeGreaterThan(0);
  });

  it('the "Other" remedy adds a bucket that clears the CE gap', () => {
    const { doc, flaggedId } = flaggedDoc();
    s().openDoc(doc);
    render(<ReviewPanel />);
    fireEvent.click(screen.getByRole('button', { name: /Add an .Other. bucket/ }));
    const kids = childrenOf(s().doc, flaggedId).map((k) => k.label);
    expect(kids).toContain('Other');
    expect(screen.getByText(/nothing to review/)).toBeTruthy(); // row cleared
  });

  it('closes from the ✕ button', () => {
    s().setReviewOpen(true);
    render(<ReviewPanel />);
    fireEvent.click(screen.getByRole('button', { name: 'Close review' }));
    expect(s().reviewOpen).toBe(false);
  });
});
