// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DECOMPOSITION_TYPES } from '@/domain/constants';
import { EXAMPLE_TREES } from '@/domain/examples';
import { FRAMEWORK_TEMPLATES } from '@/domain/frameworks';
import { en } from '@/i18n/locales/en';
import { ExampleTreesGroup, FrameworksGroup, FrameworkTemplatesGroup } from './Patterns';

afterEach(cleanup);

describe('FrameworksGroup', () => {
  it('renders exactly one tile per DECOMPOSITION_TYPES entry (registry-driven)', () => {
    render(<FrameworksGroup onPick={vi.fn()} />);
    // Drive off the registry: adding a type to it adds a tile, no edits here.
    expect(screen.getAllByRole('button')).toHaveLength(DECOMPOSITION_TYPES.length);
    // ...and off the catalogue: rewording a type's label must not break this.
    expect(screen.getByText(en.enums.decomposition.binary)).toBeTruthy();
    expect(screen.getByText(en.enums.decomposition.segment)).toBeTruthy();
  });

  it('tags only the provable types', () => {
    render(<FrameworksGroup onPick={vi.fn()} />);
    expect(screen.getAllByText(en.start.provablyMece)).toHaveLength(2); // binary + formula
  });

  it('calls onPick with the chosen decomposition type', () => {
    const onPick = vi.fn();
    render(<FrameworksGroup onPick={onPick} />);
    fireEvent.click(screen.getByText(en.enums.decomposition.binary));
    expect(onPick).toHaveBeenCalledWith('binary');
  });
});

describe('FrameworkTemplatesGroup', () => {
  it('renders exactly one card per FRAMEWORK_TEMPLATES entry (registry-driven)', () => {
    render(<FrameworkTemplatesGroup onPick={vi.fn()} />);
    expect(screen.getAllByRole('button')).toHaveLength(FRAMEWORK_TEMPLATES.length);
    for (const t of FRAMEWORK_TEMPLATES)
      expect(screen.getByText(en.content.frameworks[t.id].name)).toBeTruthy();
  });

  it('calls onPick with the chosen framework template', () => {
    const onPick = vi.fn();
    render(<FrameworkTemplatesGroup onPick={onPick} />);
    const first = FRAMEWORK_TEMPLATES[0];
    if (!first) throw new Error('no framework templates');
    fireEvent.click(screen.getByText(en.content.frameworks[first.id].name));
    expect(onPick).toHaveBeenCalledWith(first);
  });
});

describe('ExampleTreesGroup', () => {
  it('renders exactly one card per EXAMPLE_TREES entry (registry-driven)', () => {
    render(<ExampleTreesGroup onPick={vi.fn()} />);
    expect(screen.getAllByRole('button')).toHaveLength(EXAMPLE_TREES.length);
    for (const ex of EXAMPLE_TREES)
      expect(screen.getByText(en.content.examples[ex.id].name)).toBeTruthy();
  });

  it('calls onPick with the chosen example', () => {
    const onPick = vi.fn();
    render(<ExampleTreesGroup onPick={onPick} />);
    const first = EXAMPLE_TREES[0];
    if (!first) throw new Error('no examples');
    fireEvent.click(screen.getByText(en.content.examples[first.id].name));
    expect(onPick).toHaveBeenCalledWith(first);
  });
});
