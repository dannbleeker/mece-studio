import { expect, test } from '@playwright/test';
import { activeDoc, libraryCount, openExample, resetApp } from './helpers';

test('loading an example opens it as a new tree without clobbering the current one', async ({
  page,
}) => {
  await resetApp(page);

  // Open the value-driver example from the Start page.
  await openExample(page, /Operating profit/);

  // It renders (root + revenue/costs + four drivers = 7 nodes)...
  await expect(page.locator('.react-flow__node')).toHaveCount(7);

  // ...persisted as the active document...
  const doc = await activeDoc(page);
  expect(Object.keys(doc.nodes)).toHaveLength(7);

  // ...and added to the library alongside the starter tree (2 documents total).
  expect(await libraryCount(page)).toBe(2);
});
