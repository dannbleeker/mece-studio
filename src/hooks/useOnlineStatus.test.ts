// @vitest-environment happy-dom
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useOnlineStatus } from './useOnlineStatus';

/** `navigator.onLine` is a prototype getter, so override it on the instance. */
function setOnLine(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => value });
}

afterEach(() => {
  Reflect.deleteProperty(navigator, 'onLine');
  vi.restoreAllMocks();
});

describe('useOnlineStatus', () => {
  it('seeds from navigator.onLine', () => {
    setOnLine(false);
    expect(renderHook(() => useOnlineStatus()).result.current).toBe(false);
  });

  it('follows the window offline / online events', () => {
    setOnLine(true);
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);

    setOnLine(false);
    act(() => window.dispatchEvent(new Event('offline')));
    expect(result.current).toBe(false);

    setOnLine(true);
    act(() => window.dispatchEvent(new Event('online')));
    expect(result.current).toBe(true);
  });

  it('removes both listeners on unmount', () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    renderHook(() => useOnlineStatus()).unmount();
    const events = remove.mock.calls.map(([event]) => event);
    expect(events).toContain('online');
    expect(events).toContain('offline');
  });
});
