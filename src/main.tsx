import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/App';
import { Toaster } from '@/components/toast/Toaster';
import { initPwaUpdateToast } from '@/pwa/pwaUpdate';
import '@/styles/index.css';

// Register the service worker + wire the "new version available" prompt. No-op in
// dev (SW disabled) and idempotent.
initPwaUpdateToast();

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root element #root not found');
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
    <Toaster />
  </StrictMode>
);
