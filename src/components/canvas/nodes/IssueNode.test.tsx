// @vitest-environment happy-dom

import { cleanup, render, screen } from '@testing-library/react';
import { ReactFlow, ReactFlowProvider } from '@xyflow/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useStore } from '@/store';
import type { IssueFlowNode } from '../projection';
import { IssueNode } from './IssueNode';

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const FRESH = useStore.getState();
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  useStore.setState(FRESH, true);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderNode(data: Partial<IssueFlowNode['data']>) {
  const node: IssueFlowNode = {
    id: 'n1',
    type: 'issue',
    position: { x: 0, y: 0 },
    data: {
      label: 'Node',
      status: 'open',
      mece: null,
      hasChildren: false,
      value: undefined,
      priority: null,
      evidence: null,
      hasNote: false,
      collapsed: false,
      childCount: 0,
      matched: false,
      selected: false,
      ...data,
    },
  };
  return render(
    <ReactFlowProvider>
      <ReactFlow nodes={[node]} edges={[]} nodeTypes={{ issue: IssueNode }} />
    </ReactFlowProvider>
  );
}

describe('IssueNode', () => {
  it('renders label, value, priority, evidence counts, and MECE dots', () => {
    renderNode({
      label: 'Revenue',
      value: { amount: 100, unit: 'M DKK' },
      priority: 'high',
      evidence: { supports: 2, contradicts: 1 },
      hasChildren: true,
      mece: { exclusive: { state: 'pass' }, exhaustive: { state: 'warn' } },
    });
    expect(screen.getByText('Revenue')).toBeTruthy();
    expect(screen.getByText(/100 M DKK/)).toBeTruthy();
    expect(screen.getByText('high')).toBeTruthy();
    expect(screen.getByText('✓ 2')).toBeTruthy();
    expect(screen.getByText('✗ 1')).toBeTruthy();
    expect(screen.getByText('ME')).toBeTruthy();
    expect(screen.getByText('CE')).toBeTruthy();
    expect(screen.getByText('▼')).toBeTruthy(); // collapse toggle
  });

  it('shows the expand affordance with a hidden count when collapsed', () => {
    renderNode({ label: 'Costs', hasChildren: true, collapsed: true, childCount: 3 });
    expect(screen.getByText('▶ 3')).toBeTruthy();
  });

  it("falls back to 'Untitled' for an empty label", () => {
    renderNode({ label: '' });
    expect(screen.getByText('Untitled')).toBeTruthy();
  });
});
