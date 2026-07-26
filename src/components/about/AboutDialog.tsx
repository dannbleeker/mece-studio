import { Dialog } from '@/components/Dialog';
import { showToast } from '@/components/toast/toastStore';
import { useMessages } from '@/i18n/useMessages';
import { checkForUpdate } from '@/pwa/pwaUpdate';

const REPO = 'https://github.com/dannbleeker/mece-studio';

const LICENSE_LINK = 'text-[#3f6fb0] underline';

export function AboutDialog({ onClose }: { onClose: () => void }) {
  const m = useMessages();

  // The hrefs are not language; only the label and the hint are, so they pair up
  // here rather than living as one order-coupled list in the catalogue.
  const links = [
    { href: '/user-guide.html', ...m.app.aboutLinks.guide },
    { href: '/Issue-Trees-with-MECE-Studio.pdf', ...m.app.aboutLinks.bookPdf },
    { href: '/Issue-Trees-with-MECE-Studio.epub', ...m.app.aboutLinks.bookEpub },
    { href: '/notices.html', ...m.app.aboutLinks.notices },
    { href: REPO, ...m.app.aboutLinks.source },
  ];

  const onCheckForUpdate = async () => {
    const result = await checkForUpdate(m);
    if (result === 'up-to-date') showToast('success', m.app.updateUpToDate);
    else if (result === 'newly-found') showToast('info', m.app.updateFound);
    else if (result === 'unsupported') showToast('info', m.app.updateUnsupported);
    // 'already-pending' — checkForUpdate already re-surfaced the "Refresh now" prompt.
  };

  return (
    <Dialog
      label={m.app.aboutTitle}
      heading="MECE Studio"
      subtitle={m.app.aboutSubtitle}
      onClose={onClose}
    >
      <div className="mt-5 space-y-0.5">
        {links.map((l) => (
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

      <button
        type="button"
        onClick={() => void onCheckForUpdate()}
        className="mt-4 rounded-md border border-neutral-200 px-3 py-1.5 text-[13px] text-neutral-600 hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3f6fb0]/40"
      >
        {m.app.checkForUpdates}
      </button>

      <p className="mt-5 border-neutral-200 border-t pt-4 text-[11px] text-neutral-500 leading-relaxed">
        {m.app.licenseIntro}{' '}
        <a
          className={LICENSE_LINK}
          href={`${REPO}/blob/main/LICENSE`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {m.app.licenseSoftware}
        </a>
        {m.app.licenseBookIntro}{' '}
        <a
          className={LICENSE_LINK}
          href={`${REPO}/blob/main/LICENSE-BOOK`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {m.app.licenseBook}
        </a>
        {m.app.licenseTrademarks}{' '}
        <a className={LICENSE_LINK} href="/notices.html" target="_blank" rel="noopener noreferrer">
          {m.app.licenseNotices}
        </a>
        .
      </p>
    </Dialog>
  );
}
