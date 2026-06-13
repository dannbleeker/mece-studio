// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DECOMPOSITION_LABELS } from '@/domain/constants';
import { splitOf } from '@/domain/tree';
import { useStore } from '@/store';
import { StartPage } from './StartPage';

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

describe('StartPage', () => {
  it('shows the key-question hero on the default Start section', () => {
    render(<StartPage />);
    expect(screen.getByText("What's your key question?")).toBeTruthy();
  });

  it('switches sections from the sidebar', () => {
    render(<StartPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Templates' }));
    expect(screen.getByText('Decomposition frameworks')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Learn MECE' }));
    expect(screen.getByText(/Mutually Exclusive, Collectively Exhaustive/)).toBeTruthy();
  });

  it('builds a tree from the hero and enters the workspace', () => {
    render(<StartPage />);
    fireEvent.change(screen.getByLabelText('Key question'), {
      target: { value: 'Why are sales down?' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Build an issue tree/ }));
    expect(s().view).toBe('workspace');
    expect(s().doc.nodes[s().doc.rootId]?.label).toBe('Why are sales down?');
  });

  it('creating from a framework opens a scaffolded tree in the workspace', () => {
    render(<StartPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Templates' }));
    fireEvent.click(screen.getByText(DECOMPOSITION_LABELS.binary));
    expect(s().view).toBe('workspace');
    expect(splitOf(s().doc, s().doc.rootId)?.decomposition).toBe('binary');
  });

  it('shows a store-driven tree count on the All trees nav item', () => {
    render(<StartPage />);
    const allTrees = screen.getByRole('button', { name: /All trees/ });
    expect(allTrees.textContent).toContain(String(s().library.length));
  });
});
