import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig, type Plugin } from 'vitest/config';
import { DEFAULT_LOCALE } from './src/domain/types';
import { allManifests, manifestFor } from './src/i18n/manifests';

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Emit one web-app manifest per locale alongside the plugin's default.
 *
 * `vite-plugin-pwa` only knows how to write a single manifest, so the installed
 * app's name and description would otherwise be frozen in one language. These
 * sit next to it and `useDocumentLanguage` points `<link rel="manifest">` at the
 * right one; `globPatterns` includes `webmanifest`, so they are precached and an
 * offline install still gets its own language.
 */
function localeManifests(): Plugin {
  return {
    name: 'mece-locale-manifests',
    apply: 'build',
    generateBundle() {
      for (const { fileName, source } of allManifests()) {
        this.emitFile({ type: 'asset', fileName, source });
      }
    },
  };
}

export default defineConfig({
  // base stays '/' — the app is served at the root of a custom subdomain
  // (mece-studio.struktureretsundfornuft.dk), not a project sub-path.
  plugins: [
    react(),
    tailwindcss(),
    localeManifests(),
    VitePWA({
      // 'prompt' = surface a "new version" toast rather than force-reload.
      registerType: 'prompt',
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,ico,woff2,webmanifest}'],
        // SPA deep links fall back to the app shell...
        navigateFallback: '/index.html',
        // ...but never rewrite the standalone pages (/user-guide.html, /notices.html,
        // /dashboard.html) or the book downloads (.pdf/.epub) into it — opening those
        // in a new tab is a navigation request, so without this the SW would serve the
        // app instead of the file. (No /api/ — the app has no backend.)
        navigateFallbackDenylist: [/\.html$/, /\.(?:pdf|epub)$/],
      },
      // The default-locale manifest; `localeManifests()` emits the rest.
      manifest: manifestFor(DEFAULT_LOCALE),
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': path.join(here, 'src'),
      // Vitest can't resolve the build-time virtual module; alias it to a stub.
      ...(process.env.VITEST
        ? { 'virtual:pwa-register': path.join(here, 'tests/stubs/virtual-pwa-register.ts') }
        : {}),
    },
  },
  test: {
    environment: 'node',
    globals: false,
    // Tests are co-located under src/; tests/ holds only shared stubs.
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    // Coverage runs only in the stats pipeline (`vitest run --coverage`), not in
    // the gate; build-stats.mjs reads coverage/coverage-summary.json.
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'json-summary', 'json'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/main.tsx', 'src/**/*.d.ts', 'src/vite-env.d.ts'],
    },
  },
});
