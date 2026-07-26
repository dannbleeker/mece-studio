// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { splitOf } from '@/domain/tree';
import { en } from '@/i18n/locales/en';
import { docName } from '@/services/storage';
import { useStore } from '@/store';
import { StartPage } from './StartPage';

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const FRESH = useStore.getState();
const s = () => useStore.getState();

/**
 * Match an accessible name by its opening words. Nav items carry a count badge
 * and card actions carry the tree's name, so neither is an exact-match target —
 * and a prefix keeps the assertion catalogue-driven rather than hand-typed.
 */
const startsWith = (text: string) => (name: string) => name.startsWith(text);

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
    expect(screen.getByText(en.start.heroTitle)).toBeTruthy();
  });

  it('switches sections from the sidebar', () => {
    render(<StartPage />);
    fireEvent.click(screen.getByRole('button', { name: en.start.section.templates }));
    expect(screen.getByText(en.start.decompositionsHeading)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: en.start.section.learn }));
    expect(screen.getByText(en.start.learnHalvesTitle)).toBeTruthy();
  });

  it('builds a tree from the hero, choosing a split, and enters the workspace', () => {
    render(<StartPage />);
    fireEvent.change(screen.getByLabelText(en.start.questionLabel), {
      target: { value: 'Why are sales down?' },
    });
    fireEvent.click(screen.getByRole('button', { name: en.start.buildTree }));
    // The chooser opens — pick a decomposition to scaffold the first split.
    const chooser = screen.getByRole('dialog', { name: en.start.splitChooserTitle });
    fireEvent.click(within(chooser).getByText(en.enums.decomposition.binary));
    expect(s().view).toBe('workspace');
    expect(s().doc.nodes[s().doc.rootId]?.label).toBe('Why are sales down?');
    expect(splitOf(s().doc, s().doc.rootId)?.decomposition).toBe('binary');
  });

  it('creating from a framework opens a scaffolded tree in the workspace', () => {
    render(<StartPage />);
    fireEvent.click(screen.getByRole('button', { name: en.start.section.templates }));
    fireEvent.click(screen.getByText(en.enums.decomposition.binary));
    expect(s().view).toBe('workspace');
    expect(splitOf(s().doc, s().doc.rootId)?.decomposition).toBe('binary');
  });

  it('shows a store-driven tree count on the All trees nav item', () => {
    render(<StartPage />);
    const allTrees = screen.getByRole('button', { name: startsWith(en.start.section.all) });
    expect(allTrees.textContent).toContain(String(s().library.length));
  });

  it('renames a tree from its card', () => {
    render(<StartPage />);
    fireEvent.click(screen.getByRole('button', { name: startsWith(en.start.section.all) }));
    fireEvent.click(screen.getByRole('button', { name: startsWith(en.start.rename) }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByRole('textbox', { name: en.start.renameDialogTitle }), {
      target: { value: 'Renamed from card' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: en.start.rename }));
    expect(s().doc.nodes[s().doc.rootId]?.label).toBe('Renamed from card');
  });

  it('duplicates a tree from its card', () => {
    render(<StartPage />);
    const before = s().library.length;
    fireEvent.click(screen.getByRole('button', { name: startsWith(en.start.section.all) }));
    fireEvent.click(screen.getByRole('button', { name: startsWith(en.start.duplicate) }));
    expect(s().library).toHaveLength(before + 1);
  });

  it('marks the active sidebar item and labels cards for assistive tech', () => {
    render(<StartPage />);
    expect(
      screen.getByRole('button', { name: en.start.section.start }).getAttribute('aria-current')
    ).toBe('page');
    fireEvent.click(screen.getByRole('button', { name: startsWith(en.start.section.all) }));
    // A tree card's open button, named after the tree (not the mobile nav toggle).
    const name = docName(s().doc, en.content.untitledTree);
    expect(screen.getByRole('button', { name: en.start.openTree({ name }) })).toBeTruthy();
  });

  it('deletes a tree from its card and stays on Start', () => {
    s().newDoc(); // two trees in the library
    render(<StartPage />);
    const before = s().library.length;
    fireEvent.click(screen.getByRole('button', { name: startsWith(en.start.section.all) }));
    // card → opens confirm
    fireEvent.click(screen.getAllByRole('button', { name: startsWith(en.start.delete) })[0]);
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: en.start.deleteDialogTitle })
    );
    expect(s().library).toHaveLength(before - 1);
    expect(s().view).toBe('start');
  });

  it('deleting the last tree empties the gallery (no reseeded duplicate)', () => {
    render(<StartPage />);
    expect(s().library).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: startsWith(en.start.section.all) }));
    // card → opens confirm
    fireEvent.click(screen.getByRole('button', { name: startsWith(en.start.delete) }));
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: en.start.deleteDialogTitle })
    );
    expect(s().library).toHaveLength(0);
    expect(screen.getByText(en.start.noTreesYet)).toBeTruthy();
  });
});
