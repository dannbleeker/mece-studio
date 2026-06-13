// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HeaderMenu, type MenuEntry } from './HeaderMenu';

afterEach(cleanup);

function setup(onPick = vi.fn()) {
  const items: MenuEntry[] = [
    { key: 'a', label: 'Alpha', onClick: onPick },
    { key: 'sep', divider: true },
    { key: 'b', label: 'Beta', onClick: vi.fn(), disabled: true },
  ];
  render(
    <HeaderMenu
      triggerLabel="More actions"
      triggerContent="⋯"
      triggerClassName="trigger"
      items={items}
    />
  );
  return { onPick };
}

describe('HeaderMenu', () => {
  it('is closed until the trigger is clicked', () => {
    setup();
    expect(screen.queryByRole('button', { name: 'Alpha' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'More actions' }));
    expect(screen.getByRole('button', { name: 'Alpha' })).toBeTruthy();
  });

  it('reflects open state on the trigger (aria-expanded)', () => {
    setup();
    const trigger = screen.getByRole('button', { name: 'More actions' });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('runs an item and closes', () => {
    const { onPick } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'More actions' }));
    fireEvent.click(screen.getByRole('button', { name: 'Alpha' }));
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Alpha' })).toBeNull(); // closed
  });

  it('renders disabled items as disabled', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'More actions' }));
    expect((screen.getByRole('button', { name: 'Beta' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('closes on Escape', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'More actions' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('button', { name: 'Alpha' })).toBeNull();
  });

  it('closes on an outside click', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'More actions' }));
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('button', { name: 'Alpha' })).toBeNull();
  });
});
