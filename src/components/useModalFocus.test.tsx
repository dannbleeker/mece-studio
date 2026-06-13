// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useModalFocus } from './useModalFocus';

function Dialog({ onClose }: { onClose: () => void }) {
  const ref = useModalFocus<HTMLDivElement>(onClose);
  return (
    <div ref={ref} tabIndex={-1} role="dialog" aria-label="Test">
      <button type="button">first</button>
      <button type="button">last</button>
    </div>
  );
}

afterEach(cleanup);

describe('useModalFocus', () => {
  it('focuses the dialog on mount and closes on Escape', () => {
    const onClose = vi.fn();
    render(<Dialog onClose={onClose} />);
    expect(document.activeElement).toBe(screen.getByRole('dialog', { name: 'Test' }));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('traps Tab within the dialog', () => {
    render(<Dialog onClose={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    const first = buttons[0] as HTMLElement;
    const last = buttons[buttons.length - 1] as HTMLElement;

    last.focus();
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(document.activeElement).toBe(first); // wraps forward

    first.focus();
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last); // wraps backward
  });

  it('restores focus to the trigger on unmount', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    const { unmount } = render(<Dialog onClose={vi.fn()} />);
    expect(document.activeElement).not.toBe(trigger); // focus moved into the dialog
    unmount();
    expect(document.activeElement).toBe(trigger); // and restored on close

    trigger.remove();
  });
});
