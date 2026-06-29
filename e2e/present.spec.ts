import { expect, test } from '@playwright/test';
import { resetApp } from './helpers';

test('Presentation mode opens from the menu and exits on Escape', async ({ page }) => {
  await resetApp(page);
  await page.getByRole('button', { name: 'More actions' }).click();
  await page.getByRole('button', { name: 'Present' }).click();

  await expect(page.getByText('MECE Studio · Presentation')).toBeVisible();
  await expect(page.getByText(/^\d+ \/ \d+$/)).toBeVisible(); // step counter

  await page.keyboard.press('Escape');
  await expect(page.getByText('MECE Studio · Presentation')).toBeHidden();
});

test('Print preview opens from the menu and closes', async ({ page }) => {
  await resetApp(page);
  await page.getByRole('button', { name: 'More actions' }).click();
  await page.getByRole('button', { name: 'Print…' }).click();

  await expect(page.getByText('Print preview')).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByText('Print preview')).toBeHidden();
});
