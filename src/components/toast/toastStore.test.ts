import { beforeEach, describe, expect, it } from 'vitest';
import { showToast, useToastStore } from './toastStore';

beforeEach(() => useToastStore.setState({ toasts: [] }));

describe('toast store', () => {
  it('queues a toast with default duration and no action', () => {
    const id = showToast('info', 'Hello');
    const { toasts } = useToastStore.getState();
    expect(toasts).toHaveLength(1);
    expect(toasts[0]).toMatchObject({ id, kind: 'info', message: 'Hello', durationMs: 5000 });
    expect(toasts[0]?.action).toBeUndefined();
  });

  it('carries an action and a custom duration', () => {
    showToast('success', 'Done', { action: { label: 'Undo', run: () => {} }, durationMs: 1000 });
    const toast = useToastStore.getState().toasts[0];
    expect(toast?.action?.label).toBe('Undo');
    expect(toast?.durationMs).toBe(1000);
  });

  it('dismiss removes a toast by id', () => {
    const id = showToast('info', 'x');
    showToast('info', 'y');
    useToastStore.getState().dismiss(id);
    const { toasts } = useToastStore.getState();
    expect(toasts).toHaveLength(1);
    expect(toasts[0]?.message).toBe('y');
  });
});
