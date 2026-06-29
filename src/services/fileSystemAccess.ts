/**
 * Open and save real `.json` issue-tree files from disk.
 *
 * Uses the File System Access API (`showOpenFilePicker` / `showSaveFilePicker`)
 * where available — which gives a real, reusable file handle so a later "Save"
 * writes back to the same file silently — and falls back to a hidden
 * `<input type=file>` for open and a Blob download for save on browsers without
 * it (Firefox, Safari). Mirrors TP Studio's `services/fileSystemAccess.ts`.
 *
 * This layers explicit file open/save **on top of** the localStorage autosave;
 * it does not replace it. Persisting handles per document lives in
 * `./fileHandles.ts`.
 */

import type { IssueTreeDoc } from '@/domain/types';
import { downloadText } from '@/services/download';
import { docName, parseDoc } from '@/services/storage';

const JSON_MIME = 'application/json';
const FILE_EXTENSION = '.json';

/** Thrown when a chosen file isn't a valid MECE Studio tree. */
export class InvalidTreeFileError extends Error {
  constructor() {
    super('That file is not a valid MECE Studio tree (.json).');
    this.name = 'InvalidTreeFileError';
  }
}

// --- Minimal File System Access typings (not in every TS DOM lib) ----------

interface FilePickerAcceptType {
  description?: string;
  accept: Record<string, string[]>;
}
interface OpenFilePickerOptions {
  types?: FilePickerAcceptType[];
  multiple?: boolean;
  excludeAcceptAllOption?: boolean;
}
interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: FilePickerAcceptType[];
}
interface FileSystemWritable {
  write(data: string): Promise<void>;
  close(): Promise<void>;
}
interface FsPermissionDescriptor {
  mode?: 'read' | 'readwrite';
}

/** The slice of `FileSystemFileHandle` we depend on. */
export interface TreeFileHandle {
  readonly name: string;
  getFile(): Promise<File>;
  createWritable(): Promise<FileSystemWritable>;
  queryPermission?(descriptor?: FsPermissionDescriptor): Promise<PermissionState>;
  requestPermission?(descriptor?: FsPermissionDescriptor): Promise<PermissionState>;
}

interface FsaWindow {
  showOpenFilePicker?(options?: OpenFilePickerOptions): Promise<TreeFileHandle[]>;
  showSaveFilePicker?(options?: SaveFilePickerOptions): Promise<TreeFileHandle>;
}

const PICKER_TYPES: FilePickerAcceptType[] = [
  { description: 'MECE Studio tree', accept: { [JSON_MIME]: [FILE_EXTENSION] } },
];

/** True when the browser supports the File System Access open/save pickers. */
export function supportsFileSystemAccess(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as FsaWindow;
  return typeof w.showOpenFilePicker === 'function' && typeof w.showSaveFilePicker === 'function';
}

/** The cancel/abort the picker throws when the user dismisses it — not an error. */
function isAbort(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

/** Pretty-print a document for a `.json` file. */
export function serializeTree(doc: IssueTreeDoc): string {
  return JSON.stringify(doc, null, 2);
}

/** A filesystem-friendly filename derived from the tree's root question. */
export function suggestedFileName(doc: IssueTreeDoc): string {
  const slug = docName(doc)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${slug || 'mece-tree'}${FILE_EXTENSION}`;
}

/** A document opened from disk, with its file handle when one is available. */
export interface OpenedTree {
  doc: IssueTreeDoc;
  /** A reusable handle (File System Access path) or `null` (input fallback). */
  handle: TreeFileHandle | null;
}

/** Read + validate a File's text as an issue-tree document. */
async function readTreeFromFile(file: File): Promise<IssueTreeDoc> {
  const doc = parseDoc(await file.text());
  if (!doc) throw new InvalidTreeFileError();
  return doc;
}

/** Open a file via a transient hidden `<input type=file>` (fallback path). */
function pickFileViaInput(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = `${JSON_MIME},${FILE_EXTENSION}`;
    input.style.display = 'none';
    // `cancel` fires on dismiss in modern browsers; `change` fires on pick.
    input.addEventListener('change', () => {
      resolve(input.files?.[0] ?? null);
      input.remove();
    });
    input.addEventListener('cancel', () => {
      resolve(null);
      input.remove();
    });
    document.body.appendChild(input);
    input.click();
  });
}

/**
 * Open a `.json` issue-tree file from disk.
 * Resolves to `null` when the user cancels the picker, and throws
 * {@link InvalidTreeFileError} when the chosen file isn't a valid tree.
 */
export async function openTreeFile(): Promise<OpenedTree | null> {
  if (supportsFileSystemAccess()) {
    const showOpenFilePicker = (window as unknown as FsaWindow).showOpenFilePicker as NonNullable<
      FsaWindow['showOpenFilePicker']
    >;
    let handles: TreeFileHandle[];
    try {
      handles = await showOpenFilePicker({ types: PICKER_TYPES, multiple: false });
    } catch (error) {
      if (isAbort(error)) return null;
      throw error;
    }
    const handle = handles[0];
    if (!handle) return null;
    return { doc: await readTreeFromFile(await handle.getFile()), handle };
  }

  const file = await pickFileViaInput();
  if (!file) return null;
  return { doc: await readTreeFromFile(file), handle: null };
}

/** Ensure we hold readwrite permission on a (possibly persisted) handle. */
async function ensureWritable(handle: TreeFileHandle): Promise<boolean> {
  const opts: FsPermissionDescriptor = { mode: 'readwrite' };
  if (handle.queryPermission && (await handle.queryPermission(opts)) === 'granted') return true;
  if (handle.requestPermission && (await handle.requestPermission(opts)) === 'granted') return true;
  // No permission API on the handle → assume usable (older implementations).
  return !handle.queryPermission && !handle.requestPermission;
}

/** Write text into an open file handle. */
async function writeHandle(handle: TreeFileHandle, text: string): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(text);
  await writable.close();
}

/**
 * Save `doc` to disk, prompting for a location.
 * Returns the chosen handle (File System Access) or `null` (download fallback /
 * user cancelled).
 */
export async function saveTreeFileAs(doc: IssueTreeDoc): Promise<TreeFileHandle | null> {
  const text = serializeTree(doc);
  if (supportsFileSystemAccess()) {
    const w = window as unknown as FsaWindow;
    let handle: TreeFileHandle;
    try {
      handle = await (w.showSaveFilePicker as NonNullable<FsaWindow['showSaveFilePicker']>)({
        suggestedName: suggestedFileName(doc),
        types: PICKER_TYPES,
      });
    } catch (error) {
      if (isAbort(error)) return null;
      throw error;
    }
    await writeHandle(handle, text);
    return handle;
  }

  downloadText(suggestedFileName(doc), text, JSON_MIME);
  return null;
}

/**
 * Save `doc` to disk. With a usable existing `handle` (and File System Access
 * support) it writes back silently; otherwise it falls back to
 * {@link saveTreeFileAs}. Returns the handle the document is now bound to, or
 * `null` (download fallback / user cancelled).
 */
export async function saveTreeFile(
  doc: IssueTreeDoc,
  handle: TreeFileHandle | null
): Promise<TreeFileHandle | null> {
  if (supportsFileSystemAccess() && handle && (await ensureWritable(handle))) {
    await writeHandle(handle, serializeTree(doc));
    return handle;
  }
  return saveTreeFileAs(doc);
}
