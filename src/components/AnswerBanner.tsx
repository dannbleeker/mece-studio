import { useState } from 'react';
import { ProblemBriefDialog } from '@/components/brief/ProblemBriefDialog';
import { useStore } from '@/store';

/**
 * A slim editable banner above the canvas for the tree's **governing answer** —
 * the day-1 hypothesis the whole tree argues for. Answer-first problem solving
 * starts here; the answer flows into the synthesis (with a rolled-up verdict) and
 * the exports. A "Problem brief" button opens the doc-level framing card.
 */
export function AnswerBanner() {
  const doc = useStore((s) => s.doc);
  const setAnswer = useStore((s) => s.setAnswer);
  const [showBrief, setShowBrief] = useState(false);
  const hasBrief = doc.problemBrief !== undefined;

  return (
    <div className="flex shrink-0 items-center gap-2 border-neutral-200 border-b bg-[#f6f9fd] px-4 py-1.5">
      <span className="shrink-0 font-medium text-[10px] text-[#3f6fb0] uppercase tracking-wider">
        Answer
      </span>
      <input
        key={doc.id}
        defaultValue={doc.answer ?? ''}
        placeholder="State your day-1 answer — the tree argues for it (optional)"
        aria-label="Governing answer"
        onBlur={(e) => setAnswer(e.target.value)}
        className="min-w-0 flex-1 bg-transparent text-[13px] text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
      />
      <button
        type="button"
        onClick={() => setShowBrief(true)}
        title="Frame the problem — situation, complication, scope"
        className="shrink-0 rounded-md px-2 py-0.5 font-medium text-[11px] text-[#3f6fb0] hover:bg-[#e7eff8]"
      >
        {hasBrief ? '✎ Problem brief' : '+ Problem brief'}
      </button>
      {showBrief && <ProblemBriefDialog onClose={() => setShowBrief(false)} />}
    </div>
  );
}
