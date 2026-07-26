// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '@/domain/settings';
import { en } from '@/i18n/locales/en';
import { LOCALES } from '@/i18n/registry';
import { useStore } from '@/store';
import { SettingsDialog } from './SettingsDialog';

const FRESH = useStore.getState();
beforeEach(() => {
  localStorage.clear();
  useStore.setState(FRESH, true);
});
afterEach(cleanup);

describe('SettingsDialog', () => {
  it('renders every preference', () => {
    render(<SettingsDialog onClose={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: en.settings.title })).toBeTruthy();
    expect(screen.getByLabelText(en.settings.locale.label)).toBeTruthy();
    expect(screen.getByText(en.settings.sortSiblingsByPriority.label)).toBeTruthy();
    expect(screen.getByText(en.settings.strictOverlap.label)).toBeTruthy();
    expect(screen.getByLabelText(en.settings.formulaTolerance.label)).toBeTruthy();
  });

  it('the language row offers every shipped locale, in its own language', () => {
    render(<SettingsDialog onClose={vi.fn()} />);
    const select = screen.getByLabelText(en.settings.locale.label) as HTMLSelectElement;
    expect([...select.options].map((o) => o.textContent)).toEqual(
      LOCALES.map((l) => l.nativeLabel)
    );
    expect(select.value).toBe(useStore.getState().settings.locale);
  });

  it('picking a language writes the locale through to the store', () => {
    // With one shipped locale the pick cannot change the value, so spy on the
    // action: what matters is that the picker reports into `settings.locale`.
    const setSettings = vi.fn();
    useStore.setState({ setSettings });
    render(<SettingsDialog onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(en.settings.locale.label), { target: { value: 'en' } });
    expect(setSettings).toHaveBeenCalledWith({ locale: 'en' });
  });

  it('toggling a checkbox writes through to the store', () => {
    render(<SettingsDialog onClose={vi.fn()} />);
    expect(useStore.getState().settings.sortSiblingsByPriority).toBe(false);
    fireEvent.click(
      screen.getByRole('checkbox', { name: new RegExp(en.settings.sortSiblingsByPriority.label) })
    );
    expect(useStore.getState().settings.sortSiblingsByPriority).toBe(true);
  });

  it('changing the tolerance select writes through to the store', () => {
    render(<SettingsDialog onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(en.settings.formulaTolerance.label), {
      target: { value: '0.02' },
    });
    expect(useStore.getState().settings.formulaTolerance).toBe(0.02);
  });

  it('marks the shipped default in the tolerance picker', () => {
    render(<SettingsDialog onClose={vi.fn()} />);
    const marked = en.settings.toleranceDefaultOption({
      ratio: DEFAULT_SETTINGS.formulaTolerance,
    });
    expect(screen.getByRole('option', { name: marked })).toBeTruthy();
  });
});
