// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDoc } from '../domain/factory';
import { downloadText } from './download';
import {
  InvalidTreeFileError,
  openTreeFile,
  saveTreeFile,
  saveTreeFileAs,
  serializeTree,
  suggestedFileName,
  supportsFileSystemAccess,
} from './fileSystemAccess';

vi.mock('./download', () => ({ downloadText: vi.fn() }));

const w = () => window as unknown as Record<string, unknown>;

/** Install (or remove, when `undefined`) the two File System Access pickers. */
function setPickers(open: unknown, save: unknown) {
  if (open === undefined) delete w().showOpenFilePicker;
  else w().showOpenFilePicker = open;
  if (save === undefined) delete w().showSaveFilePicker;
  else w().showSaveFilePicker = save;
}

/** A stand-in FileSystemFileHandle that records what gets written to it. */
function fakeHandle(file?: File) {
  const writes: string[] = [];
  return {
    name: 'tree.json',
    writes,
    getFile: vi.fn(async () => file as File),
    createWritable: vi.fn(async () => ({
      write: vi.fn(async (t: string) => {
        writes.push(t);
      }),
      close: vi.fn(async () => {}),
    })),
    queryPermission: vi.fn(async () => 'granted' as PermissionState),
    requestPermission: vi.fn(async () => 'granted' as PermissionState),
  };
}

afterEach(() => {
  setPickers(undefined, undefined);
  vi.clearAllMocks();
});

describe('supportsFileSystemAccess', () => {
  it('is true only when both pickers exist', () => {
    setPickers(undefined, undefined);
    expect(supportsFileSystemAccess()).toBe(false);
    setPickers(() => {}, undefined);
    expect(supportsFileSystemAccess()).toBe(false);
    setPickers(
      () => {},
      () => {}
    );
    expect(supportsFileSystemAccess()).toBe(true);
  });
});

describe('serializeTree / suggestedFileName', () => {
  it('round-trips the document as pretty JSON', () => {
    const doc = createDoc('Q', 1);
    expect(JSON.parse(serializeTree(doc)).rootId).toBe(doc.rootId);
  });

  it('derives a filesystem-friendly name from the root question', () => {
    expect(suggestedFileName(createDoc('Why are sales down?', 1))).toBe('why-are-sales-down.json');
    // A title that slugifies to nothing falls back to a generic name.
    expect(suggestedFileName(createDoc('###', 1))).toBe('mece-tree.json');
  });
});

describe('openTreeFile', () => {
  it('opens via the picker and returns the handle (FSA path)', async () => {
    const doc = createDoc('Picked', 1);
    const handle = fakeHandle(new File([serializeTree(doc)], 'tree.json'));
    setPickers(
      vi.fn(async () => [handle]),
      vi.fn()
    );
    const opened = await openTreeFile();
    expect(opened?.doc.rootId).toBe(doc.rootId);
    expect(opened?.handle).toBe(handle);
  });

  it('returns null when the user cancels the picker', async () => {
    const abort = Object.assign(new Error('cancel'), { name: 'AbortError' });
    setPickers(
      vi.fn(async () => {
        throw abort;
      }),
      vi.fn()
    );
    expect(await openTreeFile()).toBeNull();
  });

  it('throws InvalidTreeFileError for a non-tree file', async () => {
    const handle = fakeHandle(new File(['{"nope":1}'], 'x.json'));
    setPickers(
      vi.fn(async () => [handle]),
      vi.fn()
    );
    await expect(openTreeFile()).rejects.toBeInstanceOf(InvalidTreeFileError);
  });

  it('falls back to a file input when FSA is unsupported', async () => {
    const doc = createDoc('Fallback', 1);
    const file = new File([serializeTree(doc)], 'tree.json');
    const listeners: Record<string, () => void> = {};
    const input = {
      type: '',
      accept: '',
      style: {} as CSSStyleDeclaration,
      files: [file],
      addEventListener(ev: string, cb: () => void) {
        listeners[ev] = cb;
      },
      remove() {},
      click() {
        listeners.change?.();
      },
    };
    const createSpy = vi
      .spyOn(document, 'createElement')
      .mockReturnValue(input as unknown as HTMLElement);
    const appendSpy = vi
      .spyOn(document.body, 'appendChild')
      .mockImplementation((node) => node as never);
    setPickers(undefined, undefined);

    const opened = await openTreeFile();
    createSpy.mockRestore();
    appendSpy.mockRestore();

    expect(opened?.handle).toBeNull();
    expect(opened?.doc.rootId).toBe(doc.rootId);
  });
});

describe('saveTreeFileAs', () => {
  it('writes through the save picker and returns the new handle', async () => {
    const doc = createDoc('Q', 1);
    const handle = fakeHandle();
    setPickers(
      vi.fn(),
      vi.fn(async () => handle)
    );
    const result = await saveTreeFileAs(doc);
    expect(result).toBe(handle);
    expect(handle.writes[0]).toContain(doc.rootId);
  });

  it('returns null when the save picker is cancelled', async () => {
    const abort = Object.assign(new Error('cancel'), { name: 'AbortError' });
    setPickers(
      vi.fn(),
      vi.fn(async () => {
        throw abort;
      })
    );
    expect(await saveTreeFileAs(doc())).toBeNull();
  });

  it('falls back to a download when FSA is unsupported', async () => {
    const d = createDoc('Q', 1);
    setPickers(undefined, undefined);
    const result = await saveTreeFileAs(d);
    expect(result).toBeNull();
    expect(downloadText).toHaveBeenCalledWith(
      suggestedFileName(d),
      serializeTree(d),
      'application/json'
    );
  });
});

describe('saveTreeFile', () => {
  it('writes back to an existing handle without prompting', async () => {
    const d = createDoc('Q', 1);
    const handle = fakeHandle();
    const savePicker = vi.fn();
    setPickers(vi.fn(), savePicker);
    const result = await saveTreeFile(d, handle);
    expect(result).toBe(handle);
    expect(savePicker).not.toHaveBeenCalled();
    expect(handle.writes[0]).toContain(d.rootId);
  });

  it('prompts for a location when there is no existing handle', async () => {
    const d = createDoc('Q', 1);
    const fresh = fakeHandle();
    const savePicker = vi.fn(async () => fresh);
    setPickers(vi.fn(), savePicker);
    const result = await saveTreeFile(d, null);
    expect(savePicker).toHaveBeenCalled();
    expect(result).toBe(fresh);
  });

  it('re-prompts via Save As when permission on the handle is denied', async () => {
    const d = createDoc('Q', 1);
    const denied = fakeHandle();
    denied.queryPermission = vi.fn(async () => 'denied' as PermissionState);
    denied.requestPermission = vi.fn(async () => 'denied' as PermissionState);
    const fresh = fakeHandle();
    const savePicker = vi.fn(async () => fresh);
    setPickers(vi.fn(), savePicker);
    const result = await saveTreeFile(d, denied);
    expect(savePicker).toHaveBeenCalled();
    expect(result).toBe(fresh);
  });
});

/** A throwaway valid document. */
function doc() {
  return createDoc('Q', 1);
}
