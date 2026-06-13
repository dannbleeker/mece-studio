// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Toaster } from './Toaster';
import { showToast, useToastStore } from './toastStore';

beforeEach(() => useToastStore.setState({ toasts: [] }));
afterEach(cleanup);

describe('Toaster', () => {
  it('renders a toast and runs + dismisses its action', () => {
    const run = vi.fn();
    showToast('info', 'A new version is available.', { action: { label: 'Refresh now', run } });
    render(<Toaster />);
    expect(screen.getByText('A new version is available.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Refresh now' }));
    expect(run).toHaveBeenCalledTimes(1);
    expect(useToastStore.getState().toasts).toHaveLength(0); // dismissed after the action
  });

  it('dismisses with the ✕ button', () => {
    showToast('success', 'Ready to use offline.');
    render(<Toaster />);
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('renders nothing when there are no toasts', () => {
    const { container } = render(<Toaster />);
    expect(container.firstChild).toBeNull();
  });
});
