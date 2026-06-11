import { childrenOf, splitOf } from './tree';
import type { FormulaOperator, IssueTreeDoc, NodeId } from './types';

/** Combine child values into a parent value per the formula operator. */
export function combineValues(values: number[], operator: FormulaOperator | undefined): number {
  switch (operator) {
    case 'product':
      return values.reduce((a, b) => a * b, 1);
    case 'difference':
      return values.slice(1).reduce((a, b) => a - b, values[0] ?? 0);
    default:
      return values.reduce((a, b) => a + b, 0);
  }
}

/**
 * The value a node would have from its formula-split children, if it has a
 * formula split and every child is valued. Otherwise undefined. Pure.
 */
export function rollUpValue(doc: IssueTreeDoc, nodeId: NodeId): number | undefined {
  const split = splitOf(doc, nodeId);
  if (split?.decomposition !== 'formula') return undefined;
  const values = childrenOf(doc, nodeId).map((c) => c.value?.amount);
  if (values.length === 0 || values.some((v) => v === undefined)) return undefined;
  return combineValues(values as number[], split.operator);
}
