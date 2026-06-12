import { defineConfig } from '@playwright/test';

// E2E layer — runs a real browser, so it lives outside `pnpm verify` (the fast
// gate) and runs via `pnpm e2e`. Browsers are installed project-local
// (PLAYWRIGHT_BROWSERS_PATH=0, set in scripts/e2e.mjs) so they sit under
// C:\devtools and satisfy the local AppLocker policy.
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: false,
  forbidOnly: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:5174',
    viewport: { width: 1280, height: 800 },
    trace: 'off',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: {
    command: 'node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5174 --strictPort',
    url: 'http://127.0.0.1:5174',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
