import { expect, type Page, test } from '@playwright/test';

// Each test runs in an isolated browser context, so localStorage starts empty
// and the store seeds a single fresh tree on load.
async function freshApp(page: Page) {
  await page.goto('/');
  await expect(page.locator('.react-flow__node').first()).toBeVisible();
}

test('create a second tree and switch between them', async ({ page }) => {
  await freshApp(page);

  // Rename the first tree's root so the two are distinguishable.
  await page.locator('.react-flow__node').first().click();
  await page.keyboard.press('Enter');
  await page.locator('.react-flow__node textarea').fill('First tree');
  await page.keyboard.press('Enter');

  const picker = page.getByLabel('Open tree');
  await expect(picker.locator('option')).toHaveCount(1);

  await page.getByRole('button', { name: '+ New' }).click();
  await expect(picker.locator('option')).toHaveCount(2);
  await expect(page.locator('.react-flow__node').first()).toContainText('Why is this happening?');

  await picker.selectOption({ label: 'First tree' });
  await expect(page.locator('.react-flow__node').first()).toContainText('First tree');
});

test('deleting the active tree falls back to another', async ({ page }) => {
  await freshApp(page);

  await page.getByRole('button', { name: '+ New' }).click();
  const picker = page.getByLabel('Open tree');
  await expect(picker.locator('option')).toHaveCount(2);

  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(picker.locator('option')).toHaveCount(1);
});
