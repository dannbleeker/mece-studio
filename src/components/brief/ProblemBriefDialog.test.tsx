// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useStore } from '@/store';
import { ProblemBriefDialog } from './ProblemBriefDialog';

const FRESH = useStore.getState();
const s = () => useStore.getState();
beforeEach(() => {
  localStorage.clear();
  useStore.setState(FRESH, true);
});
afterEach(cleanup);

describe('ProblemBriefDialog', () => {
  it('writes brief fields through to the store on blur', () => {
    render(<ProblemBriefDialog onClose={() => {}} />);
    fireEvent.blur(screen.getByLabelText('Situation'), { target: { value: 'Stable co' } });
    fireEvent.blur(screen.getByLabelText('Complication'), { target: { value: 'Margin fell' } });
    fireEvent.blur(screen.getByLabelText('Out of scope'), { target: { value: 'No divestiture' } });
    expect(s().doc.problemBrief).toEqual({
      situation: 'Stable co',
      complication: 'Margin fell',
      outOfScope: 'No divestiture',
    });
  });

  it('surfaces a key-question advisory when the root is not a question', () => {
    s().setRootQuestion('Improve profitability');
    render(<ProblemBriefDialog onClose={() => {}} />);
    expect(screen.getByText(/Frame the key question as a question/)).toBeTruthy();
  });
});
