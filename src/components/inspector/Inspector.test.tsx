// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useStore } from '@/store';
import { Inspector } from './Inspector';

const FRESH = useStore.getState();
beforeEach(() => {
  localStorage.clear();
  useStore.setState(FRESH, true);
});
afterEach(cleanup);

describe('Inspector', () => {
  it('prompts to select a node when nothing is selected', () => {
    useStore.getState().select(null);
    render(<Inspector />);
    expect(screen.getByText(/Select a node to edit it/)).toBeTruthy();
  });

  it('shows the key-question editor for the root', () => {
    const rootId = useStore.getState().doc.rootId;
    useStore.getState().select(rootId);
    render(<Inspector />);
    expect(screen.getByText('Key question')).toBeTruthy();
    const label = useStore.getState().doc.nodes[rootId]?.label ?? '';
    expect(screen.getByDisplayValue(label)).toBeTruthy();
  });

  it('writes status and value edits through to the store', () => {
    const rootId = useStore.getState().doc.rootId;
    useStore.getState().select(rootId);
    render(<Inspector />);

    fireEvent.click(screen.getByRole('button', { name: 'supported' }));
    expect(useStore.getState().doc.nodes[rootId]?.status).toBe('supported');

    fireEvent.blur(screen.getByPlaceholderText('e.g. 100'), { target: { value: '42' } });
    expect(useStore.getState().doc.nodes[rootId]?.value?.amount).toBe(42);
  });
});
