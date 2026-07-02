import { Handle, type NodeProps, Position } from '@xyflow/react';
import { useEffect, useRef } from 'react';
import { CHECK_STATE_COLOR, CHECK_STATE_GLYPH, CHECK_STATE_LABEL } from '@/components/checkColors';
import { childrenOf } from '@/domain/tree';
import type { CheckResult, NodeId, NodeStatus } from '@/domain/types';
import { useStore } from '@/store';
import { useNodeEditing } from '../nodeEditing';
import type { IssueFlowNode } from '../projection';

const BAND: Record<'low' | 'medium' | 'high', { bg: string; fg: string }> = {
  high: { bg: '#3f6fb0', fg: '#ffffff' },
  medium: { bg: '#f3e6cb', fg: '#8a5a14' },
  low: { bg: '#ececea', fg: '#7a766c' },
};

const STATUS_BORDER: Record<NodeStatus, string> = {
  open: 'transparent',
  supported: '#3f7d54',
  refuted: '#bd4a3a',
  parked: '#9a958a',
};

/** A status glyph so the colour-coded left border is legible without colour. */
const STATUS_GLYPH: Record<NodeStatus, string> = {
  open: '',
  supported: '✓',
  refuted: '✗',
  parked: '⊘',
};

/**
 * One MECE axis (ME / CE) shown as a state-carrying glyph + short label. The
 * glyph shape (✓ / ! / –) makes state readable in greyscale and to colour-blind
 * users; the title/aria-label carries it to screen readers.
 */
function MeceDot({ label, short, result }: { label: string; short: string; result: CheckResult }) {
  const caption = `${label}: ${CHECK_STATE_LABEL[result.state]}`;
  return (
    <span className="flex items-center gap-1" role="img" title={caption} aria-label={caption}>
      <span
        aria-hidden="true"
        className="font-bold text-[11px] leading-none"
        style={{ color: CHECK_STATE_COLOR[result.state] }}
      >
        {CHECK_STATE_GLYPH[result.state]}
      </span>
      {short}
    </span>
  );
}

export function IssueNode({ id, data }: NodeProps<IssueFlowNode>) {
  const {
    label,
    mece,
    dimension,
    hasChildren,
    value,
    priority,
    evidence,
    hasNote,
    collapsed,
    childCount,
    matched,
    status,
    selected,
  } = data;
  const { editingId, start, commit, cancel } = useNodeEditing();
  const toggleCollapse = useStore((s) => s.toggleCollapse);
  const addChild = useStore((s) => s.addChild);
  const select = useStore((s) => s.select);
  const isEditing = id === editingId;
  // Add a child and drop straight into inline editing — the same gesture as the
  // keyboard Tab outliner (Canvas `addAndEdit`), reachable now from the node itself.
  const addChildAndEdit = () => {
    addChild(id as NodeId);
    const kids = childrenOf(useStore.getState().doc, id as NodeId);
    const newId = kids[kids.length - 1]?.id;
    if (newId) {
      select(newId);
      start(newId);
    }
  };
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!isEditing) return;
    // Defer past React Flow's focus-on-click so the textarea keeps focus.
    const handle = requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => cancelAnimationFrame(handle);
  }, [isEditing]);
  // All-longhand border props: mixing the `border` shorthand with a `borderLeft`
  // override makes React warn (and risks style bugs) on every rerender.
  const edgeColor = selected ? '#3f6fb0' : '#d7d4cb';
  const edgeWidth = selected ? 2 : 1;
  const showStatus = status !== 'open';
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: canvas node; keyboard editing is via Enter/F2 (handled in Canvas)
    <div
      className={`group relative flex h-full w-full flex-col justify-center rounded-lg bg-white px-3 py-2 shadow-sm${matched ? ' ring-2 ring-[#d99a2b] ring-offset-1' : ''}`}
      onDoubleClick={() => start(id)}
      style={{
        borderStyle: 'solid',
        borderTopColor: edgeColor,
        borderRightColor: edgeColor,
        borderBottomColor: edgeColor,
        borderLeftColor: showStatus ? STATUS_BORDER[status] : edgeColor,
        borderTopWidth: edgeWidth,
        borderRightWidth: edgeWidth,
        borderBottomWidth: edgeWidth,
        borderLeftWidth: showStatus ? 4 : edgeWidth,
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

      {showStatus && (
        <span
          className="absolute top-1 left-1 font-bold text-[10px] leading-none"
          style={{ color: STATUS_BORDER[status] }}
          role="img"
          title={`Status: ${status}`}
          aria-label={`Status: ${status}`}
        >
          {STATUS_GLYPH[status]}
        </span>
      )}

      {isEditing ? (
        <textarea
          ref={inputRef}
          aria-label="Edit node label"
          defaultValue={label}
          rows={2}
          className="nodrag nopan w-full resize-none rounded border border-[#3f6fb0] bg-white px-1 py-0.5 font-medium text-[13px] text-neutral-800 leading-snug focus:outline-none"
          onBlur={(e) => commit(id, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              commit(id, e.currentTarget.value);
            } else if (e.key === 'Escape') {
              e.preventDefault();
              cancel();
            }
            e.stopPropagation();
          }}
          onPointerDown={(e) => e.stopPropagation()}
        />
      ) : (
        <div className="line-clamp-2 font-medium text-[13px] text-neutral-800 leading-snug">
          {label || 'Untitled'}
        </div>
      )}

      {value && (
        <div className="mt-0.5 text-[11px] text-neutral-500">
          {value.amount}
          {value.unit ? ` ${value.unit}` : ''}
        </div>
      )}

      {(evidence || hasNote) && (
        <div className="mt-0.5 flex items-center gap-2 text-[10px]">
          {evidence && evidence.supports > 0 && (
            <span style={{ color: '#3f7d54' }}>✓ {evidence.supports}</span>
          )}
          {evidence && evidence.contradicts > 0 && (
            <span style={{ color: '#bd4a3a' }}>✗ {evidence.contradicts}</span>
          )}
          {hasNote && (
            <span className="text-neutral-400" role="img" title="Has notes" aria-label="Has notes">
              <svg
                width="10"
                height="10"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M3.5 4h9M3.5 8h9M3.5 12h6" />
              </svg>
            </span>
          )}
        </div>
      )}

      {hasChildren && dimension && (
        <div
          className="mt-0.5 truncate text-[9px] text-neutral-400 italic"
          title={`Split by ${dimension}`}
        >
          by {dimension}
        </div>
      )}

      {hasChildren && mece && (
        <div className="mt-1 flex items-center gap-3 text-[10px] text-neutral-500">
          <MeceDot label="Mutually exclusive" short="ME" result={mece.exclusive} />
          <MeceDot label="Collectively exhaustive" short="CE" result={mece.exhaustive} />
        </div>
      )}

      {hasChildren && (
        <button
          type="button"
          title={collapsed ? `Expand ${childCount} hidden` : 'Collapse subtree'}
          aria-label={collapsed ? 'Expand subtree' : 'Collapse subtree'}
          className="nodrag absolute -bottom-2.5 left-1/2 -translate-x-1/2 rounded-full border border-neutral-300 bg-white px-1.5 py-px font-medium text-[9px] text-neutral-500 leading-none shadow-sm hover:border-[#3f6fb0] hover:text-[#3f6fb0]"
          onClick={(e) => {
            e.stopPropagation();
            toggleCollapse(id as NodeId);
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {collapsed ? `▶ ${childCount}` : '▼'}
        </button>
      )}

      <button
        type="button"
        title="Add a sub-issue"
        aria-label="Add sub-issue"
        className={`nodrag absolute top-1/2 -right-2.5 z-10 -translate-y-1/2 rounded-full border border-neutral-300 bg-white px-1.5 py-px font-medium text-[11px] leading-none shadow-sm transition-opacity hover:border-[#3f6fb0] hover:text-[#3f6fb0] focus-visible:opacity-100 ${selected ? 'text-[#3f6fb0] opacity-100' : 'text-neutral-500 opacity-0 group-hover:opacity-100'}`}
        onClick={(e) => {
          e.stopPropagation();
          addChildAndEdit();
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        ＋
      </button>

      <Handle type="source" position={Position.Right} className="!bg-neutral-400" />
    </div>
  );
}
