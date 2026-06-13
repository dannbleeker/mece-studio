// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ReactFlow, ReactFlowProvider } from '@xyflow/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useStore } from '@/store';
import { type NodeEditing, NodeEditingContext } from '../nodeEditing';
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

function renderNode(data: Partial<IssueFlowNode['data']>, editing?: NodeEditing) {
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
  const flow = (
    <ReactFlowProvider>
      <ReactFlow nodes={[node]} edges={[]} nodeTypes={{ issue: IssueNode }} />
    </ReactFlowProvider>
  );
  return render(
    editing ? (
      <NodeEditingContext.Provider value={editing}>{flow}</NodeEditingContext.Provider>
    ) : (
      flow
    )
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
    expect(screen.getByText('▼')).toBeTruthy();
  });

  it('shows the expand affordance with a hidden count when collapsed', () => {
    renderNode({ label: 'Costs', hasChildren: true, collapsed: true, childCount: 3 });
    expect(screen.getByText('▶ 3')).toBeTruthy();
  });

  it("falls back to 'Untitled' for an empty label", () => {
    renderNode({ label: '' });
    expect(screen.getByText('Untitled')).toBeTruthy();
  });

  it('renders status, matched, and selected styling without crashing', () => {
    renderNode({
      label: 'Refuted',
      status: 'refuted',
      matched: true,
      selected: true,
      hasNote: true,
    });
    expect(screen.getByText('Refuted')).toBeTruthy();
    expect(screen.getByLabelText('Has notes')).toBeTruthy();
  });

  it('edits inline: commits on Enter and blur, cancels on Escape', () => {
    const commit = vi.fn();
    const cancel = vi.fn();
    renderNode({ label: 'Old' }, { editingId: 'n1', start: vi.fn(), commit, cancel });
    const ta = screen.getByLabelText('Edit node label');
    fireEvent.change(ta, { target: { value: 'New' } });
    fireEvent.keyDown(ta, { key: 'Enter' });
    expect(commit).toHaveBeenCalledWith('n1', 'New');
    fireEvent.keyDown(ta, { key: 'Escape' });
    expect(cancel).toHaveBeenCalled();
    fireEvent.blur(ta);
    expect(commit).toHaveBeenCalledTimes(2);
  });
});
