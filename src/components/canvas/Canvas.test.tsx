// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { childrenOf } from '@/domain/tree';
import { useStore } from '@/store';
import { Canvas } from './Canvas';

// React Flow needs ResizeObserver, which happy-dom doesn't provide.
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
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('Canvas', () => {
  it('renders the canvas toolbar (find, collapse, export)', () => {
    render(<Canvas />);
    expect(screen.getByLabelText('Find nodes')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Collapse all' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Expand all' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'PNG' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'PDF' })).toBeTruthy();
  });

  it('reports a match count while searching', async () => {
    s().setRootQuestion('Find me here');
    render(<Canvas />);
    fireEvent.change(screen.getByLabelText('Find nodes'), { target: { value: 'find' } });
    expect(await screen.findByText(/1 match/)).toBeTruthy();
  });

  it('collapse all / expand all drive the store', () => {
    const rootId = s().doc.rootId;
    s().addChild(rootId, 'A');
    const a = childrenOf(s().doc, rootId)[0];
    if (!a) throw new Error('expected child A');
    s().addChild(a.id, 'A1'); // A (non-root) now has a child → collapsible
    render(<Canvas />);
    fireEvent.click(screen.getByRole('button', { name: 'Collapse all' }));
    expect(s().doc.nodes[a.id]?.collapsed).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Expand all' }));
    expect(s().doc.nodes[a.id]?.collapsed).toBeUndefined();
  });
});
