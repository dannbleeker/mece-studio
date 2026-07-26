// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { en } from '@/i18n/locales/en';
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
    const f = en.brief.fields;
    render(<ProblemBriefDialog onClose={() => {}} />);
    fireEvent.blur(screen.getByLabelText(f.situation.label), { target: { value: 'Stable co' } });
    fireEvent.blur(screen.getByLabelText(f.complication.label), {
      target: { value: 'Margin fell' },
    });
    fireEvent.blur(screen.getByLabelText(f.outOfScope.label), {
      target: { value: 'No divestiture' },
    });
    expect(s().doc.problemBrief).toEqual({
      situation: 'Stable co',
      complication: 'Margin fell',
      outOfScope: 'No divestiture',
    });
  });

  it('surfaces a key-question advisory when the root is not a question', () => {
    s().setRootQuestion('Improve profitability');
    render(<ProblemBriefDialog onClose={() => {}} />);
    // Substring: the nudge renders behind a 💡 in the same line.
    const nudge = en.advisories['advisory.keyQuestion.notQuestion'];
    expect(screen.getByText(nudge, { exact: false })).toBeTruthy();
  });

  it('sets the tree mode through the store', () => {
    render(<ProblemBriefDialog onClose={() => {}} />);
    const name = en.brief.treeTypeName({ mode: en.enums.treeMode.how });
    fireEvent.click(screen.getByRole('button', { name }));
    expect(s().doc.mode).toBe('how');
  });
});
