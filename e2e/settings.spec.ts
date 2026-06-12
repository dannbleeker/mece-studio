import { expect, type Page, test } from '@playwright/test';
import { resetApp } from './helpers';

async function nodeY(page: Page, text: string): Promise<number> {
  const box = await page.locator('.react-flow__node').filter({ hasText: text }).boundingBox();
  if (!box) throw new Error(`no node containing "${text}"`);
  return box.y;
}

test('settings: sort-by-priority reorders siblings on the canvas and persists', async ({ page }) => {
  await resetApp(page);

  // The profit example: Revenue's children are "Price per item" (no priority,
  // created first) and "Units sold" (HIGH priority, created second).
  await page.getByRole('combobox', { name: 'Load an example tree' }).selectOption('profit');
  await page.waitForTimeout(500);

  // Default = creation order: "Price per item" sits above "Units sold".
  expect(await nodeY(page, 'Price per item')).toBeLessThan(await nodeY(page, 'Units sold'));

  // Turn on "sort siblings by priority" in Settings.
  await page.getByRole('button', { name: 'Settings' }).click();
  const dialog = page.getByRole('dialog', { name: 'Settings' });
  await expect(dialog).toBeVisible();
  await dialog.getByText('Sort siblings by priority').click();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await page.waitForTimeout(500);

  // Now the high-priority "Units sold" sits above "Price per item".
  expect(await nodeY(page, 'Units sold')).toBeLessThan(await nodeY(page, 'Price per item'));

  // The preference persists across a reload.
  await page.reload();
  await page.waitForTimeout(600);
  expect(await nodeY(page, 'Units sold')).toBeLessThan(await nodeY(page, 'Price per item'));
});
