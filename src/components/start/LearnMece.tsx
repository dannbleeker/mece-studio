const LINK = 'text-[#3f6fb0] underline underline-offset-2 hover:text-[#365f98]';

/** A short MECE primer with links into the full guide + book. */
export function LearnMece() {
  return (
    <div className="max-w-2xl space-y-4 text-[14px] text-neutral-700 leading-relaxed">
      <p>
        <strong>MECE</strong> — Mutually Exclusive, Collectively Exhaustive — is the test every good
        decomposition passes. It is a property of a <em>split</em> (a parent and its children), not
        of a single node.
      </p>
      <div className="rounded-xl border border-[#e7e4dc] bg-white p-4">
        <p className="font-medium text-neutral-800">The two halves</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px]">
          <li>
            <strong>Mutually exclusive (ME)</strong> — the branches don't overlap, so nothing is
            double-counted.
          </li>
          <li>
            <strong>Collectively exhaustive (CE)</strong> — together the branches cover the whole
            parent, so nothing is missed.
          </li>
        </ul>
      </div>
      <p>
        MECE Studio checks every split as you build: binary (A / not-A) and formula splits are
        provably MECE; segments need an explicit “Other” bucket to be exhaustive; other splits get a
        sibling-overlap heuristic. The dots on each node and the warnings in the inspector tell you
        where a split needs attention — and a tree's card shows the same status at a glance.
      </p>
      <p className="text-[13px] text-neutral-500">
        Go deeper: the{' '}
        <a className={LINK} href="/user-guide.html" target="_blank" rel="noopener noreferrer">
          User Guide
        </a>{' '}
        covers every feature, and the book{' '}
        <a
          className={LINK}
          href="/Issue-Trees-with-MECE-Studio.pdf"
          target="_blank"
          rel="noopener noreferrer"
        >
          Issue Trees with MECE Studio
        </a>{' '}
        teaches the method end to end.
      </p>
    </div>
  );
}
