import { useMessages } from '@/i18n/useMessages';

const LINK = 'text-[#3f6fb0] underline underline-offset-2 hover:text-[#365f98]';

/** A short MECE primer with links into the full guide + book. */
export function LearnMece() {
  const m = useMessages();
  return (
    <div className="max-w-2xl space-y-4 text-[14px] text-neutral-700 leading-relaxed">
      <p>
        <strong>MECE</strong> {m.start.learnDefinition} <em>{m.start.learnSplitWord}</em>{' '}
        {m.start.learnSplitScope}
      </p>
      <div className="rounded-xl border border-[#e7e4dc] bg-white p-4">
        <p className="font-medium text-neutral-800">{m.start.learnHalvesTitle}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px]">
          <li>
            <strong>{m.start.learnExclusiveTerm}</strong> {m.start.learnExclusiveBody}
          </li>
          <li>
            <strong>{m.start.learnExhaustiveTerm}</strong> {m.start.learnExhaustiveBody}
          </li>
        </ul>
      </div>
      <p>{m.start.learnChecks}</p>
      <p className="text-[13px] text-neutral-500">
        {m.start.learnDeeper}{' '}
        <a className={LINK} href="/user-guide.html" target="_blank" rel="noopener noreferrer">
          {m.start.learnUserGuide}
        </a>{' '}
        {m.start.learnGuideAfter}{' '}
        <a
          className={LINK}
          href="/Issue-Trees-with-MECE-Studio.pdf"
          target="_blank"
          rel="noopener noreferrer"
        >
          {m.start.learnBookTitle}
        </a>{' '}
        {m.start.learnBookAfter}
      </p>
    </div>
  );
}
