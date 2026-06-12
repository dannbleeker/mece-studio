import { expect, test } from '@playwright/test';

// The image render (html-to-image) + jspdf can take a few seconds.
test.describe(() => {
  test.slow();

  test('Export PNG downloads a PNG file', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.react-flow__node').first()).toBeVisible();

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export PNG' }).click();
    expect((await download).suggestedFilename()).toBe('mece-tree.png');
  });

  test('Export PDF downloads a PDF file', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.react-flow__node').first()).toBeVisible();

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export PDF' }).click();
    expect((await download).suggestedFilename()).toBe('mece-tree.pdf');
  });
});
