// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NodeId } from '@/domain/types';
import { copyToClipboard, downloadText } from '@/services/download';
import { useStore } from '@/store';
import { App } from './App';
import { Workspace } from './Workspace';

vi.mock('@/services/download', () => ({
  copyToClipboard: vi.fn(),
  downloadText: vi.fn(),
  downloadDataUrl: vi.fn(),
}));

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const FRESH = useStore.getState();
const s = () => useStore.getState();
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  localStorage.clear();
  useStore.setState(FRESH, true);
  vi.clearAllMocks();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** Open the header overflow (⋯) menu so its items are in the DOM. */
function openOverflow() {
  fireEvent.click(screen.getByRole('button', { name: 'More actions' }));
}

/** Stub the File System Access open picker to return a handle over `file`. */
function stubOpenPicker(file: File) {
  const handle = {
    name: file.name,
    getFile: async () => file,
    createWritable: async () => ({ write: async () => {}, close: async () => {} }),
  };
  vi.stubGlobal(
    'showOpenFilePicker',
    vi.fn(async () => [handle])
  );
  vi.stubGlobal('showSaveFilePicker', vi.fn());
}

describe('App routing', () => {
  it('lands on the Start page (not the canvas) by default', () => {
    render(<App />);
    expect(screen.getByText("What's your key question?")).toBeTruthy();
    expect(screen.queryByLabelText('Find nodes')).toBeNull(); // the canvas is not mounted
  });

  it('shows the workspace once a tree is open', async () => {
    s().setView('workspace');
    render(<App />);
    // Workspace is a lazy chunk now, so wait for it to resolve behind Suspense.
    expect(await screen.findByLabelText('Find nodes')).toBeTruthy(); // canvas toolbar
    expect(screen.getByRole('button', { name: '← Start' })).toBeTruthy();
  });

  it('returns to Start from the workspace Home button', async () => {
    s().setView('workspace');
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: '← Start' }));
    expect(s().view).toBe('start');
  });
});

describe('Workspace', () => {
  it('renders the header, the canvas toolbar, and the empty inspector', () => {
    render(<Workspace />);
    expect(screen.getByRole('button', { name: 'MECE Studio' })).toBeTruthy();
    expect(screen.getByLabelText('Find nodes')).toBeTruthy();
    expect(screen.getByText(/Select a node to edit it/)).toBeTruthy();
  });

  it('opens the About dialog from the overflow menu', () => {
    render(<Workspace />);
    openOverflow();
    fireEvent.click(screen.getByRole('button', { name: 'About' }));
    expect(screen.getByRole('dialog', { name: 'About MECE Studio' })).toBeTruthy();
  });

  it('opens the keyboard-shortcuts overlay with the ? key', () => {
    render(<Workspace />);
    fireEvent.keyDown(window, { key: '?' });
    expect(screen.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeTruthy();
  });

  it('copies the tree as Markdown from the overflow menu', () => {
    render(<Workspace />);
    openOverflow();
    fireEvent.click(screen.getByRole('button', { name: 'Copy Markdown' }));
    expect(copyToClipboard).toHaveBeenCalledTimes(1);
  });

  it('saves the tree to a file from the overflow menu (download fallback)', async () => {
    // happy-dom has no File System Access API, so Save falls back to a download.
    render(<Workspace />);
    openOverflow();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(downloadText).toHaveBeenCalledWith(
        expect.stringMatching(/\.json$/),
        expect.any(String),
        'application/json'
      )
    );
  });

  it('exports the tree as JSON from the Export menu', () => {
    render(<Workspace />);
    fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    fireEvent.click(screen.getByRole('button', { name: 'JSON' }));
    expect(downloadText).toHaveBeenCalledWith(
      'mece-tree.json',
      expect.any(String),
      'application/json'
    );
  });

  it('toggles the synthesis panel', () => {
    render(<Workspace />);
    fireEvent.click(screen.getByRole('button', { name: 'Synthesis' }));
    expect(screen.getByText('Answer-first synthesis')).toBeTruthy();
  });

  it('undoes a tree edit from the toolbar and redoes it with the keyboard', () => {
    s().addChild(s().doc.rootId, 'child');
    render(<Workspace />);
    const n = () => Object.keys(s().doc.nodes).length;
    expect(n()).toBe(2);
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(n()).toBe(1);
    fireEvent.keyDown(window, { key: 'y', ctrlKey: true });
    expect(n()).toBe(2);
  });

  it('deletes the active tree after confirmation', () => {
    s().newDoc();
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true)
    );
    render(<Workspace />);
    openOverflow();
    fireEvent.click(screen.getByRole('button', { name: 'Delete tree' }));
    expect(s().library).toHaveLength(1);
  });

  it('opens the Settings dialog from the header', () => {
    render(<Workspace />);
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeTruthy();
  });

  it('opens a valid JSON tree from a file (File System Access)', async () => {
    s().setRootQuestion('Imported question');
    const json = JSON.stringify(s().doc);
    s().setRootQuestion('Diverged'); // so the import is what restores the label
    stubOpenPicker(new File([json], 'tree.json', { type: 'application/json' }));
    render(<Workspace />);
    openOverflow();
    fireEvent.click(screen.getByRole('button', { name: 'Open file…' }));
    await waitFor(() => expect(s().doc.nodes[s().doc.rootId]?.label).toBe('Imported question'));
  });

  it('alerts when an opened file is not a valid tree', async () => {
    const alertMock = vi.fn();
    vi.stubGlobal('alert', alertMock);
    stubOpenPicker(new File(['not json'], 'bad.txt', { type: 'text/plain' }));
    render(<Workspace />);
    openOverflow();
    fireEvent.click(screen.getByRole('button', { name: 'Open file…' }));
    await waitFor(() => expect(alertMock).toHaveBeenCalled());
  });

  it('removes the selected node with the Delete key', () => {
    s().addChild(s().doc.rootId, 'Doomed');
    const id = Object.keys(s().doc.nodes).find((k) => k !== s().doc.rootId);
    if (!id) throw new Error('no child');
    s().select(id as NodeId);
    render(<Workspace />);
    expect(Object.keys(s().doc.nodes)).toHaveLength(2);
    fireEvent.keyDown(window, { key: 'Delete' });
    expect(Object.keys(s().doc.nodes)).toHaveLength(1);
  });

  it('undoes with Ctrl+Z and redoes with Shift+Ctrl+Z', () => {
    s().addChild(s().doc.rootId, 'child');
    render(<Workspace />);
    const n = () => Object.keys(s().doc.nodes).length;
    expect(n()).toBe(2);
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
    expect(n()).toBe(1);
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true, shiftKey: true });
    expect(n()).toBe(2);
  });

  it('invokes the file picker from the Open file menu item', async () => {
    const picker = vi.fn(async () => {
      throw Object.assign(new Error('cancel'), { name: 'AbortError' });
    });
    vi.stubGlobal('showOpenFilePicker', picker);
    vi.stubGlobal('showSaveFilePicker', vi.fn());
    render(<Workspace />);
    openOverflow();
    fireEvent.click(screen.getByRole('button', { name: 'Open file…' }));
    await waitFor(() => expect(picker).toHaveBeenCalledTimes(1));
  });

  it('toggles the MECE review dock from the health chip', () => {
    render(<Workspace />);
    expect(screen.getByText(/Select a node to edit it/)).toBeTruthy(); // inspector by default
    fireEvent.click(screen.getByRole('button', { name: /MECE clean/ }));
    expect(screen.getByRole('complementary', { name: 'MECE review' })).toBeTruthy();
    expect(screen.queryByText(/Select a node to edit it/)).toBeNull(); // inspector hidden
  });
});
