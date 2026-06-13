// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EXAMPLE_TREES } from '@/domain/examples';
import { childrenOf } from '@/domain/tree';
import type { NodeId } from '@/domain/types';
import { copyToClipboard } from '@/services/download';
import { useStore } from '@/store';
import { Inspector } from './Inspector';

vi.mock('@/services/download', () => ({
  copyToClipboard: vi.fn(),
  downloadText: vi.fn(),
  downloadDataUrl: vi.fn(),
}));

const FRESH = useStore.getState();
const s = () => useStore.getState();
beforeEach(() => {
  localStorage.clear();
  useStore.setState(FRESH, true);
  vi.clearAllMocks();
});
afterEach(cleanup);

function selectRoot(): NodeId {
  const rootId = s().doc.rootId;
  s().select(rootId);
  return rootId;
}

describe('Inspector', () => {
  it('prompts to select a node when nothing is selected', () => {
    s().select(null);
    render(<Inspector />);
    expect(screen.getByText(/Select a node to edit it/)).toBeTruthy();
  });

  it('shows the key-question editor for the root', () => {
    const rootId = selectRoot();
    render(<Inspector />);
    expect(screen.getByText('Key question')).toBeTruthy();
    expect(screen.getByDisplayValue(s().doc.nodes[rootId]?.label ?? '')).toBeTruthy();
  });

  it('writes status and value edits through to the store', () => {
    const rootId = selectRoot();
    render(<Inspector />);
    fireEvent.click(screen.getByRole('button', { name: 'supported' }));
    expect(s().doc.nodes[rootId]?.status).toBe('supported');
    fireEvent.blur(screen.getByPlaceholderText('e.g. 100'), { target: { value: '42' } });
    expect(s().doc.nodes[rootId]?.value?.amount).toBe(42);
  });

  it('sets and clears priority', () => {
    const rootId = selectRoot();
    render(<Inspector />);
    fireEvent.click(screen.getAllByRole('button', { name: 'high' })[0]); // impact → high
    expect(s().doc.nodes[rootId]?.priority?.impact).toBe('high');
    fireEvent.click(screen.getByRole('button', { name: 'Clear priority' }));
    expect(s().doc.nodes[rootId]?.priority).toBeUndefined();
  });

  it('adds and removes evidence', () => {
    const rootId = selectRoot();
    render(<Inspector />);
    fireEvent.change(screen.getByPlaceholderText('Add evidence…'), {
      target: { value: 'It works' },
    });
    fireEvent.click(screen.getByRole('button', { name: '+ Supports' }));
    expect(s().doc.nodes[rootId]?.evidence).toHaveLength(1);
    expect(s().doc.nodes[rootId]?.evidence[0]?.summary).toBe('It works');
    fireEvent.click(screen.getByRole('button', { name: '×' }));
    expect(s().doc.nodes[rootId]?.evidence).toHaveLength(0);
  });

  it('decomposes a leaf into a split', () => {
    selectRoot();
    render(<Inspector />);
    expect(screen.getByText('Decompose by')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Binary (A / not-A)' }));
    expect(screen.getByText('How it splits')).toBeTruthy(); // a split now exists
  });

  it('shows the formula controls for a value-driver split', () => {
    const profit = EXAMPLE_TREES.find((e) => e.id === 'profit');
    if (!profit) throw new Error('missing profit example');
    s().openDoc(profit.build());
    s().select(s().doc.rootId);
    render(<Inspector />);
    expect(screen.getByText('How it splits')).toBeTruthy();
    expect(screen.getByText('Combine children by')).toBeTruthy();
    expect(screen.getByText(/Sensitivity/)).toBeTruthy();
  });

  it('edits a non-root node and shows its structural actions', () => {
    s().addChild(s().doc.rootId, 'Child');
    const child = childrenOf(s().doc, s().doc.rootId)[0];
    if (!child) throw new Error('no child');
    s().select(child.id);
    render(<Inspector />);
    expect(screen.getByText('Issue')).toBeTruthy(); // non-root header
    fireEvent.blur(screen.getByLabelText('Issue'), { target: { value: 'Renamed' } });
    expect(s().doc.nodes[child.id]?.label).toBe('Renamed');
    fireEvent.blur(screen.getByLabelText('Notes'), { target: { value: 'a note' } });
    expect(s().doc.nodes[child.id]?.detail).toBe('a note');
    expect(screen.getByRole('button', { name: '↑ Move up' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Delete issue' })).toBeTruthy();
  });

  it('sets a unit after an amount', () => {
    const rootId = selectRoot();
    render(<Inspector />);
    fireEvent.blur(screen.getByPlaceholderText('e.g. 100'), { target: { value: '50' } });
    fireEvent.blur(screen.getByPlaceholderText('unit'), { target: { value: 'DKK' } });
    expect(s().doc.nodes[rootId]?.value).toEqual({ amount: 50, unit: 'DKK' });
  });

  it('copies an AI prompt to suggest a split for a leaf node', () => {
    selectRoot();
    render(<Inspector />);
    fireEvent.click(screen.getByText(/Copy an AI prompt to suggest a split/));
    expect(copyToClipboard).toHaveBeenCalledTimes(1);
  });

  it('deletes a non-root node from the inspector', () => {
    s().addChild(s().doc.rootId, 'Doomed');
    const child = childrenOf(s().doc, s().doc.rootId)[0];
    if (!child) throw new Error('no child');
    s().select(child.id);
    render(<Inspector />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete issue' }));
    expect(childrenOf(s().doc, s().doc.rootId)).toHaveLength(0);
  });
});
