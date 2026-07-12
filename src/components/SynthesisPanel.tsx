import { critiquePrompt } from '@/domain/aiPrompts';
import { synthesise } from '@/domain/synthesis';
import { formatSynthesis, type SynthLine } from '@/domain/synthesisFormat';
import { copyToClipboard } from '@/services/download';
import { useStore } from '@/store';

const BTN = 'rounded-md px-2.5 py-1 text-[12px] text-neutral-600 hover:bg-neutral-100';

/** One formatted line of the synthesis — the answer, verdict, and ranked branches. */
function Line({ line }: { line: SynthLine }) {
  const indent = { marginLeft: `${line.depth * 12}px` };
  switch (line.kind) {
    case 'title':
      return <h3 className="font-semibold text-[15px] text-neutral-900">{line.text}</h3>;
    case 'answer':
      return (
        <p className="mt-1 border-[#3f6fb0] border-l-2 pl-2 font-semibold text-[14px] text-neutral-900">
          {line.text}
        </p>
      );
    case 'situation':
      return (
        <p className="text-[12px] text-neutral-600">
          <span className="font-semibold text-neutral-800">Situation.</span> {line.text}
        </p>
      );
    case 'complication':
      return (
        <p className="text-[12px] text-neutral-600">
          <span className="font-semibold text-neutral-800">Complication.</span> {line.text}
        </p>
      );
    case 'insight':
      return (
        <div className="text-[12px] text-[#3f6fb0] italic" style={indent}>
          → {line.text}
        </div>
      );
    case 'verdict':
      return <p className="text-[12px] text-[#8a5a14] italic">{line.text}</p>;
    case 'lead':
      return <p className="text-[13px] text-neutral-500">{line.text}</p>;
    case 'branch':
      return (
        <div className="py-0.5 text-[13px] text-neutral-700" style={indent}>
          {line.text}
        </div>
      );
    case 'meta':
      return (
        <div
          className="text-[11px] text-neutral-400"
          style={{ marginLeft: `${line.depth * 12 + 12}px` }}
        >
          {line.text}
        </div>
      );
    default:
      return <div className="h-2" />;
  }
}

export function SynthesisPanel({ onClose }: { onClose: () => void }) {
  const doc = useStore((s) => s.doc);
  const md = synthesise(doc);
  const lines = formatSynthesis(md);

  return (
    <div className="absolute inset-y-0 right-0 z-20 flex w-96 max-w-full flex-col border-neutral-200 border-l bg-white shadow-lg">
      <div className="flex shrink-0 items-center justify-between border-neutral-200 border-b px-4 py-2.5">
        <span className="font-semibold text-[#3f6fb0] text-sm">Answer-first synthesis</span>
        <div className="flex gap-1">
          <button type="button" className={BTN} onClick={() => void copyToClipboard(md)}>
            Copy
          </button>
          <button
            type="button"
            className={BTN}
            title="Copy a prompt to critique this tree in Claude or ChatGPT"
            onClick={() => void copyToClipboard(critiquePrompt(doc))}
          >
            AI critique
          </button>
          <button type="button" className={BTN} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <div className="flex-1 space-y-0.5 overflow-auto p-4">
        {lines.map((line, i) => (
          // Synthesis lines are static and never reorder, so the index is a stable key.
          // biome-ignore lint/suspicious/noArrayIndexKey: static, non-reorderable lines
          <Line key={i} line={line} />
        ))}
      </div>
    </div>
  );
}
