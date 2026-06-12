import type { Rect, Viewport } from '@xyflow/react';

export interface Size {
  width: number;
  height: number;
}

/**
 * Bounding rect (flow coords) of nodes at `positions`, each `w`×`h` px. Computed
 * from the layout positions + the known node size — NOT React Flow's measured
 * sizes — so it's accurate for a just-added node that hasn't rendered yet.
 */
export function nodesBounds(positions: { x: number; y: number }[], w: number, h: number): Rect {
  if (positions.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of positions) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x + w > maxX) maxX = p.x + w;
    if (p.y + h > maxY) maxY = p.y + h;
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/**
 * Are `bounds` (flow coords) fully inside the viewport, with a px `margin`? Used
 * to decide whether a node-set change needs an auto-fit: if everything already
 * sits comfortably in view, the caller leaves the user's pan/zoom alone instead
 * of yanking the whole tree back to a full fit.
 *
 * Conservative by design — returns false when the container size is unknown, so
 * the caller re-fits rather than risk leaving a new node off-screen.
 */
export function boundsWithinViewport(
  bounds: Rect,
  viewport: Viewport,
  size: Size,
  margin = 8
): boolean {
  if (size.width <= 0 || size.height <= 0) return false;
  const { x, y, zoom } = viewport;
  const left = bounds.x * zoom + x;
  const top = bounds.y * zoom + y;
  const right = (bounds.x + bounds.width) * zoom + x;
  const bottom = (bounds.y + bounds.height) * zoom + y;
  return (
    left >= margin &&
    top >= margin &&
    right <= size.width - margin &&
    bottom <= size.height - margin
  );
}
