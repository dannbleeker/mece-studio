// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ShortcutsDialog } from './ShortcutsDialog';

afterEach(cleanup);

describe('ShortcutsDialog', () => {
  it('lists shortcuts and their keys', () => {
    render(<ShortcutsDialog onClose={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeTruthy();
    expect(screen.getByText('Add a child to the selected node and edit it')).toBeTruthy();
    expect(screen.getByText('Remove the selected node and its subtree')).toBeTruthy();
    expect(screen.getByText('Search the library (on the Start page)')).toBeTruthy();
    expect(screen.getAllByText('Tab').length).toBeGreaterThan(0);
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(<ShortcutsDialog onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
