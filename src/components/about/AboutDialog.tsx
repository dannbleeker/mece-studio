import { useEffect } from 'react';

interface AboutDialogProps {
  onClose: () => void;
}

const REPO = 'https://github.com/dannbleeker/mece-studio';

const LINKS: { href: string; label: string; hint: string }[] = [
  {
    href: '/user-guide.html',
    label: 'User Guide',
    hint: 'Reference for every feature and shortcut.',
  },
  {
    href: '/notices.html',
    label: 'Third-party notices & trademarks',
    hint: 'Attribution and licenses for dependencies.',
  },
  { href: REPO, label: 'Source on GitHub', hint: 'Code, issues, and releases.' },
];

const LICENSE_LINK = 'text-[#3f6fb0] underline';

export function AboutDialog({ onClose }: AboutDialogProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-neutral-900/30"
      />
      <div
        className="relative w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="About MECE Studio"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-[#3f6fb0] text-lg tracking-tight">MECE Studio</h2>
            <p className="mt-1 text-[13px] text-neutral-500 leading-relaxed">
              Build McKinsey-style issue trees with MECE checking built in. Free, local-first, runs
              in your browser.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-md px-2 py-1 text-neutral-400 text-sm hover:bg-neutral-100 hover:text-neutral-700"
          >
            ✕
          </button>
        </div>

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
          <a
            className={LICENSE_LINK}
            href="/notices.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            third-party notices
          </a>
          .
        </p>
      </div>
    </div>
  );
}
