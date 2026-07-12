// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EXAMPLE_TREES } from '@/domain/examples';
import { childrenOf, splitOf } from '@/domain/tree';
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

/** Switch the tabbed inspector to a facet (Issue · Logic · Evidence · Value). */
function goTab(name: 'Issue' | 'Logic' | 'Evidence' | 'Value') {
  fireEvent.click(screen.getByRole('button', { name }));
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
    fireEvent.click(screen.getByRole('button', { name: 'supported' })); // Issue tab
    expect(s().doc.nodes[rootId]?.status).toBe('supported');
    goTab('Value');
    fireEvent.blur(screen.getByPlaceholderText('e.g. 100'), { target: { value: '42' } });
    expect(s().doc.nodes[rootId]?.value?.amount).toBe(42);
  });

  it('sets and clears priority via the impact × ease matrix', () => {
    const rootId = selectRoot();
    render(<Inspector />);
    fireEvent.click(screen.getByRole('button', { name: 'Impact high, ease medium' }));
    expect(s().doc.nodes[rootId]?.priority).toEqual({ impact: 'high', ease: 'medium' });
    fireEvent.click(screen.getByRole('button', { name: 'Clear priority' }));
    expect(s().doc.nodes[rootId]?.priority).toBeUndefined();
  });

  it('adds and removes evidence', () => {
    const rootId = selectRoot();
    render(<Inspector />);
    goTab('Evidence');
    fireEvent.change(screen.getByPlaceholderText('Add evidence…'), {
      target: { value: 'It works' },
    });
    fireEvent.click(screen.getByRole('button', { name: '+ Supports' }));
    expect(s().doc.nodes[rootId]?.evidence).toHaveLength(1);
    expect(s().doc.nodes[rootId]?.evidence[0]?.summary).toBe('It works');
    fireEvent.click(screen.getByRole('button', { name: 'Remove evidence' }));
    expect(s().doc.nodes[rootId]?.evidence).toHaveLength(0);
  });

  it('picks draft strength up front and flips an evidence item stance', () => {
    const rootId = selectRoot();
    render(<Inspector />);
    goTab('Evidence');
    fireEvent.click(screen.getByRole('button', { name: 'strong' })); // draft strength selector
    fireEvent.change(screen.getByPlaceholderText('Add evidence…'), { target: { value: 'Data' } });
    fireEvent.click(screen.getByRole('button', { name: '+ Contradicts' }));
    const ev = s().doc.nodes[rootId]?.evidence[0];
    expect(ev?.strength).toBe('strong');
    expect(ev?.supports).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: /flip stance/ }));
    expect(s().doc.nodes[rootId]?.evidence[0]?.supports).toBe(true);
  });

  it('decomposes a leaf into a split', () => {
    selectRoot();
    render(<Inspector />);
    goTab('Logic');
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
    goTab('Logic');
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
    fireEvent.blur(screen.getByLabelText('Issue'), { target: { value: 'Renamed' } }); // non-root Issue field
    expect(s().doc.nodes[child.id]?.label).toBe('Renamed');
    fireEvent.blur(screen.getByLabelText('Notes'), { target: { value: 'a note' } });
    expect(s().doc.nodes[child.id]?.detail).toBe('a note');
    expect(screen.getByRole('button', { name: '↑ Move up' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Delete issue' })).toBeTruthy();
  });

  it('sets a unit after an amount', () => {
    const rootId = selectRoot();
    render(<Inspector />);
    goTab('Value');
    fireEvent.blur(screen.getByPlaceholderText('e.g. 100'), { target: { value: '50' } });
    fireEvent.blur(screen.getByPlaceholderText('unit'), { target: { value: 'DKK' } });
    expect(s().doc.nodes[rootId]?.value).toEqual({ amount: 50, unit: 'DKK' });
  });

  it('copies an AI prompt to suggest a split for a leaf node', () => {
    selectRoot();
    render(<Inspector />);
    goTab('Logic');
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

  it('adds a sub-issue from the inspector', () => {
    const rootId = selectRoot();
    render(<Inspector />);
    const before = childrenOf(s().doc, rootId).length;
    fireEvent.click(screen.getByRole('button', { name: '+ Add sub-issue' }));
    expect(childrenOf(s().doc, rootId).length).toBe(before + 1);
  });

  it('changes the formula operator and rolls children up to the parent', () => {
    const profit = EXAMPLE_TREES.find((e) => e.id === 'profit');
    if (!profit) throw new Error('missing profit example');
    s().openDoc(profit.build());
    const rootId = s().doc.rootId;
    s().select(rootId);
    render(<Inspector />);
    goTab('Logic');
    const productOption = screen.getByRole('option', { name: 'Product (A × B × C)' });
    const operatorSelect = productOption.closest('select');
    if (!operatorSelect) throw new Error('no operator select');
    fireEvent.change(operatorSelect, { target: { value: 'product' } });
    expect(splitOf(s().doc, rootId)?.operator).toBe('product');
    fireEvent.click(screen.getByRole('button', { name: /Roll up children/ }));
    expect(typeof s().doc.nodes[rootId]?.value?.amount).toBe('number');
  });

  it('moves a sibling down and duplicates a subtree from the inspector', () => {
    s().addChild(s().doc.rootId, 'A');
    s().addChild(s().doc.rootId, 'B');
    const a = childrenOf(s().doc, s().doc.rootId)[0];
    if (!a) throw new Error('no A');
    s().select(a.id);
    render(<Inspector />);
    fireEvent.click(screen.getByRole('button', { name: '↓ Move down' }));
    expect(childrenOf(s().doc, s().doc.rootId).map((c) => c.label)).toEqual(['B', 'A']);
    fireEvent.click(screen.getByRole('button', { name: 'Duplicate subtree' }));
    expect(childrenOf(s().doc, s().doc.rootId)).toHaveLength(3);
  });

  it('toggles split logic and writes a so-what line through the store', () => {
    s().addChild(s().doc.rootId, 'A');
    s().addChild(s().doc.rootId, 'B');
    const rootId = selectRoot();
    render(<Inspector />);
    goTab('Logic');
    fireEvent.click(screen.getByRole('button', { name: 'deductive' }));
    expect(splitOf(s().doc, rootId)?.logic).toBe('deductive');
    fireEvent.blur(screen.getByPlaceholderText(/the one takeaway/), {
      target: { value: 'Profit squeezed both sides' },
    });
    expect(splitOf(s().doc, rootId)?.summary).toBe('Profit squeezed both sides');
  });

  it('surfaces a coaching advisory for a bare-topic branch', () => {
    s().addChild(s().doc.rootId, 'Revenue');
    s().addChild(s().doc.rootId, 'How can we cut costs?');
    const child = childrenOf(s().doc, s().doc.rootId)[0]; // "Revenue"
    if (!child) throw new Error('no child');
    s().select(child.id);
    render(<Inspector />);
    expect(screen.getByText('Coaching')).toBeTruthy();
    expect(screen.getByText(/is a topic, not an idea/)).toBeTruthy();
  });
});
