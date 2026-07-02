import { expect, type Page, test } from '@playwright/test';
import { libraryCount } from './helpers';

// Fresh isolated context → empty localStorage → the store seeds one tree and the
// app lands on the Start page. Open the "All trees" gallery (cards carry the
// rename / duplicate / delete actions).
async function freshStartAllTrees(page: Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: /All trees/ }).click();
}

test('rename a tree from its Start card', async ({ page }) => {
  await freshStartAllTrees(page);

  await page.getByRole('button', { name: /^Rename/ }).click();
  await page.getByRole('textbox', { name: 'Rename tree' }).fill('Renamed in e2e');
  await page.getByRole('dialog').getByRole('button', { name: 'Rename' }).click();

  await expect(page.getByRole('button', { name: 'Open Renamed in e2e' })).toBeVisible();
});

test('duplicate then delete a tree from its Start card', async ({ page }) => {
  await freshStartAllTrees(page);

  await page.getByRole('button', { name: /^Duplicate/ }).click();
  expect(await libraryCount(page)).toBe(2);

  await page.getByRole('button', { name: /^Delete/ }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete tree' }).click();
  expect(await libraryCount(page)).toBe(1);
  // Still on the Start shell (no jump to the canvas), even though the active tree was deleted.
  await expect(page.getByRole('button', { name: '+ New tree' })).toBeVisible();
});
