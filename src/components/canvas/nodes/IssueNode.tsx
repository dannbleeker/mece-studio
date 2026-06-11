import { Handle, type NodeProps, Position } from '@xyflow/react';
import { CHECK_STATE_COLOR } from '@/components/checkColors';
import type { IssueFlowNode } from '../projection';

const BAND: Record<'low' | 'medium' | 'high', { bg: string; fg: string }> = {
  high: { bg: '#3f6fb0', fg: '#ffffff' },
  medium: { bg: '#f3e6cb', fg: '#8a5a14' },
  low: { bg: '#ececea', fg: '#7a766c' },
};

export function IssueNode({ data }: NodeProps<IssueFlowNode>) {
  const { label, mece, hasChildren, value, priority, evidence, selected } = data;
  return (
    <div
      className="relative flex h-full w-full flex-col justify-center rounded-lg bg-white px-3 py-2 shadow-sm"
      style={{
        border: `${selected ? 2 : 1}px solid ${selected ? '#3f6fb0' : '#d7d4cb'}`,
      }}
    >
      <Handle type="target" position={Position.Left} className="!bg-neutral-400" />

      {priority && (
        <span
          className="absolute top-1 right-1 rounded px-1 py-px font-semibold text-[8px] uppercase tracking-wide"
          style={{ background: BAND[priority].bg, color: BAND[priority].fg }}
        >
          {priority}
        </span>
      )}

      <div className="line-clamp-2 font-medium text-[13px] text-neutral-800 leading-snug">
        {label || 'Untitled'}
      </div>

      {value && (
        <div className="mt-0.5 text-[11px] text-neutral-500">
          {value.amount}
          {value.unit ? ` ${value.unit}` : ''}
        </div>
      )}

      {evidence && (
        <div className="mt-0.5 flex gap-2 text-[10px]">
          {evidence.supports > 0 && <span style={{ color: '#3f7d54' }}>✓ {evidence.supports}</span>}
          {evidence.contradicts > 0 && (
            <span style={{ color: '#bd4a3a' }}>✗ {evidence.contradicts}</span>
          )}
        </div>
      )}

      {hasChildren && mece && (
        <div className="mt-1 flex items-center gap-3 text-[10px] text-neutral-500">
          <span className="flex items-center gap-1">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: CHECK_STATE_COLOR[mece.exclusive.state] }}
            />
            ME
          </span>
          <span className="flex items-center gap-1">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: CHECK_STATE_COLOR[mece.exhaustive.state] }}
            />
            CE
          </span>
        </div>
      )}

      <Handle type="source" position={Position.Right} className="!bg-neutral-400" />
    </div>
  );
}
