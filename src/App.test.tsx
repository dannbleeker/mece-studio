// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NodeId } from '@/domain/types';
import { copyToClipboard, downloadText } from '@/services/download';
import { useStore } from '@/store';
import { App } from './App';

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

describe('App', () => {
  it('renders the header, the canvas toolbar, and the empty inspector', () => {
    render(<App />);
    expect(screen.getByText('MECE Studio')).toBeTruthy();
    expect(screen.getByRole('button', { name: '+ New' })).toBeTruthy();
    expect(screen.getByLabelText('Find nodes')).toBeTruthy();
    expect(screen.getByText(/Select a node to edit it/)).toBeTruthy();
  });

  it('opens the About dialog from the header', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'About' }));
    expect(screen.getByRole('dialog', { name: 'About MECE Studio' })).toBeTruthy();
  });

  it('opens the keyboard-shortcuts overlay with the ? key', () => {
    render(<App />);
    fireEvent.keyDown(window, { key: '?' });
    expect(screen.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeTruthy();
  });

  it('loads an example from the header picker', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Load an example tree'), {
      target: { value: 'profit' },
    });
    expect(useStore.getState().library).toHaveLength(2);
  });

  it('copies the tree as Markdown (and flips the button to "Copied!")', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy Markdown' }));
    expect(copyToClipboard).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Copied!' })).toBeTruthy();
  });

  it('saves the tree as JSON', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Save JSON' }));
    expect(downloadText).toHaveBeenCalledWith(
      'mece-tree.json',
      expect.any(String),
      'application/json'
    );
  });

  it('toggles the synthesis panel', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Synthesis' }));
    expect(screen.getByText('Answer-first synthesis')).toBeTruthy();
  });

  it('undoes a tree edit from the toolbar and redoes it with the keyboard', () => {
    s().addChild(s().doc.rootId, 'child');
    render(<App />);
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
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(s().library).toHaveLength(1);
  });

  it('switches documents from the picker', () => {
    s().newDoc();
    const b = s().activeId;
    s().newDoc();
    render(<App />);
    fireEvent.change(screen.getByLabelText('Open tree'), { target: { value: b } });
    expect(s().activeId).toBe(b);
  });

  it('opens the Settings dialog from the header', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeTruthy();
  });

  it('opens a valid JSON tree from a file', async () => {
    s().setRootQuestion('Imported question');
    const json = JSON.stringify(s().doc);
    s().setRootQuestion('Diverged'); // so the import is what restores the label
    const { container } = render(<App />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [new File([json], 'tree.json', { type: 'application/json' })] },
    });
    await waitFor(() => expect(s().doc.nodes[s().doc.rootId]?.label).toBe('Imported question'));
  });

  it('alerts when an opened file is not a valid tree', async () => {
    const alertMock = vi.fn();
    vi.stubGlobal('alert', alertMock);
    const { container } = render(<App />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [new File(['not json'], 'bad.txt', { type: 'text/plain' })] },
    });
    await waitFor(() => expect(alertMock).toHaveBeenCalled());
  });

  it('removes the selected node with the Delete key', () => {
    s().addChild(s().doc.rootId, 'Doomed');
    const id = Object.keys(s().doc.nodes).find((k) => k !== s().doc.rootId);
    if (!id) throw new Error('no child');
    s().select(id as NodeId);
    render(<App />);
    expect(Object.keys(s().doc.nodes)).toHaveLength(2);
    fireEvent.keyDown(window, { key: 'Delete' });
    expect(Object.keys(s().doc.nodes)).toHaveLength(1);
  });

  it('undoes with Ctrl+Z and redoes with Shift+Ctrl+Z', () => {
    s().addChild(s().doc.rootId, 'child');
    render(<App />);
    const n = () => Object.keys(s().doc.nodes).length;
    expect(n()).toBe(2);
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
    expect(n()).toBe(1);
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true, shiftKey: true });
    expect(n()).toBe(2);
  });
});
