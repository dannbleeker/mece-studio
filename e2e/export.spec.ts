import { expect, test } from '@playwright/test';
import { enterWorkspace } from './helpers';

// The image render (html-to-image) + the export libraries can take a few seconds.
test.describe(() => {
  test.slow();

  const cases = [
    { label: 'PNG', file: 'mece-tree.png' },
    { label: 'PDF', file: 'mece-tree.pdf' },
    { label: 'PPTX', file: 'mece-tree.pptx' },
    { label: 'JSON', file: 'mece-tree.json' },
  ];

  for (const { label, file } of cases) {
    test(`Export ${label} downloads ${file}`, async ({ page }) => {
      await page.goto('/');
      await enterWorkspace(page);

      // Export now lives in a header dropdown — open it, then pick the format.
      await page.getByRole('button', { name: 'Export' }).click();
      const download = page.waitForEvent('download');
      await page.getByRole('button', { name: label, exact: true }).click();
      expect((await download).suggestedFilename()).toBe(file);
    });
  }
});
