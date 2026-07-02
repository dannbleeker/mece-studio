import { useMemo } from 'react';
import { toFlow } from '@/components/canvas/projection';
import { NODE_HEIGHT, NODE_WIDTH } from '@/domain/constants';
import type { IssueTreeDoc, NodeStatus } from '@/domain/types';

// Mirrors the status left-edge colours in canvas/nodes/IssueNode.tsx.
const STATUS_STRIPE: Record<NodeStatus, string | null> = {
  open: null,
  supported: '#3f7d54',
  refuted: '#bd4a3a',
  parked: '#9a958a',
};

/**
 * A schematic thumbnail of a tree — boxes + edges, laid out by the SAME projection
 * the canvas uses (`toFlow` → dagre), so there's no second layout path. Labels are
 * omitted: at thumbnail scale the shape reads, the text wouldn't.
 */
export function TreePreview({ doc }: { doc: IssueTreeDoc }) {
  const { nodes, edges } = useMemo(() => toFlow(doc), [doc]);

  const box = useMemo(() => {
    if (nodes.length === 0) return null;
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    for (const n of nodes) {
      minX = Math.min(minX, n.position.x);
      minY = Math.min(minY, n.position.y);
      maxX = Math.max(maxX, n.position.x + NODE_WIDTH);
      maxY = Math.max(maxY, n.position.y + NODE_HEIGHT);
    }
    const pad = 28;
    return { x: minX - pad, y: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 };
  }, [nodes]);

  if (!box) return null;
  const byId = new Map(nodes.map((n) => [n.id, n]));

  return (
    <svg
      viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      {edges.map((e) => {
        const s = byId.get(e.source);
        const t = byId.get(e.target);
        if (!s || !t) return null;
        const x1 = s.position.x + NODE_WIDTH;
        const y1 = s.position.y + NODE_HEIGHT / 2;
        const x2 = t.position.x;
        const y2 = t.position.y + NODE_HEIGHT / 2;
        const mx = (x1 + x2) / 2;
        return (
          <path
            key={e.id}
            d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`}
            fill="none"
            stroke="#cfcbc0"
            strokeWidth={2.5}
          />
        );
      })}
      {nodes.map((n) => {
        const stripe = STATUS_STRIPE[n.data.status];
        return (
          <g key={n.id}>
            <rect
              x={n.position.x}
              y={n.position.y}
              width={NODE_WIDTH}
              height={NODE_HEIGHT}
              rx={12}
              fill="#ffffff"
              stroke="#d7d4cb"
              strokeWidth={1.5}
            />
            {stripe && (
              <rect
                x={n.position.x}
                y={n.position.y}
                width={10}
                height={NODE_HEIGHT}
                rx={5}
                fill={stripe}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
