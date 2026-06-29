import { expect, test } from '@playwright/test';
import { libraryCount, resetApp } from './helpers';

test('Import outline builds a new tree from pasted Markdown', async ({ page }) => {
  await resetApp(page);
  expect(await libraryCount(page)).toBe(1);

  await page.getByRole('button', { name: 'More actions' }).click();
  await page.getByRole('button', { name: 'Import outline…' }).click();

  await page
    .getByLabel('Outline or JSON to import')
    .fill('# Imported via paste\n- Pricing\n  - Too high\n- Demand');
  await page.getByRole('button', { name: 'Import' }).click();

  // Opens as a new active tree showing the pasted root question.
  await expect(page.locator('.react-flow__node').first()).toContainText('Imported via paste');
  expect(await libraryCount(page)).toBe(2);
});
