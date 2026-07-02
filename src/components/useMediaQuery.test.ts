// @vitest-environment happy-dom
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useMediaQuery } from './useMediaQuery';

afterEach(() => vi.unstubAllGlobals());

/** Stub window.matchMedia with a controllable match state shared across calls. */
function stubMatchMedia(initial: boolean) {
  let matches = initial;
  const listeners = new Set<() => void>();
  vi.stubGlobal('matchMedia', () => ({
    get matches() {
      return matches;
    },
    media: '',
    addEventListener: (_: string, cb: () => void) => {
      listeners.add(cb);
    },
    removeEventListener: (_: string, cb: () => void) => {
      listeners.delete(cb);
    },
  }));
  return {
    set(v: boolean) {
      matches = v;
      for (const cb of listeners) cb();
    },
  };
}

describe('useMediaQuery', () => {
  it('returns the initial match and reacts to changes', () => {
    const ctl = stubMatchMedia(true);
    const { result } = renderHook(() => useMediaQuery('(max-width: 639px)'));
    expect(result.current).toBe(true);
    act(() => ctl.set(false));
    expect(result.current).toBe(false);
  });

  it('defaults to false when matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined);
    const { result } = renderHook(() => useMediaQuery('(max-width: 639px)'));
    expect(result.current).toBe(false);
  });
});
