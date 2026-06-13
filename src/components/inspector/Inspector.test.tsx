// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EXAMPLE_TREES } from '@/domain/examples';
import type { NodeId } from '@/domain/types';
import { useStore } from '@/store';
import { Inspector } from './Inspector';

const FRESH = useStore.getState();
const s = () => useStore.getState();
beforeEach(() => {
  localStorage.clear();
  useStore.setState(FRESH, true);
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
});
