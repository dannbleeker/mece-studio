// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EXAMPLE_TREES } from '@/domain/examples';
import { rollUpValue } from '@/domain/rollup';
import { childrenOf, splitOf } from '@/domain/tree';
import type { NodeId } from '@/domain/types';
import { en } from '@/i18n/locales/en';
import { copyToClipboard } from '@/services/download';
import { useStore } from '@/store';
import { Inspector } from './Inspector';

vi.mock('@/services/download', () => ({
  copyToClipboard: vi.fn(),
  downloadText: vi.fn(),
  downloadDataUrl: vi.fn(),
}));

const FRESH = useStore.getState();
const s = () => useStore.getState();
beforeEach(() => {
  localStorage.clear();
  useStore.setState(FRESH, true);
  vi.clearAllMocks();
});
afterEach(cleanup);

function selectRoot(): NodeId {
  const rootId = s().doc.rootId;
  s().select(rootId);
  return rootId;
}

/**
 * Switch the tabbed inspector to a facet. Named by facet, worded by the
 * catalogue — a test that survives a rewording is a test of the wiring.
 */
function goTab(facet: keyof typeof en.inspector.tabs) {
  fireEvent.click(screen.getByRole('button', { name: en.inspector.tabs[facet] }));
}

describe('Inspector', () => {
  it('prompts to select a node when nothing is selected', () => {
    s().select(null);
    render(<Inspector />);
    const prompt = screen.getByText(en.inspector.emptyAction).closest('p');
    expect(prompt?.textContent).toBe(
      `${en.inspector.emptyLead} ${en.inspector.emptyAction} ${en.inspector.emptyTail}`
    );
  });

  it('shows the key-question editor for the root', () => {
    const rootId = selectRoot();
    render(<Inspector />);
    expect(screen.getByText(en.inspector.keyQuestionLabel)).toBeTruthy();
    expect(screen.getByDisplayValue(s().doc.nodes[rootId]?.label ?? '')).toBeTruthy();
  });

  it('writes status and value edits through to the store', () => {
    const rootId = selectRoot();
    render(<Inspector />);
    fireEvent.click(screen.getByRole('button', { name: en.enums.status.supported })); // Issue tab
    expect(s().doc.nodes[rootId]?.status).toBe('supported');
    goTab('value');
    fireEvent.blur(screen.getByPlaceholderText(en.inspector.amountPlaceholder), {
      target: { value: '42' },
    });
    expect(s().doc.nodes[rootId]?.value?.amount).toBe(42);
  });

  it('sets and clears priority via the impact × ease matrix', () => {
    const rootId = selectRoot();
    render(<Inspector />);
    fireEvent.click(
      screen.getByRole('button', {
        name: en.inspector.priorityCellLabel({
          impact: en.enums.level.high,
          ease: en.enums.level.medium,
        }),
      })
    );
    expect(s().doc.nodes[rootId]?.priority).toEqual({ impact: 'high', ease: 'medium' });
    fireEvent.click(screen.getByRole('button', { name: en.inspector.clearPriority }));
    expect(s().doc.nodes[rootId]?.priority).toBeUndefined();
  });

  it('adds and removes evidence', () => {
    const rootId = selectRoot();
    render(<Inspector />);
    goTab('evidence');
    fireEvent.change(screen.getByPlaceholderText(en.inspector.evidencePlaceholder), {
      target: { value: 'It works' },
    });
    fireEvent.click(screen.getByRole('button', { name: en.inspector.addSupports }));
    expect(s().doc.nodes[rootId]?.evidence).toHaveLength(1);
    expect(s().doc.nodes[rootId]?.evidence[0]?.summary).toBe('It works');
    fireEvent.click(screen.getByRole('button', { name: en.inspector.removeEvidenceLabel }));
    expect(s().doc.nodes[rootId]?.evidence).toHaveLength(0);
  });

  it('picks draft strength up front and flips an evidence item stance', () => {
    const rootId = selectRoot();
    render(<Inspector />);
    goTab('evidence');
    fireEvent.click(screen.getByRole('button', { name: en.enums.evidenceStrength.strong })); // draft strength
    fireEvent.change(screen.getByPlaceholderText(en.inspector.evidencePlaceholder), {
      target: { value: 'Data' },
    });
    fireEvent.click(screen.getByRole('button', { name: en.inspector.addContradicts }));
    const ev = s().doc.nodes[rootId]?.evidence[0];
    expect(ev?.strength).toBe('strong');
    expect(ev?.supports).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: en.inspector.stanceLabel.contradicts }));
    expect(s().doc.nodes[rootId]?.evidence[0]?.supports).toBe(true);
  });

  it('decomposes a leaf into a split', () => {
    selectRoot();
    render(<Inspector />);
    goTab('logic');
    expect(screen.getByText(en.inspector.decomposeHeading)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: en.enums.decomposition.binary }));
    expect(screen.getByText(en.inspector.decompositionLabel)).toBeTruthy(); // a split now exists
  });

  it('shows the formula controls for a value-driver split', () => {
    const profit = EXAMPLE_TREES.find((e) => e.id === 'profit');
    if (!profit) throw new Error('missing profit example');
    s().openDoc(profit.build(en));
    s().select(s().doc.rootId);
    render(<Inspector />);
    goTab('logic');
    expect(screen.getByText(en.inspector.decompositionLabel)).toBeTruthy();
    expect(screen.getByText(en.inspector.operatorLabel)).toBeTruthy();
    expect(screen.getByText(en.inspector.sensitivityLabel)).toBeTruthy();
  });

  it('edits a non-root node and shows its structural actions', () => {
    s().addChild(s().doc.rootId, 'Child');
    const child = childrenOf(s().doc, s().doc.rootId)[0];
    if (!child) throw new Error('no child');
    s().select(child.id);
    render(<Inspector />);
    fireEvent.blur(screen.getByLabelText(en.inspector.issueLabel), {
      target: { value: 'Renamed' },
    }); // non-root Issue field
    expect(s().doc.nodes[child.id]?.label).toBe('Renamed');
    fireEvent.blur(screen.getByLabelText(en.inspector.notesLabel), { target: { value: 'a note' } });
    expect(s().doc.nodes[child.id]?.detail).toBe('a note');
    expect(screen.getByRole('button', { name: en.inspector.moveUp })).toBeTruthy();
    expect(screen.getByRole('button', { name: en.inspector.deleteIssue })).toBeTruthy();
  });

  it('sets a unit after an amount', () => {
    const rootId = selectRoot();
    render(<Inspector />);
    goTab('value');
    fireEvent.blur(screen.getByPlaceholderText(en.inspector.amountPlaceholder), {
      target: { value: '50' },
    });
    fireEvent.blur(screen.getByPlaceholderText(en.inspector.unitPlaceholder), {
      target: { value: 'DKK' },
    });
    expect(s().doc.nodes[rootId]?.value).toEqual({ amount: 50, unit: 'DKK' });
  });

  it('copies an AI prompt to suggest a split for a leaf node', () => {
    selectRoot();
    render(<Inspector />);
    goTab('logic');
    fireEvent.click(screen.getByText(en.inspector.aiPromptAction));
    expect(copyToClipboard).toHaveBeenCalledTimes(1);
  });

  it('deletes a non-root node from the inspector', () => {
    s().addChild(s().doc.rootId, 'Doomed');
    const child = childrenOf(s().doc, s().doc.rootId)[0];
    if (!child) throw new Error('no child');
    s().select(child.id);
    render(<Inspector />);
    fireEvent.click(screen.getByRole('button', { name: en.inspector.deleteIssue }));
    expect(childrenOf(s().doc, s().doc.rootId)).toHaveLength(0);
  });

  it('adds a sub-issue from the inspector', () => {
    const rootId = selectRoot();
    render(<Inspector />);
    const before = childrenOf(s().doc, rootId).length;
    fireEvent.click(screen.getByRole('button', { name: en.inspector.addSubIssue }));
    expect(childrenOf(s().doc, rootId).length).toBe(before + 1);
  });

  it('changes the formula operator and rolls children up to the parent', () => {
    const profit = EXAMPLE_TREES.find((e) => e.id === 'profit');
    if (!profit) throw new Error('missing profit example');
    s().openDoc(profit.build(en));
    const rootId = s().doc.rootId;
    s().select(rootId);
    render(<Inspector />);
    goTab('logic');
    const productOption = screen.getByRole('option', { name: en.enums.formulaOperator.product });
    const operatorSelect = productOption.closest('select');
    if (!operatorSelect) throw new Error('no operator select');
    fireEvent.change(operatorSelect, { target: { value: 'product' } });
    expect(splitOf(s().doc, rootId)?.operator).toBe('product');
    const rollup = rollUpValue(s().doc, rootId);
    if (rollup === undefined) throw new Error('nothing to roll up');
    fireEvent.click(
      screen.getByRole('button', { name: en.inspector.rollUpAction({ value: rollup }) })
    );
    expect(typeof s().doc.nodes[rootId]?.value?.amount).toBe('number');
  });

  it('moves a sibling down and duplicates a subtree from the inspector', () => {
    s().addChild(s().doc.rootId, 'A');
    s().addChild(s().doc.rootId, 'B');
    const a = childrenOf(s().doc, s().doc.rootId)[0];
    if (!a) throw new Error('no A');
    s().select(a.id);
    render(<Inspector />);
    fireEvent.click(screen.getByRole('button', { name: en.inspector.moveDown }));
    expect(childrenOf(s().doc, s().doc.rootId).map((c) => c.label)).toEqual(['B', 'A']);
    fireEvent.click(screen.getByRole('button', { name: en.inspector.duplicateSubtree }));
    expect(childrenOf(s().doc, s().doc.rootId)).toHaveLength(3);
  });

  it('toggles split logic and writes a so-what line through the store', () => {
    s().addChild(s().doc.rootId, 'A');
    s().addChild(s().doc.rootId, 'B');
    const rootId = selectRoot();
    render(<Inspector />);
    goTab('logic');
    fireEvent.click(screen.getByRole('button', { name: en.enums.splitLogic.deductive }));
    expect(splitOf(s().doc, rootId)?.logic).toBe('deductive');
    fireEvent.blur(screen.getByPlaceholderText(en.inspector.summaryPlaceholder), {
      target: { value: 'Profit squeezed both sides' },
    });
    expect(splitOf(s().doc, rootId)?.summary).toBe('Profit squeezed both sides');
  });

  it('sets a split ordering principle through the store', () => {
    s().addChild(s().doc.rootId, 'A');
    s().addChild(s().doc.rootId, 'B');
    const rootId = selectRoot();
    render(<Inspector />);
    goTab('logic');
    fireEvent.click(
      screen.getByRole('button', {
        name: en.inspector.orderOptionLabel({ order: en.enums.splitOrder.time }),
      })
    );
    expect(splitOf(s().doc, rootId)?.order).toBe('time');
  });

  it('surfaces a coaching advisory for a bare-topic branch', () => {
    s().addChild(s().doc.rootId, 'Revenue');
    s().addChild(s().doc.rootId, 'How can we cut costs?');
    const child = childrenOf(s().doc, s().doc.rootId)[0]; // "Revenue"
    if (!child) throw new Error('no child');
    s().select(child.id);
    render(<Inspector />);
    expect(screen.getByText(en.inspector.coachingHeading)).toBeTruthy();
    expect(
      screen.getByText(en.advisories['advisory.wholeSentence']({ label: 'Revenue' }))
    ).toBeTruthy();
  });
});
