import { expect, type Page, test } from '@playwright/test';
import { enterWorkspace, gotoStart, libraryCount } from './helpers';

// Each test runs in an isolated browser context, so localStorage starts empty and
// the store seeds a single fresh tree on load; open it into the canvas.
async function freshApp(page: Page) {
  await page.goto('/');
  await enterWorkspace(page);
}

test('create a second tree and switch between them', async ({ page }) => {
  await freshApp(page);

  // Rename the first tree's root so the two are distinguishable.
  await page.locator('.react-flow__node').first().click();
  await page.keyboard.press('Enter');
  await page.locator('.react-flow__node textarea').fill('First tree');
  await page.keyboard.press('Enter');

  expect(await libraryCount(page)).toBe(1);

  await page.getByRole('button', { name: '+ New' }).click();
  expect(await libraryCount(page)).toBe(2);
  await expect(page.locator('.react-flow__node').first()).toContainText('Why is this happening?');

  // Switch back to "First tree" from the Start page's tree cards (the card's open action).
  await gotoStart(page);
  await page.getByRole('button', { name: 'Open First tree' }).click();
  await expect(page.locator('.react-flow__node').first()).toContainText('First tree');
});

test('deleting the active tree falls back to another', async ({ page }) => {
  await freshApp(page);

  await page.getByRole('button', { name: '+ New' }).click();
  expect(await libraryCount(page)).toBe(2);

  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Delete' }).click();
  expect(await libraryCount(page)).toBe(1);
});
