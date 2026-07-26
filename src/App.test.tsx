// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { childrenOf } from '@/domain/tree';
import type { NodeId } from '@/domain/types';
import { en } from '@/i18n/locales/en';
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
  fireEvent.click(screen.getByRole('button', { name: en.app.moreActions }));
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
    expect(s().view).toBe('start');
    expect(screen.queryByLabelText(en.canvas.findLabel)).toBeNull(); // the canvas is not mounted
    expect(screen.queryByRole('button', { name: en.app.backToStart })).toBeNull(); // nor its header
  });

  it('shows the workspace once a tree is open', async () => {
    s().setView('workspace');
    render(<App />);
    // Workspace is a lazy chunk now, so wait for it to resolve behind Suspense.
    expect(await screen.findByLabelText(en.canvas.findLabel)).toBeTruthy(); // canvas toolbar
    expect(screen.getByRole('button', { name: en.app.backToStart })).toBeTruthy();
  });

  it('returns to Start from the workspace Home button', async () => {
    s().setView('workspace');
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: en.app.backToStart }));
    expect(s().view).toBe('start');
  });
});

describe('Workspace', () => {
  it('renders the header, the canvas toolbar, and the empty inspector', () => {
    render(<Workspace />);
    expect(screen.getByRole('button', { name: 'MECE Studio' })).toBeTruthy(); // brand, never translated
    expect(screen.getByLabelText(en.canvas.findLabel)).toBeTruthy();
    expect(screen.getByText(en.inspector.emptyLead, { exact: false })).toBeTruthy();
  });

  it('opens the About dialog from the overflow menu', () => {
    render(<Workspace />);
    openOverflow();
    fireEvent.click(screen.getByRole('button', { name: en.app.about }));
    expect(screen.getByRole('dialog', { name: en.app.aboutTitle })).toBeTruthy();
  });

  it('opens the keyboard-shortcuts overlay with the ? key', () => {
    render(<Workspace />);
    fireEvent.keyDown(window, { key: '?' });
    expect(screen.getByRole('dialog', { name: en.app.shortcuts })).toBeTruthy();
  });

  it('copies the tree as Markdown from the overflow menu', () => {
    render(<Workspace />);
    openOverflow();
    fireEvent.click(screen.getByRole('button', { name: en.app.copyMarkdown }));
    expect(copyToClipboard).toHaveBeenCalledTimes(1);
  });

  it('saves the tree to a file from the overflow menu (download fallback)', async () => {
    // happy-dom has no File System Access API, so Save falls back to a download.
    render(<Workspace />);
    openOverflow();
    fireEvent.click(screen.getByRole('button', { name: en.app.save }));
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
    fireEvent.click(screen.getByRole('button', { name: en.app.exportMenu }));
    fireEvent.click(screen.getByRole('button', { name: en.app.exportJson }));
    expect(downloadText).toHaveBeenCalledWith(
      'mece-tree.json',
      expect.any(String),
      'application/json'
    );
  });

  it('toggles the synthesis panel', () => {
    render(<Workspace />);
    fireEvent.click(screen.getByRole('button', { name: en.app.synthesis }));
    // The synthesis leads with the tree's own question as its heading.
    expect(screen.getByText(en.content.starterQuestion, { selector: 'h3' })).toBeTruthy();
  });

  it('undoes a tree edit from the toolbar and redoes it with the keyboard', () => {
    s().addChild(s().doc.rootId, 'child');
    render(<Workspace />);
    const n = () => Object.keys(s().doc.nodes).length;
    expect(n()).toBe(2);
    fireEvent.click(screen.getByRole('button', { name: en.app.undo }));
    expect(n()).toBe(1);
    fireEvent.keyDown(window, { key: 'y', ctrlKey: true });
    expect(n()).toBe(2);
  });

  it('deletes the active tree after confirmation', () => {
    s().newDoc();
    render(<Workspace />);
    openOverflow();
    fireEvent.click(screen.getByRole('button', { name: en.app.deleteTree })); // overflow → confirm
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: en.app.deleteTree })
    );
    expect(s().library).toHaveLength(1);
  });

  it('opens the Settings dialog from the header', () => {
    render(<Workspace />);
    fireEvent.click(screen.getByRole('button', { name: en.app.settings }));
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('opens a valid JSON tree from a file (File System Access)', async () => {
    s().setRootQuestion('Imported question');
    const json = JSON.stringify(s().doc);
    s().setRootQuestion('Diverged'); // so the import is what restores the label
    stubOpenPicker(new File([json], 'tree.json', { type: 'application/json' }));
    render(<Workspace />);
    openOverflow();
    fireEvent.click(screen.getByRole('button', { name: en.app.openFile }));
    await waitFor(() => expect(s().doc.nodes[s().doc.rootId]?.label).toBe('Imported question'));
  });

  it('alerts when an opened file is not a valid tree', async () => {
    const alertMock = vi.fn();
    vi.stubGlobal('alert', alertMock);
    stubOpenPicker(new File(['not json'], 'bad.txt', { type: 'text/plain' }));
    render(<Workspace />);
    openOverflow();
    fireEvent.click(screen.getByRole('button', { name: en.app.openFile }));
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

  it('imports a Markdown outline as a new tree from the overflow menu', () => {
    const before = s().library.length;
    render(<Workspace />);
    openOverflow();
    fireEvent.click(screen.getByRole('button', { name: en.app.importOutline }));
    fireEvent.change(screen.getByLabelText(en.app.importFieldLabel), {
      target: { value: '# Imported outline\n- One\n- Two' },
    });
    fireEvent.click(screen.getByRole('button', { name: en.app.importSubmit }));
    expect(s().library.length).toBe(before + 1);
    expect(s().doc.nodes[s().doc.rootId]?.label).toBe('Imported outline');
  });

  it('shows an error for unparseable import text and keeps the dialog open', () => {
    render(<Workspace />);
    openOverflow();
    fireEvent.click(screen.getByRole('button', { name: en.app.importOutline }));
    fireEvent.change(screen.getByLabelText(en.app.importFieldLabel), {
      target: { value: '{bad json that is not a tree' },
    });
    fireEvent.click(screen.getByRole('button', { name: en.app.importSubmit }));
    expect(screen.getByText(en.app.importError)).toBeTruthy();
  });

  it('invokes the file picker from the Open file menu item', async () => {
    const picker = vi.fn(async () => {
      throw Object.assign(new Error('cancel'), { name: 'AbortError' });
    });
    vi.stubGlobal('showOpenFilePicker', picker);
    vi.stubGlobal('showSaveFilePicker', vi.fn());
    render(<Workspace />);
    openOverflow();
    fireEvent.click(screen.getByRole('button', { name: en.app.openFile }));
    await waitFor(() => expect(picker).toHaveBeenCalledTimes(1));
  });

  it('quick-adds several issues from the overflow menu', () => {
    render(<Workspace />);
    openOverflow();
    fireEvent.click(screen.getByRole('button', { name: en.app.quickAdd }));
    fireEvent.change(screen.getByLabelText(en.app.quickAddFieldLabel), {
      target: { value: 'Pricing\nDemand\nDistribution' },
    });
    fireEvent.click(screen.getByRole('button', { name: en.app.quickAddSubmit }));
    expect(childrenOf(s().doc, s().doc.rootId).map((n) => n.label)).toEqual([
      'Pricing',
      'Demand',
      'Distribution',
    ]);
  });

  it('shows a tab strip with multiple trees open and closes a tab', () => {
    s().newDoc(); // two trees open → strip appears
    render(<Workspace />);
    expect(screen.getByRole('navigation', { name: en.app.openTrees })).toBeTruthy();
    // Both trees open on the starter question, so both close buttons share a name.
    const closeButtons = screen.getAllByRole('button', {
      name: en.app.closeTab({ name: en.content.starterQuestion }),
    });
    fireEvent.click(closeButtons[0] as HTMLElement);
    expect(s().openTabs).toHaveLength(1);
    // strip hides with one tree
    expect(screen.queryByRole('navigation', { name: en.app.openTrees })).toBeNull();
  });

  it('toggles the MECE review dock from the health chip', () => {
    render(<Workspace />);
    expect(screen.getByText(en.inspector.emptyLead, { exact: false })).toBeTruthy(); // inspector
    fireEvent.click(screen.getByRole('button', { name: en.review.chipClean }));
    expect(screen.getByRole('complementary', { name: en.review.panelLabel })).toBeTruthy();
    expect(screen.queryByText(en.inspector.emptyLead, { exact: false })).toBeNull(); // hidden
  });
});
