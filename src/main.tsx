import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/App';
import { Toaster } from '@/components/toast/Toaster';
import { LocaleShell } from '@/i18n/LocaleShell';
import { catalogueFor } from '@/i18n/registry';
import { checkOfflineReadiness } from '@/pwa/offlineReadiness';
import { requestPersistentStorage } from '@/pwa/persistentStorage';
import { initPwaUpdateToast } from '@/pwa/pwaUpdate';
import { loadSettings } from '@/services/storage';
import '@/styles/index.css';

// Register the service worker + wire the "new version available" prompt. No-op in
// dev (SW disabled) and idempotent.
// Runs before React mounts, so it reads the persisted locale directly rather
// than through the provider.
initPwaUpdateToast(catalogueFor(loadSettings().locale));

// Ask for persistent storage. Best-effort storage is evicted *whole* — the SW
// precache that makes the app open offline and the user's saved trees go
// together — so this protects the data, not just the shell. Fire-and-forget:
// the browser answers on its own heuristics, there is nothing the user can do
// about a refusal, and boot must not wait on it.
void requestPersistentStorage();

// Then check that offline access actually *works*, and repair it if it doesn't.
// A registration can outlive its Cache Storage — evicted under quota pressure, or
// cleared on exit by enterprise policy — and the only symptom is the browser's
// "No internet access" page the next time the user opens the installed app with
// no network. An active worker over an empty precache is exactly that damage;
// the check drives one reinstall to undo it, at most once per session.
void checkOfflineReadiness();

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root element #root not found');
}

createRoot(rootEl).render(
  <StrictMode>
    <LocaleShell>
      <App />
      <Toaster />
    </LocaleShell>
  </StrictMode>
);
