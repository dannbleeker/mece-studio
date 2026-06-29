// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { NodeId } from '@/domain/types';
import { useStore } from '@/store';
import { PresentationView } from './PresentationView';

const FRESH = useStore.getState();
const s = () => useStore.getState();

beforeEach(() => {
  localStorage.clear();
  useStore.setState(FRESH, true);
});
afterEach(cleanup);

/** The node id of the (first) node with a given label. */
function idByLabel(label: string): NodeId {
  const id = Object.keys(s().doc.nodes).find((k) => s().doc.nodes[k as NodeId]?.label === label);
  if (!id) throw new Error(`no node labelled ${label}`);
  return id as NodeId;
}

describe('PresentationView', () => {
  beforeEach(() => {
    s().setRootQuestion('Why are sales down?');
    s().addChild(s().doc.rootId, 'Pricing');
    s().addChild(s().doc.rootId, 'Demand');
    s().addChild(idByLabel('Pricing'), 'Too high'); // gives Pricing its own split
  });

  it('opens on the root decomposition and steps to the next branch', () => {
    render(<PresentationView onClose={() => {}} />);
    expect(screen.getByRole('heading', { name: 'Why are sales down?' })).toBeTruthy();
    expect(screen.getByText('Pricing')).toBeTruthy();
    expect(screen.getByText('1 / 2')).toBeTruthy(); // root + Pricing are the two steps

    fireEvent.click(screen.getByRole('button', { name: 'Next →' }));
    expect(screen.getByRole('heading', { name: 'Pricing' })).toBeTruthy();
    expect(screen.getByText('Too high')).toBeTruthy();
    expect(screen.getByText('2 / 2')).toBeTruthy();
  });

  it('navigates with the arrow keys and exits on Escape', () => {
    let closed = false;
    render(<PresentationView onClose={() => (closed = true)} />);
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByRole('heading', { name: 'Pricing' })).toBeTruthy();
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByRole('heading', { name: 'Why are sales down?' })).toBeTruthy();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(closed).toBe(true);
  });
});
