import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

const here = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // base stays '/' — the app is served at the root of a custom subdomain
  // (mece-studio.struktureretsundfornuft.dk), not a project sub-path.
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 'prompt' = surface a "new version" toast rather than force-reload.
      registerType: 'prompt',
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,ico,woff2}'],
        navigateFallback: '/index.html',
      },
      manifest: {
        name: 'MECE Studio',
        short_name: 'MECE Studio',
        description:
          'Build McKinsey-style issue trees with built-in MECE checking — spot overlaps and gaps as you decompose.',
        theme_color: '#3f6fb0',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': path.join(here, 'src'),
    },
  },
  test: {
    environment: 'node',
    globals: false,
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx', 'src/**/*.test.ts'],
  },
});
