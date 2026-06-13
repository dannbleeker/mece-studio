// @vitest-environment happy-dom
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useNodeEditing } from './nodeEditing';

describe('useNodeEditing', () => {
  it('returns a no-op editing context by default', () => {
    const { result } = renderHook(() => useNodeEditing());
    expect(result.current.editingId).toBeNull();
    expect(() => {
      result.current.start('x');
      result.current.commit('x', 'label');
      result.current.cancel();
    }).not.toThrow();
  });
});
