// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { childrenOf } from '@/domain/tree';
import type { NodeId } from '@/domain/types';
import { en } from '@/i18n/locales/en';
import { useStore } from '@/store';
import { MustExplainGrid } from './MustExplainGrid';

const FRESH = useStore.getState();
const s = () => useStore.getState();
beforeEach(() => {
  localStorage.clear();
  useStore.setState(FRESH, true);
});
afterEach(cleanup);

function setup() {
  const root = s().doc.rootId;
  s().addChild(root, 'Database slow at peak');
  const hyp = childrenOf(s().doc, root)[0]?.id ?? '';
  s().addFact('when', 'Mondays from 09:00');
  s().addFact('where', 'Region A only');
  const [f1, f2] = (s().doc.facts ?? []).map((f) => f.id);
  return { hyp, f1: f1 ?? '', f2: f2 ?? '' };
}

const cell = (fact: string, verdict: string) =>
  screen.getByRole('button', {
    name: en.brief.gridCellLabel({ hypothesis: 'Database slow at peak', fact, verdict }),
  });

describe('MustExplainGrid', () => {
  it('asks for facts first when there are none', () => {
    render(<MustExplainGrid onClose={() => {}} />);
    expect(screen.getByText(en.brief.gridNoFacts)).toBeTruthy();
  });

  it('cycles a cell: not judged → explains → partly → does not → not judged', () => {
    const { hyp, f1 } = setup();
    render(<MustExplainGrid onClose={() => {}} />);
    const verdict = () => s().doc.nodes[hyp as NodeId]?.explains?.[f1];
    fireEvent.click(cell('Mondays from 09:00', en.brief.verdictClear));
    expect(verdict()).toBe('yes');
    fireEvent.click(cell('Mondays from 09:00', en.brief.verdict.yes));
    expect(verdict()).toBe('partly');
    fireEvent.click(cell('Mondays from 09:00', en.brief.verdict.partly));
    expect(verdict()).toBe('no');
    fireEvent.click(cell('Mondays from 09:00', en.brief.verdict.no));
    expect(verdict()).toBeUndefined();
  });

  it('reads each row back: open, fails, or explains every fact', () => {
    const { hyp, f1, f2 } = setup();
    const { rerender } = render(<MustExplainGrid onClose={() => {}} />);
    expect(screen.getByText(en.brief.gridOpen({ judged: 0, total: 2 }))).toBeTruthy();
    s().setExplains(hyp as NodeId, f1, 'no');
    rerender(<MustExplainGrid onClose={() => {}} />);
    expect(screen.getByText(en.brief.gridFails({ count: 1 }))).toBeTruthy();
    s().setExplains(hyp as NodeId, f1, 'yes');
    s().setExplains(hyp as NodeId, f2, 'yes');
    rerender(<MustExplainGrid onClose={() => {}} />);
    expect(screen.getByText(en.brief.gridExplainsAll)).toBeTruthy();
  });

  it('jumps to a hypothesis on the canvas from its row', () => {
    const { hyp } = setup();
    let closed = false;
    render(
      <MustExplainGrid
        onClose={() => {
          closed = true;
        }}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Database slow at peak' }));
    expect(s().selectedId).toBe(hyp);
    expect(closed).toBe(true);
  });
});
