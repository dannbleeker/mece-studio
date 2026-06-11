import type { DecompositionType } from './types';

/**
 * Starter child labels seeded when you decompose a leaf by a given type — the
 * "scaffold". They're chosen so the fresh split is already MECE-clean where
 * possible (binary = two branches; segments include an "Other" bucket).
 */
export function scaffoldChildren(decomposition: DecompositionType): string[] {
  switch (decomposition) {
    case 'binary':
      return ['A', 'not-A'];
    case 'segment':
      return ['Segment 1', 'Segment 2', 'Other'];
    case 'process':
      return ['Stage 1', 'Stage 2', 'Stage 3'];
    case 'formula':
      return ['Term 1', 'Term 2'];
    case 'framework':
      return ['Component 1', 'Component 2'];
    default:
      return ['Sub-issue 1', 'Sub-issue 2'];
  }
}
