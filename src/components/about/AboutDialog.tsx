import { Dialog } from '@/components/Dialog';

const REPO = 'https://github.com/dannbleeker/mece-studio';

const LINKS: { href: string; label: string; hint: string }[] = [
  {
    href: '/user-guide.html',
    label: 'User Guide',
    hint: 'Reference for every feature and shortcut.',
  },
  {
    href: '/Issue-Trees-with-MECE-Studio.pdf',
    label: 'Read the book (PDF)',
    hint: 'Issue Trees with MECE Studio — the practitioner’s guide.',
  },
  {
    href: '/Issue-Trees-with-MECE-Studio.epub',
    label: 'Read the book (EPUB)',
    hint: 'Same book, for Kindle and e-readers.',
  },
  {
    href: '/notices.html',
    label: 'Third-party notices & trademarks',
    hint: 'Attribution and licenses for dependencies.',
  },
  { href: REPO, label: 'Source on GitHub', hint: 'Code, issues, and releases.' },
];

const LICENSE_LINK = 'text-[#3f6fb0] underline';

export function AboutDialog({ onClose }: { onClose: () => void }) {
  return (
    <Dialog
      label="About MECE Studio"
      heading="MECE Studio"
      subtitle="Build McKinsey-style issue trees with MECE checking built in. Free, local-first, runs in your browser."
      onClose={onClose}
    >
      <div className="mt-5 space-y-0.5">
        {LINKS.map((l) => (
          <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-md px-2 py-2 hover:bg-neutral-100"
          >
            <div className="font-medium text-[13px] text-neutral-800">{l.label} ↗</div>
            <div className="text-[12px] text-neutral-500">{l.hint}</div>
          </a>
        ))}
      </div>

      <p className="mt-5 border-neutral-200 border-t pt-4 text-[11px] text-neutral-500 leading-relaxed">
        © 2026 Dann Bleeker Pedersen. Software under{' '}
        <a
          className={LICENSE_LINK}
          href={`${REPO}/blob/main/LICENSE`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Apache-2.0
        </a>
        ; the book under{' '}
        <a
          className={LICENSE_LINK}
          href={`${REPO}/blob/main/LICENSE-BOOK`}
          target="_blank"
          rel="noopener noreferrer"
        >
          CC BY-NC 4.0
        </a>
        . “McKinsey” and “MECE” are referenced descriptively — see the{' '}
        <a className={LICENSE_LINK} href="/notices.html" target="_blank" rel="noopener noreferrer">
          third-party notices
        </a>
        .
      </p>
    </Dialog>
  );
}
