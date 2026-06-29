import { expect, test } from '@playwright/test';
import { activeDoc, libraryCount, resetApp } from './helpers';

test('Open imports a JSON tree as a new library entry and switches to it', async ({ page }) => {
  await resetApp(page);
  expect(await libraryCount(page)).toBe(1);

  // Take the app's own current document (so the schema is guaranteed valid) and
  // relabel its root, then import it back through the File System Access flow.
  const doc = await activeDoc(page);
  doc.nodes[doc.rootId].label = 'Imported root question';
  const json = JSON.stringify(doc);

  // Stub the open picker to return a handle over our JSON so the real open flow
  // runs without a native file dialog (Chromium supports File System Access).
  await page.evaluate((text) => {
    const handle = {
      name: 'tree.json',
      getFile: async () => new File([text], 'tree.json', { type: 'application/json' }),
      createWritable: async () => ({ write: async () => {}, close: async () => {} }),
    };
    (window as unknown as { showOpenFilePicker: unknown }).showOpenFilePicker = async () => [
      handle,
    ];
  }, json);

  await page.getByRole('button', { name: 'More actions' }).click();
  await page.getByRole('button', { name: 'Open file…' }).click();

  // It lands as a NEW entry and becomes active (the canvas shows its root).
  await expect(page.locator('.react-flow__node').first()).toContainText('Imported root question');
  expect(await libraryCount(page)).toBe(2);
});
