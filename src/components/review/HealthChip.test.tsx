// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createDoc } from '@/domain/factory';
import { addChild, setDecomposition } from '@/domain/tree';
import { useStore } from '@/store';
import { HealthChip } from './HealthChip';

const FRESH = useStore.getState();
const s = () => useStore.getState();
beforeEach(() => {
  localStorage.clear();
  useStore.setState(FRESH, true);
});
afterEach(cleanup);

describe('HealthChip', () => {
  it('shows "MECE clean" and toggles the review dock', () => {
    render(<HealthChip />);
    const chip = screen.getByRole('button', { name: /MECE clean/ });
    fireEvent.click(chip);
    expect(s().reviewOpen).toBe(true);
    fireEvent.click(chip);
    expect(s().reviewOpen).toBe(false);
  });

  it('shows the review count when a split is flagged', () => {
    // A single root segment split with no "Other" bucket → exactly one flag.
    let doc = createDoc('Q', 0);
    doc = addChild(doc, doc.rootId, 'A').doc;
    doc = addChild(doc, doc.rootId, 'B').doc;
    doc = setDecomposition(doc, doc.rootId, 'segment'); // no "Other" → CE gap
    s().openDoc(doc);
    render(<HealthChip />);
    expect(screen.getByRole('button', { name: /1 to review/ })).toBeTruthy();
  });
});
