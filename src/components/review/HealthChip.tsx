import { meceSummary } from '@/domain/meceStatus';
import { useEditorMessages } from '@/i18n/useEditorMessages';
import { useStore } from '@/store';

/**
 * Tree-level MECE health, surfaced in the editor header — emerald "MECE clean"
 * when nothing is flagged, amber "N to review" otherwise. Toggles the review dock.
 */
export function HealthChip() {
  const m = useEditorMessages();
  const doc = useStore((s) => s.doc);
  const reviewOpen = useStore((s) => s.reviewOpen);
  const setReviewOpen = useStore((s) => s.setReviewOpen);
  const { kind, warns } = meceSummary(doc);
  const review = kind === 'review';
  const tone = review ? 'bg-[#f8efdd] text-[#bd842c]' : 'bg-[#edf5ef] text-[#3f7d54]';
  const ring = reviewOpen ? (review ? 'ring-2 ring-[#bd842c]' : 'ring-2 ring-[#3f7d54]') : '';
  return (
    <button
      type="button"
      onClick={() => setReviewOpen(!reviewOpen)}
      aria-pressed={reviewOpen}
      title={m.review.chipTitle}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium text-[12px] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3f6fb0]/40 ${tone} ${ring}`}
    >
      <span aria-hidden="true">{review ? '⚠' : '✓'}</span>
      {review ? m.review.chipReview({ count: warns }) : m.review.chipClean}
      <span aria-hidden="true" className="opacity-60">
        ▾
      </span>
    </button>
  );
}
