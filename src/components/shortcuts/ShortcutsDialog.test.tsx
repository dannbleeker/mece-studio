// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { en } from '@/i18n/locales/en';
import { ShortcutsDialog } from './ShortcutsDialog';

afterEach(cleanup);

describe('ShortcutsDialog', () => {
  it('lists every shortcut in the catalogue with its keys', () => {
    render(<ShortcutsDialog onClose={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: en.app.shortcuts })).toBeTruthy();
    for (const row of en.app.shortcutRows) {
      expect(screen.getByText(row.action)).toBeTruthy();
      for (const key of row.keys) expect(screen.getAllByText(key).length).toBeGreaterThan(0);
    }
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(<ShortcutsDialog onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
