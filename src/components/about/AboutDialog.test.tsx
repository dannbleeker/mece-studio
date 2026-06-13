// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AboutDialog } from './AboutDialog';

afterEach(cleanup);

describe('AboutDialog', () => {
  it('shows the dual-license summary and key links', () => {
    render(<AboutDialog onClose={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: 'About MECE Studio' })).toBeTruthy();
    expect(screen.getByText('Apache-2.0')).toBeTruthy();
    expect(screen.getByText('CC BY-NC 4.0')).toBeTruthy();
    expect(screen.getByText(/User Guide/)).toBeTruthy();
    expect(screen.getByRole('link', { name: /Source on GitHub/ })).toBeTruthy();
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(<AboutDialog onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on the ✕ button', () => {
    const onClose = vi.fn();
    render(<AboutDialog onClose={onClose} />);
    const dialog = screen.getByRole('dialog', { name: 'About MECE Studio' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
