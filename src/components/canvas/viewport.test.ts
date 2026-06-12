import { describe, expect, it } from 'vitest';
import { boundsWithinViewport, nodesBounds } from './viewport';

describe('nodesBounds', () => {
  it('is empty for no nodes', () => {
    expect(nodesBounds([], 220, 64)).toEqual({ x: 0, y: 0, width: 0, height: 0 });
  });
  it('spans every node box (position + size)', () => {
    expect(
      nodesBounds(
        [
          { x: 0, y: 0 },
          { x: 300, y: 100 },
        ],
        220,
        64
      )
    ).toEqual({ x: 0, y: 0, width: 520, height: 164 });
  });
});

describe('boundsWithinViewport', () => {
  const size = { width: 1000, height: 800 };
  const origin = { x: 0, y: 0, zoom: 1 };

  it('true when comfortably inside', () => {
    expect(boundsWithinViewport({ x: 100, y: 100, width: 200, height: 200 }, origin, size)).toBe(
      true
    );
  });

  it('false past the right or bottom edge', () => {
    expect(boundsWithinViewport({ x: 100, y: 100, width: 1000, height: 100 }, origin, size)).toBe(
      false
    );
    expect(boundsWithinViewport({ x: 100, y: 100, width: 100, height: 1000 }, origin, size)).toBe(
      false
    );
  });

  it('false before the top or left edge under a negative pan', () => {
    expect(
      boundsWithinViewport({ x: 0, y: 0, width: 100, height: 100 }, { x: -50, y: 0, zoom: 1 }, size)
    ).toBe(false);
  });

  it('accounts for zoom', () => {
    // 200px box at 3× = 600px on screen → fits; at 6× = 1200px → does not.
    expect(
      boundsWithinViewport({ x: 0, y: 0, width: 200, height: 200 }, { x: 20, y: 20, zoom: 3 }, size)
    ).toBe(true);
    expect(
      boundsWithinViewport({ x: 0, y: 0, width: 200, height: 200 }, { x: 20, y: 20, zoom: 6 }, size)
    ).toBe(false);
  });

  it('is conservative when the container size is unknown', () => {
    expect(
      boundsWithinViewport({ x: 0, y: 0, width: 10, height: 10 }, origin, { width: 0, height: 0 })
    ).toBe(false);
  });

  it('requires a margin gutter (a flush node is not "within")', () => {
    expect(boundsWithinViewport({ x: 0, y: 100, width: 100, height: 100 }, origin, size)).toBe(
      false
    );
  });
});
