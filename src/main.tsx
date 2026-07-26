import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/App';
import { Toaster } from '@/components/toast/Toaster';
import { LocaleShell } from '@/i18n/LocaleShell';
import { catalogueFor } from '@/i18n/registry';
import { initPwaUpdateToast } from '@/pwa/pwaUpdate';
import { loadSettings } from '@/services/storage';
import '@/styles/index.css';

// Register the service worker + wire the "new version available" prompt. No-op in
// dev (SW disabled) and idempotent.
// Runs before React mounts, so it reads the persisted locale directly rather
// than through the provider.
initPwaUpdateToast(catalogueFor(loadSettings().locale));

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
