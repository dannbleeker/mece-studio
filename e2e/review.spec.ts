import { expect, test } from '@playwright/test';
import { resetApp } from './helpers';

test('MECE review dock: flag a split, locate it, then remedy it', async ({ page }) => {
  await resetApp(page);

  // A fresh tree has no splits, so the health chip reads clean.
  await expect(page.getByRole('button', { name: /MECE clean/ })).toBeVisible();

  // Stage a flagged split: segment the root, then delete its scaffolded "Other"
  // bucket so the segmentation is no longer collectively exhaustive.
  await page.locator('.react-flow__node').first().click();
  await page.getByRole('button', { name: 'Logic' }).click();
  await page.getByRole('button', { name: 'Segments' }).click();
  await page.waitForTimeout(500);
  await page.locator('.react-flow__node').filter({ hasText: 'Other' }).first().click();
  await page.keyboard.press('Delete');
  await page.waitForTimeout(500);

  // The chip now flags one split; open the review dock from it.
  const chip = page.getByRole('button', { name: /to review/ });
  await expect(chip).toBeVisible();
  await chip.click();

  const dock = page.getByRole('complementary', { name: 'MECE review' });
  await expect(dock).toBeVisible();
  await expect(dock).toContainText('Collectively exhaustive'); // the engine's CE reason

  // Locate re-centres the canvas on the flagged node (the viewport transform changes).
  const viewport = page.locator('.react-flow__viewport');
  const before = await viewport.getAttribute('style');
  await dock.getByRole('button', { name: /Why is this happening/ }).click();
  await page.waitForTimeout(700);
  expect(await viewport.getAttribute('style')).not.toBe(before);

  // The one-click remedy adds an "Other" bucket, which clears the gap: the dock
  // empties and the header chip flips back to clean.
  await dock.getByRole('button', { name: /Add an .Other. bucket/ }).click();
  await expect(dock).toContainText('nothing to review');
  await expect(page.getByRole('button', { name: /MECE clean/ })).toBeVisible();
});
