import { expect, test } from '@playwright/test';
import { activeDoc, libraryCount, resetApp } from './helpers';

test('Open imports a JSON tree as a new library entry and switches to it', async ({ page }) => {
  await resetApp(page);
  expect(await libraryCount(page)).toBe(1);

  // Take the app's own current document (so the schema is guaranteed valid),
  // relabel its root, and import it back through the hidden file input.
  const doc = await activeDoc(page);
  doc.nodes[doc.rootId].label = 'Imported root question';

  await page.setInputFiles('input[type="file"]', {
    name: 'tree.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(doc)),
  });

  // It lands as a NEW entry and becomes active (the canvas shows its root).
  await expect(page.locator('.react-flow__node').first()).toContainText('Imported root question');
  expect(await libraryCount(page)).toBe(2);
});
