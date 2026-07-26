// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { en } from '@/i18n/locales/en';
import { AboutDialog } from './AboutDialog';

afterEach(cleanup);

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
});
