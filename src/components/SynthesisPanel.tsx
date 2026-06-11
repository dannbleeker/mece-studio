import { synthesise } from '@/domain/synthesis';
import { copyToClipboard } from '@/services/download';
import { useStore } from '@/store';

const BTN = 'rounded-md px-2.5 py-1 text-[12px] text-neutral-600 hover:bg-neutral-100';

export function SynthesisPanel({ onClose }: { onClose: () => void }) {
  const doc = useStore((s) => s.doc);
  const text = synthesise(doc);

  return (
    <div className="absolute inset-y-0 right-0 z-20 flex w-96 max-w-full flex-col border-neutral-200 border-l bg-white shadow-lg">
      <div className="flex shrink-0 items-center justify-between border-neutral-200 border-b px-4 py-2.5">
        <span className="font-semibold text-[#3f6fb0] text-sm">Answer-first synthesis</span>
        <div className="flex gap-1">
          <button type="button" className={BTN} onClick={() => void copyToClipboard(text)}>
            Copy
          </button>
          <button type="button" className={BTN} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <pre className="flex-1 overflow-auto whitespace-pre-wrap p-4 text-[12px] text-neutral-800 leading-relaxed">
        {text}
      </pre>
    </div>
  );
}
