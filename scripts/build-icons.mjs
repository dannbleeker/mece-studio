// `pnpm icons` — render the PWA install icons (public/icon-192.png + icon-512.png)
// from the brand favicon mark, scaled to a 512 viewBox and laid full-bleed (so the
// maskable crop has no transparent corners). Reproducible: Playwright Chromium (the
// binary already installed for e2e + the book PDF), deterministic output for a given
// SVG. Generate-once — not in the gate; re-run by hand if the brand mark changes.
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

// Browsers are installed project-local (under C:\devtools, AppLocker-allowed) — same
// as scripts/e2e.mjs + the rebuild-book workflow.
process.env.PLAYWRIGHT_BROWSERS_PATH = '0';

// The favicon glyph (viewBox 0 0 32) scaled ×16 to 512, on a full-bleed brand square.
const iconSvg = (
  size
) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#3f6fb0"/>
  <g fill="none" stroke="#ffffff" stroke-width="36" stroke-linecap="round">
    <path d="M176 256 H272"/>
    <path d="M272 256 V152 H344"/>
    <path d="M272 256 V360 H344"/>
  </g>
  <g fill="#ffffff">
    <circle cx="144" cy="256" r="43"/>
    <circle cx="376" cy="152" r="37"/>
    <circle cx="376" cy="360" r="37"/>
  </g>
</svg>`;

const SIZES = [192, 512];

async function main() {
  const browser = await chromium.launch();
  try {
    for (const size of SIZES) {
      const page = await browser.newPage({ viewport: { width: size, height: size } });
      await page.setContent(
        `<!doctype html><html><body style="margin:0;background:#3f6fb0">${iconSvg(size)}</body></html>`
      );
      const buf = await page.screenshot({
        type: 'png',
        clip: { x: 0, y: 0, width: size, height: size },
      });
      const out = path.join('public', `icon-${size}.png`);
      writeFileSync(out, buf);
      process.stdout.write(
        `icon: ${out} (${size}×${size}, ${(buf.length / 1024).toFixed(1)} KB)\n`
      );
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  process.stderr.write(`build-icons failed — ${e.message}\n`);
  process.exit(1);
});
