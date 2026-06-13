import { expect, type Page, test } from '@playwright/test';
import { activeDoc, resetApp } from './helpers';

async function freshRootSelected(page: Page) {
  await resetApp(page);
  await page.locator('.react-flow__node').first().click();
}

test('set a value and unit, shown on the node', async ({ page }) => {
  await freshRootSelected(page);

  await page.getByRole('button', { name: 'Value' }).click(); // value lives on the Value tab now
  await page.locator('aside input[type="number"]').fill('250');
  await page.locator('aside input[type="number"]').blur();
  await page.locator('aside input[placeholder="unit"]').fill('DKK');
  await page.locator('aside input[placeholder="unit"]').blur();

  const node = page.locator('.react-flow__node').first();
  await expect(node).toContainText('250');
  await expect(node).toContainText('DKK');

  const doc = await activeDoc(page);
  expect(doc.nodes[doc.rootId].value).toEqual({ amount: 250, unit: 'DKK' });
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
