// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { en } from '@/i18n/locales/en';
import { useStore } from '@/store';
import { PrintPreview } from './PrintPreview';

const FRESH = useStore.getState();
const s = () => useStore.getState();

beforeEach(() => {
  localStorage.clear();
  useStore.setState(FRESH, true);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('PrintPreview', () => {
  it('renders the tree as an outline and triggers printing', () => {
    s().setRootQuestion('Root question');
    s().addChild(s().doc.rootId, 'Child A');
    s().addChild(s().doc.rootId, 'Child B');
    const printSpy = vi.fn();
    vi.stubGlobal('print', printSpy);

    render(<PrintPreview onClose={() => {}} />);
    expect(screen.getByRole('heading', { name: 'Root question' })).toBeTruthy();
    expect(screen.getByText('Child A')).toBeTruthy();
    expect(screen.getByText('Child B')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: en.exports.printAction }));
    expect(printSpy).toHaveBeenCalledTimes(1);
  });

  it('summarises the tree kind and MECE state from the catalogue', () => {
    s().setRootQuestion('Root question');
    render(<PrintPreview onClose={() => {}} />);
    expect(
      screen.getByText(`${en.enums.treeKind.freeform} · ${en.exports.printNotDecomposed}`)
    ).toBeTruthy();
  });

  it('closes from the Close button', () => {
    let closed = false;
    render(<PrintPreview onClose={() => (closed = true)} />);
    fireEvent.click(screen.getByRole('button', { name: en.exports.printClose }));
    expect(closed).toBe(true);
  });
});
