import { Dialog } from '@/components/Dialog';
import { showToast } from '@/components/toast/toastStore';
import { type OfflineDiagnostics, useOfflineDiagnostics } from '@/hooks/useOfflineDiagnostics';
import type { EditorMessages } from '@/i18n/types';
import { useEditorMessages } from '@/i18n/useEditorMessages';
import { checkForUpdate } from '@/pwa/pwaUpdate';

const REPO = 'https://github.com/dannbleeker/mece-studio';

const LICENSE_LINK = 'text-[#3f6fb0] underline';

/**
 * The offline-readiness readings, worded.
 *
 * Plain functions over (diagnostics, messages) so each mapping is one obvious
 * line and the dialog below stays a render. `null` and a negative reading map
 * to different sentences on purpose: "we could not ask" is a different
 * diagnosis from "no", and conflating them is what made the original
 * "No internet access" report unactionable.
 */
function serviceWorkerWord(d: OfflineDiagnostics, m: EditorMessages): string {
  const word: Record<OfflineDiagnostics['readiness']['worker'], string> = {
    active: m.diagnostics.swActive,
    pending: m.diagnostics.swPending,
    none: m.diagnostics.swNone,
    unsupported: m.diagnostics.swUnsupported,
  };
  return word[d.readiness.worker];
}

function offlineReadyWord(d: OfflineDiagnostics, m: EditorMessages): string {
  const { precacheEntries, ready, worker } = d.readiness;
  if (precacheEntries === null) return m.diagnostics.offlineReadyUnknown;
  if (ready) return m.diagnostics.offlineReadyYes({ count: precacheEntries });
  if (precacheEntries === 0) return m.diagnostics.offlineReadyEmpty;
  // Cached files exist but `ready` is false, so one of the two halves is missing.
  // When it is the worker, say that: a count of 26 with the shell called
  // "incomplete" is a false diagnosis, and it contradicts the service-worker row
  // immediately above.
  if (worker !== 'active') return m.diagnostics.offlineReadyNoWorker({ count: precacheEntries });
  return m.diagnostics.offlineReadyPartial({ count: precacheEntries });
}

function persistedWord(d: OfflineDiagnostics, m: EditorMessages): string {
  if (d.persisted === null) return m.diagnostics.persistedUnknown;
  return d.persisted ? m.diagnostics.persistedYes : m.diagnostics.persistedNo;
}

function sizeWord(d: OfflineDiagnostics, m: EditorMessages): string {
  if (d.usageBytes === null) return m.diagnostics.sizeUnknown;
  return m.diagnostics.sizeValue({ bytes: d.usageBytes });
}

/**
 * Offline readiness, in four lines a user can screenshot.
 *
 * It answers what a "No internet access" report cannot: did the service worker
 * install, did the precache populate, and did the browser evict it. The reads
 * live in `useOfflineDiagnostics`; this only words them.
 */
function OfflineReadinessPanel({ m }: { m: EditorMessages }) {
  const diagnostics = useOfflineDiagnostics();
  const rows = [
    { label: m.diagnostics.serviceWorkerLabel, value: serviceWorkerWord(diagnostics, m) },
    { label: m.diagnostics.offlineReadyLabel, value: offlineReadyWord(diagnostics, m) },
    { label: m.diagnostics.persistedLabel, value: persistedWord(diagnostics, m) },
    { label: m.diagnostics.sizeLabel, value: sizeWord(diagnostics, m) },
  ];
  return (
    <section className="mt-5 border-neutral-200 border-t pt-4">
      <h3 className="font-medium text-[13px] text-neutral-800">{m.diagnostics.heading}</h3>
      <p className="mt-0.5 text-[11px] text-neutral-500 leading-relaxed">{m.diagnostics.hint}</p>
      <dl className="mt-2 space-y-1">
        {rows.map((row) => (
          <div key={row.label} className="flex gap-3 text-[12px]">
            <dt className="w-32 shrink-0 text-neutral-500">{row.label}</dt>
            <dd className="min-w-0 flex-1 text-neutral-700">
              {diagnostics.settled ? row.value : m.diagnostics.checking}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function AboutDialog({ onClose }: { onClose: () => void }) {
  const m = useEditorMessages();

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
    else if (result === 'check-failed') showToast('info', m.app.updateCheckFailed);
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

      <OfflineReadinessPanel m={m} />

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
