import { expect, test } from '@playwright/test';
import { resetApp } from './helpers';

test('tabs: a second tree shows the strip; closing a tab hides it again', async ({ page }) => {
  await resetApp(page);
  const strip = page.getByRole('navigation', { name: 'Open trees' });
  await expect(strip).toBeHidden(); // one tree → no strip

  await page.getByRole('button', { name: 'More actions' }).click();
  await page.getByRole('button', { name: 'New tree' }).click();
  await expect(strip).toBeVisible(); // two trees → strip appears

  await page
    .getByRole('button', { name: /^Close / })
    .first()
    .click();
  await expect(strip).toBeHidden(); // back to one tree
});
