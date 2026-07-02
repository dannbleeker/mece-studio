import { expect, test } from '@playwright/test';
import { resetApp } from './helpers';

test('quick add issues adds several children at once', async ({ page }) => {
  await resetApp(page);

  await page.getByRole('button', { name: 'More actions' }).click();
  await page.getByRole('button', { name: 'Quick add issues…' }).click();
  await page.getByLabel('Issues to add, one per line').fill('Pricing\nDemand\nDistribution');
  await page.getByRole('button', { name: 'Add issues' }).click();

  for (const label of ['Pricing', 'Demand', 'Distribution']) {
    await expect(page.locator('.react-flow__node', { hasText: label })).toBeVisible();
  }
});

test('quick add nests indented lines into a subtree', async ({ page }) => {
  await resetApp(page);

  await page.getByRole('button', { name: 'More actions' }).click();
  await page.getByRole('button', { name: 'Quick add issues…' }).click();
  await page.getByLabel('Issues to add, one per line').fill('Pricing\n  Cost floor\n  Value ceiling\nDemand');
  await page.getByRole('button', { name: 'Add issues' }).click();

  // All four land on the canvas; the indented pair nested under Pricing.
  for (const label of ['Pricing', 'Cost floor', 'Value ceiling', 'Demand']) {
    await expect(page.locator('.react-flow__node', { hasText: label })).toBeVisible();
  }
});
