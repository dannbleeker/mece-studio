// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useStore } from '@/store';
import { SettingsDialog } from './SettingsDialog';

const FRESH = useStore.getState();
beforeEach(() => {
  localStorage.clear();
  useStore.setState(FRESH, true);
});
afterEach(cleanup);

describe('SettingsDialog', () => {
  it('renders the three preferences', () => {
    render(<SettingsDialog onClose={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeTruthy();
    expect(screen.getByText('Sort siblings by priority')).toBeTruthy();
    expect(screen.getByText('Stricter overlap detection')).toBeTruthy();
    expect(screen.getByLabelText('Formula tolerance')).toBeTruthy();
  });

  it('toggling a checkbox writes through to the store', () => {
    render(<SettingsDialog onClose={vi.fn()} />);
    expect(useStore.getState().settings.sortSiblingsByPriority).toBe(false);
    fireEvent.click(screen.getByRole('checkbox', { name: /Sort siblings by priority/ }));
    expect(useStore.getState().settings.sortSiblingsByPriority).toBe(true);
  });

  it('changing the tolerance select writes through to the store', () => {
    render(<SettingsDialog onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Formula tolerance'), { target: { value: '0.02' } });
    expect(useStore.getState().settings.formulaTolerance).toBe(0.02);
  });
});
