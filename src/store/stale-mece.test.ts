// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { reviewCount } from '@/domain/meceStatus';
import type { NodeId } from '@/domain/types';
import { useStore } from '@/store';

const s = () => useStore.getState();
const FRESH = useStore.getState();
beforeEach(() => {
  localStorage.clear();
  useStore.setState(FRESH, true);
});

describe('MECE status after a settings change + undo', () => {
  it('reflects the CURRENT tolerance, not the one in force when the snapshot was taken', () => {
    // A formula split that misses by ~0.8% — flagged at the 0.5% default.
    s().setRootQuestion('Profit');
    s().addChild(s().doc.rootId, 'Revenue');
    s().addChild(s().doc.rootId, 'Costs');
    const [a, b] = Object.keys(s().doc.nodes).filter((k) => k !== s().doc.rootId) as NodeId[];
    s().setDecomposition(s().doc.rootId, 'formula');
    s().setOperator(s().doc.rootId, 'sum');
    s().setAmount(s().doc.rootId, 100);
    s().setAmount(a as NodeId, 50);
    s().setAmount(b as NodeId, 50.8); // 100.8 vs 100 -> 0.8% off
    expect(reviewCount(s().doc)).toBe(1);

    // One more edit that does NOT touch the numbers, so undoing lands on a state
    // that still has every value set and is still 0.8% off.
    s().renameNode(a as NodeId, 'Revenue (net)');
    expect(reviewCount(s().doc)).toBe(1);

    // Raise the tolerance so the split is now within budget.
    s().setSettings({ formulaTolerance: 0.02 });
    expect(reviewCount(s().doc)).toBe(0);

    // Undo one edit. The restored doc must be judged by the CURRENT tolerance.
    s().undo();
    expect(reviewCount(s().doc)).toBe(0);
  });
});
