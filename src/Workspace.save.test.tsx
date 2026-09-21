// @vitest-environment happy-dom
/**
 * A failed "Save to file" must say so.
 *
 * A cancelled picker already resolves `null` inside `fileSystemAccess`, so anything
 * that throws out of these handlers is a genuine write failure — a full disk, a
 * permission revoked since the handle was bound, a file that moved. They had no
 * catch, and the menu items call them as `void onSaveJson()`, so the failure was an
 * unhandled rejection and nothing else: the menu closed, no error appeared, and the
 * user walked away believing a copy existed. `onOpenFile` in the same component has
 * always reported its failures; saving is the direction where silence costs data.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { en } from '@/i18n/locales/en';
import { useStore } from '@/store';
import { Workspace } from './Workspace';

vi.mock('@/services/fileSystemAccess', () => ({
  InvalidTreeFileError: class extends Error {},
  openTreeFile: vi.fn(),
  saveTreeFile: vi.fn(async () => {
    throw new Error('disk full');
  }),
  saveTreeFileAs: vi.fn(async () => {
    throw new Error('disk full');
  }),
}));
vi.mock('@/services/fileHandles', () => ({
  getFileHandle: vi.fn(async () => null),
  setFileHandle: vi.fn(async () => undefined),
  clearFileHandle: vi.fn(async () => undefined),
}));

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const FRESH = useStore.getState();
let alertSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  alertSpy = vi.fn();
  vi.stubGlobal('alert', alertSpy);
  useStore.setState(FRESH, true);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const openOverflow = () =>
  fireEvent.click(screen.getByRole('button', { name: en.app.moreActions }));

describe('saving to a file when the write fails', () => {
  it('tells the user instead of failing silently', async () => {
    render(<Workspace />);
    openOverflow();
    fireEvent.click(screen.getByRole('button', { name: en.app.save }));
    await vi.waitFor(() => expect(alertSpy).toHaveBeenCalledWith(en.app.saveFileFailed));
  });

  it('tells the user when Save As fails too', async () => {
    render(<Workspace />);
    openOverflow();
    fireEvent.click(screen.getByRole('button', { name: en.app.saveAs }));
    await vi.waitFor(() => expect(alertSpy).toHaveBeenCalledWith(en.app.saveFileFailed));
  });
});
