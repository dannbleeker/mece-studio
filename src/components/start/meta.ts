import type { DecompositionType } from '@/domain/types';

export interface DecompositionMeta {
  /** A short glyph used as the card icon. */
  icon: string;
  /** Accent colour (icon tint / chip) — drawn from the existing palette, no new colours. */
  accent: string;
  /** True for splits that are MECE by construction (binary, formula). */
  provable: boolean;
}

// Partial so a new DecompositionType added to the union still COMPILES (and falls
// back at runtime) — chrome should never be the thing that blocks a new split type.
const META: Partial<Record<DecompositionType, DecompositionMeta>> = {
  formula: { icon: '∑', accent: '#3f6fb0', provable: true },
  binary: { icon: '⊻', accent: '#3f6fb0', provable: true },
  segment: { icon: '◧', accent: '#3f7d54', provable: false },
  process: { icon: '→', accent: '#b07a2b', provable: false },
  framework: { icon: '▤', accent: '#7a6f9b', provable: false },
  freeform: { icon: '✎', accent: '#7a766c', provable: false },
};

const FALLBACK: DecompositionMeta = { icon: '◇', accent: '#7a766c', provable: false };

/** Chrome (icon + accent + provable flag) for a decomposition type; graceful fallback for an unknown one. */
export function decompositionMeta(type: DecompositionType): DecompositionMeta {
  return META[type] ?? FALLBACK;
}
