// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { onLibraryChanged } from './storage';

describe('onLibraryChanged', () => {
  it('fires for the library key only, and unsubscribes', () => {
    const cb = vi.fn();
    const off = onLibraryChanged(cb);
    window.dispatchEvent(new StorageEvent('storage', { key: 'mece-studio:settings:v1' }));
    expect(cb).not.toHaveBeenCalled();
    window.dispatchEvent(new StorageEvent('storage', { key: 'mece-studio:library:v1' }));
    expect(cb).toHaveBeenCalledTimes(1);
    // A null key is a whole-storage clear in another window — the index went too.
    window.dispatchEvent(new StorageEvent('storage', { key: null }));
    expect(cb).toHaveBeenCalledTimes(2);
    off();
    window.dispatchEvent(new StorageEvent('storage', { key: 'mece-studio:library:v1' }));
    expect(cb).toHaveBeenCalledTimes(2);
  });
});
