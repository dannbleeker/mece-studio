// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDoc } from '@/domain/factory';
import { addChild, setPriority } from '@/domain/tree';
import { en } from '@/i18n/locales/en';
import { copyToClipboard } from '@/services/download';
import { useStore } from '@/store';
import { SynthesisPanel } from './SynthesisPanel';

vi.mock('@/services/download', () => ({
  copyToClipboard: vi.fn(),
  downloadText: vi.fn(),
  downloadDataUrl: vi.fn(),
}));

const FRESH = useStore.getState();
beforeEach(() => {
  localStorage.clear();
  useStore.setState(FRESH, true);
  vi.clearAllMocks();
});
afterEach(cleanup);

function seedWithBranch() {
  let doc = createDoc('Why are sales down?', 0);
  const a = addChild(doc, doc.rootId, 'Fewer customers');
  doc = a.doc;
  doc = setPriority(doc, a.childId, { impact: 'high', ease: 'high' });
  useStore.getState().openDoc(doc);
}

describe('SynthesisPanel', () => {
  it('renders the answer-first synthesis of the active tree', () => {
    seedWithBranch();
    const { container } = render(<SynthesisPanel onClose={vi.fn()} />);
    expect(screen.getByText(en.synthesis.title)).toBeTruthy();
    expect(container.textContent).toContain('Why are sales down?');
    // The panel renders formatted lines, so the Markdown emphasis is stripped.
    expect(container.textContent).toContain('Fewer customers');
    expect(container.textContent).not.toContain('**');
  });

  it('labels the storyline lines from the catalogue', () => {
    const doc = createDoc('Why are sales down?', 0);
    useStore.getState().openDoc({
      ...doc,
      problemBrief: { situation: 'Sales grew for six years.', complication: 'Q3 fell 12%.' },
    });
    render(<SynthesisPanel onClose={vi.fn()} />);
    expect(screen.getByText(en.synthesis.situationLead)).toBeTruthy();
    expect(screen.getByText(en.synthesis.complicationLead)).toBeTruthy();
  });

  it('copies the synthesis and an AI critique prompt, and closes', () => {
    seedWithBranch();
    const onClose = vi.fn();
    render(<SynthesisPanel onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: en.synthesis.copy }));
    expect(copyToClipboard).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: en.synthesis.critique }));
    expect(copyToClipboard).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByRole('button', { name: en.synthesis.close }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
