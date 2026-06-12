import { expect, test } from '@playwright/test';
import { resetApp } from './helpers';

test('About dialog opens, shows licensing + a notices link, and closes', async ({ page }) => {
  await resetApp(page);

  await page.getByRole('button', { name: 'About' }).click();
  const dialog = page.getByRole('dialog', { name: 'About MECE Studio' });
  await expect(dialog).toBeVisible();

  // Dual-license summary + a link to the rendered third-party notices.
  await expect(dialog).toContainText('Apache-2.0');
  await expect(dialog).toContainText('CC BY-NC 4.0');
  await expect(dialog.locator('a[href="/notices.html"]').first()).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});
