// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
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

  it('builds a tree from the hero, choosing a split, and enters the workspace', () => {
    render(<StartPage />);
    fireEvent.change(screen.getByLabelText('Key question'), {
      target: { value: 'Why are sales down?' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Build an issue tree/ }));
    // The chooser opens — pick a decomposition to scaffold the first split.
    const chooser = screen.getByRole('dialog', { name: /How do you want to split/ });
    fireEvent.click(within(chooser).getByRole('button', { name: /Binary \(A \/ not-A\)/ }));
    expect(s().view).toBe('workspace');
    expect(s().doc.nodes[s().doc.rootId]?.label).toBe('Why are sales down?');
    expect(splitOf(s().doc, s().doc.rootId)?.decomposition).toBe('binary');
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

  it('renames a tree from its card', () => {
    render(<StartPage />);
    fireEvent.click(screen.getByRole('button', { name: /All trees/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Rename/ }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Rename tree' }), {
      target: { value: 'Renamed from card' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Rename' }));
    expect(s().doc.nodes[s().doc.rootId]?.label).toBe('Renamed from card');
  });

  it('duplicates a tree from its card', () => {
    render(<StartPage />);
    const before = s().library.length;
    fireEvent.click(screen.getByRole('button', { name: /All trees/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Duplicate/ }));
    expect(s().library).toHaveLength(before + 1);
  });

  it('marks the active sidebar item and labels cards for assistive tech', () => {
    render(<StartPage />);
    expect(screen.getByRole('button', { name: 'Start' }).getAttribute('aria-current')).toBe('page');
    fireEvent.click(screen.getByRole('button', { name: /All trees/ }));
    expect(screen.getByRole('button', { name: /^Open / })).toBeTruthy();
  });

  it('deletes a tree from its card and stays on Start', () => {
    s().newDoc(); // two trees in the library
    render(<StartPage />);
    const before = s().library.length;
    fireEvent.click(screen.getByRole('button', { name: /All trees/ }));
    fireEvent.click(screen.getAllByRole('button', { name: /^Delete/ })[0]); // card → opens confirm
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete tree' })
    );
    expect(s().library).toHaveLength(before - 1);
    expect(s().view).toBe('start');
  });

  it('deleting the last tree empties the gallery (no reseeded duplicate)', () => {
    render(<StartPage />);
    expect(s().library).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: /All trees/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Delete/ })); // card → opens confirm
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete tree' })
    );
    expect(s().library).toHaveLength(0);
    expect(screen.getByText('No trees yet.')).toBeTruthy();
  });
});
