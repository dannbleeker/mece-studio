import { expect, test } from '@playwright/test';
import { activeDoc, resetApp } from './helpers';

test('loading an example opens it as a new tree without clobbering the current one', async ({
  page,
}) => {
  await resetApp(page);

  await page.getByRole('combobox', { name: 'Load an example tree' }).selectOption('profit');

  // The value-driver example renders (root + revenue/costs + four drivers = 7 nodes)...
  await expect(page.locator('.react-flow__node')).toHaveCount(7);

  // ...persisted as the active document...
  const doc = await activeDoc(page);
  expect(Object.keys(doc.nodes)).toHaveLength(7);

  // ...and added to the library alongside the starter tree (2 documents total).
  await expect(page.locator('select[aria-label="Open tree"] option')).toHaveCount(2);
});
