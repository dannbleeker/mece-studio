// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useStore } from '@/store';
import { App } from './App';

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const FRESH = useStore.getState();
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  localStorage.clear();
  useStore.setState(FRESH, true);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('App', () => {
  it('renders the header, the canvas toolbar, and the empty inspector', () => {
    render(<App />);
    expect(screen.getByText('MECE Studio')).toBeTruthy();
    expect(screen.getByRole('button', { name: '+ New' })).toBeTruthy();
    expect(screen.getByLabelText('Find nodes')).toBeTruthy();
    expect(screen.getByText(/Select a node to edit it/)).toBeTruthy();
  });

  it('opens the About dialog from the header', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'About' }));
    expect(screen.getByRole('dialog', { name: 'About MECE Studio' })).toBeTruthy();
  });

  it('opens the keyboard-shortcuts overlay with the ? key', () => {
    render(<App />);
    fireEvent.keyDown(window, { key: '?' });
    expect(screen.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeTruthy();
  });

  it('loads an example from the header picker', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Load an example tree'), {
      target: { value: 'profit' },
    });
    expect(useStore.getState().library).toHaveLength(2); // starter + the example
  });
});
