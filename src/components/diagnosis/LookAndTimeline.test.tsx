// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { childrenOf } from '@/domain/tree';
import { en } from '@/i18n/locales/en';
import { copyToClipboard } from '@/services/download';
import { useStore } from '@/store';
import { Timeline } from './Timeline';
import { WhereToLook } from './WhereToLook';

vi.mock('@/services/download', () => ({ copyToClipboard: vi.fn() }));

const FRESH = useStore.getState();
const s = () => useStore.getState();
beforeEach(() => {
  localStorage.clear();
  useStore.setState(FRESH, true);
  vi.mocked(copyToClipboard).mockClear();
});
afterEach(cleanup);

function twoHypotheses() {
  const root = s().doc.rootId;
  s().addChild(root, 'Database slow at peak');
  s().addChild(root, 'Network link full');
  const [db, line] = childrenOf(s().doc, root).map((c) => c.id);
  return { db: db ?? '', line: line ?? '' };
}

describe('WhereToLook', () => {
  it('lists open hypotheses and locates one on click', () => {
    const { line } = twoHypotheses();
    s().setPriority(line, { impact: 'high', ease: 'low' });
    const onClose = vi.fn();
    render(<WhereToLook onClose={onClose} />);
    const items = screen.getAllByRole('listitem');
    expect(items[0]?.textContent).toContain('Network link full');
    expect(items[0]?.textContent).toContain(en.brief.uncertainty.unknown);
    fireEvent.click(screen.getByRole('button', { name: /Network link full/ }));
    expect(onClose).toHaveBeenCalled();
    expect(s().selectedId).toBe(line);
  });

  it('says so when nothing is open', () => {
    render(<WhereToLook onClose={() => {}} />);
    expect(screen.getByText(en.brief.lookEmpty)).toBeTruthy();
  });
});

describe('Timeline', () => {
  it('shows status changes and copies the update', () => {
    const { db } = twoHypotheses();
    s().setStatus(db, 'refuted');
    render(<Timeline onClose={() => {}} />);
    expect(screen.getByText(en.brief.timelineStatus({ from: 'open', to: 'refuted' }))).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: en.brief.timelineCopy }));
    expect(vi.mocked(copyToClipboard).mock.calls[0]?.[0]).toContain(
      '**Database slow at peak** (now refuted)'
    );
  });

  it('asks for dated material when there is none', () => {
    render(<Timeline onClose={() => {}} />);
    expect(screen.getByText(en.brief.timelineEmpty)).toBeTruthy();
    expect(
      (screen.getByRole('button', { name: en.brief.timelineCopy }) as HTMLButtonElement).disabled
    ).toBe(true);
  });
});
