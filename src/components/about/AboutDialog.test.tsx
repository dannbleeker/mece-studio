// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { en } from '@/i18n/locales/en';
import { __resetOfflineReadinessForTest } from '@/pwa/offlineReadiness';
import { AboutDialog } from './AboutDialog';

afterEach(() => {
  cleanup();
  // The readiness check repairs at most once per session; reset so each test
  // exercises the same starting state.
  __resetOfflineReadinessForTest();
  Reflect.deleteProperty(navigator, 'serviceWorker');
  Reflect.deleteProperty(navigator, 'storage');
  vi.unstubAllGlobals();
});

describe('AboutDialog', () => {
  it('shows the dual-license summary and key links', () => {
    render(<AboutDialog onClose={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: en.app.aboutTitle })).toBeTruthy();
    expect(screen.getByText(en.app.licenseSoftware)).toBeTruthy();
    expect(screen.getByText(en.app.licenseBook)).toBeTruthy();
    expect(screen.getByText(en.app.aboutLinks.guide.label, { exact: false })).toBeTruthy();
    expect(
      screen.getByRole('link', { name: new RegExp(en.app.aboutLinks.source.label) })
    ).toBeTruthy();
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
    const dialog = screen.getByRole('dialog', { name: en.app.aboutTitle });
    fireEvent.click(within(dialog).getByRole('button', { name: en.app.close }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  /**
   * The panel exists so a user can screenshot one place and tell us whether the
   * service worker installed and whether the precache populated — the two
   * unknowns behind a "No internet access" report.
   */
  describe('offline readiness', () => {
    it('reports an installed worker and a populated precache', async () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true,
        value: { getRegistration: async () => ({ active: {} }) },
      });
      vi.stubGlobal('caches', {
        keys: async () => ['workbox-precache-v2-https://mece'],
        open: async () => ({ keys: async () => Array.from({ length: 26 }, () => ({})) }),
      });

      render(<AboutDialog onClose={vi.fn()} />);
      expect(screen.getByText(en.diagnostics.heading)).toBeTruthy();
      await waitFor(() => expect(screen.getByText(en.diagnostics.swActive)).toBeTruthy());
      expect(screen.getByText(en.diagnostics.offlineReadyYes({ count: 26 }))).toBeTruthy();
    });

    // An active worker with nothing cached is what an eviction leaves behind —
    // the one reading that explains a "No internet access" report.
    it('calls out an active worker over an empty precache', async () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true,
        value: { getRegistration: async () => ({ active: {}, update: async () => undefined }) },
      });
      Object.defineProperty(navigator, 'storage', {
        configurable: true,
        value: { persisted: async () => false, estimate: async () => ({ usage: 0 }) },
      });
      vi.stubGlobal('caches', {
        keys: async () => ['workbox-precache-v2-https://mece'],
        open: async () => ({ keys: async () => [] }),
      });

      render(<AboutDialog onClose={vi.fn()} />);
      await waitFor(() => expect(screen.getByText(en.diagnostics.swActive)).toBeTruthy());
      expect(screen.getByText(en.diagnostics.offlineReadyEmpty)).toBeTruthy();
      expect(screen.getByText(en.diagnostics.persistedNo)).toBeTruthy();
    });

    it('distinguishes "cannot tell" from "no" when the APIs are unavailable', async () => {
      render(<AboutDialog onClose={vi.fn()} />);
      await waitFor(() => expect(screen.getByText(en.diagnostics.swUnsupported)).toBeTruthy());
      expect(screen.getByText(en.diagnostics.offlineReadyUnknown)).toBeTruthy();
      expect(screen.getByText(en.diagnostics.persistedUnknown)).toBeTruthy();
      expect(screen.getByText(en.diagnostics.sizeUnknown)).toBeTruthy();
    });
  });
});
