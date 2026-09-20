/**
 * The offline regression test.
 *
 * MECE Studio is a local-first PWA, so "works with the network off" is a
 * product promise, not a nicety — and nothing guarded it. The failure it exists
 * to catch is the one a user actually hit: the browser's own "No internet
 * access" page, which means the service worker did not serve the navigation at
 * all. A chunk that stops being precached fails the same way, one route later,
 * so both are asserted here.
 *
 * Why this spec runs its own server: the service worker only exists in a
 * production build (`devOptions.enabled: false` in vite.config.ts), and the
 * suite's shared `webServer` is the dev server. So this builds once into a
 * throwaway directory — never `dist/`, which the bundle-size gate owns — and
 * previews that. Everything else in e2e/ keeps using the dev server.
 *
 * No screenshots, deliberately: this must pass on Linux CI and on a workstation
 * alike, so every assertion is behavioural.
 */
import { type ChildProcess, spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

const PORT = 5175;
const ORIGIN = `http://127.0.0.1:${PORT}`;
const VITE = './node_modules/vite/bin/vite.js';

/** Built once in `beforeAll`; also the source of the chunk list we assert on. */
let outDir = '';
let preview: ChildProcess | null = null;

/** Every JS chunk the build emitted, as page-absolute URLs. */
function emittedChunks(dir: string): string[] {
  return readdirSync(join(dir, 'assets'))
    .filter((name) => name.endsWith('.js'))
    .map((name) => `/assets/${name}`);
}

async function waitForServer(url: string, timeoutMs = 60_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Not listening yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`preview server did not start at ${url}`);
}

test.beforeAll(async () => {
  test.setTimeout(240_000); // a cold production build, then a server start

  outDir = mkdtempSync(join(tmpdir(), 'mece-offline-'));
  const build = spawnSync(process.execPath, [VITE, 'build', '--outDir', outDir], {
    stdio: 'inherit',
  });
  if (build.status !== 0) throw new Error(`vite build failed (exit ${build.status})`);

  preview = spawn(
    process.execPath,
    [
      VITE,
      'preview',
      '--outDir',
      outDir,
      '--host',
      '127.0.0.1',
      '--port',
      String(PORT),
      '--strictPort',
    ],
    { stdio: 'inherit' }
  );
  await waitForServer(ORIGIN);
});

test.afterAll(() => {
  preview?.kill();
  preview = null;
});

test('the app, its indicator and every chunk survive the network going away', async ({ page }) => {
  // Three navigations plus one fetch per emitted chunk — comfortably past the
  // suite's 30s default, which is sized for single-screen interactions.
  test.setTimeout(90_000);
  const context = page.context();

  await test.step('first visit installs the service worker and it takes control', async () => {
    await page.goto(ORIGIN);
    // `ready` resolves once a worker is activated — which is also when workbox
    // has finished precaching, since that happens during install.
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
    // With `registerType: 'prompt'` there is no clientsClaim, so the first load
    // is uncontrolled and a reload is what hands the page over — exactly like a
    // user's second visit. The subtlety that makes a single attempt flaky: a
    // worker takes a document at navigation-commit time, so if the reload
    // commits before the worker is ready to take it, THIS document has no
    // controller and never will, and waiting on it cannot succeed however
    // generous the timeout. Reload until one sticks instead.
    let controlled = false;
    for (let attempt = 0; attempt < 5 && !controlled; attempt += 1) {
      await page.reload();
      controlled = await page
        .waitForFunction(() => navigator.serviceWorker.controller !== null, undefined, {
          timeout: 5_000,
        })
        .then(() => true)
        .catch(() => false);
    }
    expect(controlled, 'the service worker took control of the page').toBe(true);
  });

  await context.setOffline(true);

  await test.step('the offline notice tells the user it is the network', async () => {
    // Asserted on the *transition*, before the reload below, and that ordering is
    // load-bearing rather than incidental.
    //
    // Chromium does not propagate emulated-offline into a document that is
    // created after `setOffline`: measured under this exact setup (Chrome 151,
    // vite preview, service-worker-served reload), `navigator.onLine` still reads
    // `true` in the new document and no `offline` event ever fires, so the notice
    // correctly does not render and this assertion would fail against a perfectly
    // healthy app. A real machine with no network reports `false` at document
    // creation, so that path is sound in production, and it is covered by
    // useOnlineStatus's unit tests, which seed the hook from `navigator.onLine`.
    //
    // Going offline while the page is open is the path the emulator does drive
    // faithfully — it fires the event — so that is what is asserted here. Do not
    // move this below the reload without re-checking the measurement above.
    // Matched on the notice's opening words rather than the whole sentence, so a
    // reworded reassurance does not fail the offline test. The em dash keeps it
    // from also matching the "Ready to use offline." precache toast.
    await expect(page.getByRole('status').filter({ hasText: 'Offline —' })).toBeVisible();
  });

  await test.step('a reload with no network still renders the app', async () => {
    await page.reload();
    // A user-visible locator, not a status code: the failure mode is the
    // browser's error page, which also "loads".
    await expect(page.getByRole('heading', { name: "What's your key question?" })).toBeVisible();
  });

  await test.step('every emitted JS chunk resolves from the precache', async () => {
    const chunks = emittedChunks(outDir);
    expect(chunks.length).toBeGreaterThan(0);

    const failures = await page.evaluate(async (paths: string[]) => {
      const bad: { path: string; status: number }[] = [];
      for (const path of paths) {
        try {
          const response = await fetch(path);
          if (!response.ok) bad.push({ path, status: response.status });
        } catch {
          bad.push({ path, status: 0 }); // network error — nothing served it
        }
      }
      return bad;
    }, chunks);

    // A newly-unprecached chunk lands here by name, which is the whole point.
    expect(failures).toEqual([]);
  });

  await context.setOffline(false);
});
