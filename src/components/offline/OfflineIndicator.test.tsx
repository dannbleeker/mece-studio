// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { en } from '@/i18n/locales/en';
import { OfflineIndicator } from './OfflineIndicator';

function setOnLine(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => value });
}

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(navigator, 'onLine');
});

describe('OfflineIndicator', () => {
  it('says nothing while online', () => {
    setOnLine(true);
    render(<OfflineIndicator />);
    expect(screen.getByRole('status').textContent).toBe('');
  });

  it('keeps the live region mounted while online, so the notice is announced when it arrives', () => {
    setOnLine(true);
    render(<OfflineIndicator />);
    const region = screen.getByRole('status');
    expect(region.getAttribute('aria-live')).toBe('polite');

    setOnLine(false);
    act(() => window.dispatchEvent(new Event('offline')));
    // Same element, now with text — not a newly inserted one.
    expect(screen.getByRole('status')).toBe(region);
    expect(region.textContent).toBe(en.app.offlineNotice);
  });

  it('renders the notice as text, not as colour alone', () => {
    setOnLine(false);
    render(<OfflineIndicator />);
    expect(screen.getByText(en.app.offlineNotice)).toBeTruthy();
  });

  it('clears the notice when the connection returns', () => {
    setOnLine(false);
    render(<OfflineIndicator />);
    setOnLine(true);
    act(() => window.dispatchEvent(new Event('online')));
    expect(screen.getByRole('status').textContent).toBe('');
  });
});
