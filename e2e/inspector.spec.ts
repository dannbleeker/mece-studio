import { expect, type Page, test } from '@playwright/test';

const KEY = 'mece-studio:doc:v1';

async function freshRootSelected(page: Page) {
  await page.goto('/');
  await page.evaluate((k) => localStorage.removeItem(k), KEY);
  await page.reload();
  await page.locator('.react-flow__node').first().click();
}

test('set a value and unit, shown on the node', async ({ page }) => {
  await freshRootSelected(page);

  await page.locator('aside input[type="number"]').fill('250');
  await page.locator('aside input[type="number"]').blur();
  await page.locator('aside input[placeholder="unit"]').fill('DKK');
  await page.locator('aside input[placeholder="unit"]').blur();

  const node = page.locator('.react-flow__node').first();
  await expect(node).toContainText('250');
  await expect(node).toContainText('DKK');

  const value = await page.evaluate((k) => {
    const doc = JSON.parse(localStorage.getItem(k));
    return doc.nodes[doc.rootId].value;
  }, KEY);
  expect(value).toEqual({ amount: 250, unit: 'DKK' });
});

test('adding notes shows a marker on the node', async ({ page }) => {
  await freshRootSelected(page);

  const notes = page.getByPlaceholder(/Rationale/);
  await notes.fill('Margin compression since Q2.');
  await notes.blur();

  await expect(
    page.locator('.react-flow__node').first().locator('span[aria-label="Has notes"]')
  ).toBeVisible();
});
