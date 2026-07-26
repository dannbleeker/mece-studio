// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { en } from '@/i18n/locales/en';
import { Toaster } from './Toaster';
import { showToast, useToastStore } from './toastStore';

beforeEach(() => useToastStore.setState({ toasts: [] }));
afterEach(cleanup);

describe('Toaster', () => {
  it('renders a toast and runs + dismisses its action', () => {
    const run = vi.fn();
    showToast('info', en.app.updateAvailable, {
      action: { label: en.app.refreshNow, run },
    });
    render(<Toaster />);
    expect(screen.getByText(en.app.updateAvailable)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: en.app.refreshNow }));
    expect(run).toHaveBeenCalledTimes(1);
    expect(useToastStore.getState().toasts).toHaveLength(0); // dismissed after the action
  });

  it('dismisses with the ✕ button', () => {
    showToast('success', en.app.offlineReady);
    render(<Toaster />);
    fireEvent.click(screen.getByRole('button', { name: en.app.dismissToast }));
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('renders nothing when there are no toasts', () => {
    const { container } = render(<Toaster />);
    expect(container.firstChild).toBeNull();
  });
});
