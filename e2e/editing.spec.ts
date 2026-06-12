import { expect, type Page, test } from '@playwright/test';

const KEY = 'mece-studio:doc:v1';

// Inline editing opens by double-clicking a node (the everyday gesture) or by
// pressing Enter / F2 on the selected node. Playwright's simulated dblclick goes
// through React Flow's pointer-capture drag layer and doesn't fire the native
// dblclick, so the keyboard tests drive the Enter path (same editing machinery),
// and the double-click wiring is covered by dispatching the native event.

async function freshRoot(page: Page) {
  await page.goto('/');
  await page.evaluate((k) => localStorage.removeItem(k), KEY);
  await page.reload();
  return page.locator('.react-flow__node').first();
}

test('double-click opens the inline editor', async ({ page }) => {
  const root = await freshRoot(page);
  await root.locator('> div').first().dispatchEvent('dblclick');
  await expect(root.locator('textarea')).toBeVisible();
});

test('Enter edits the selected node; commit persists the new label', async ({ page }) => {
  const root = await freshRoot(page);
  await root.click(); // select
  await page.keyboard.press('Enter'); // start editing

  const input = root.locator('textarea');
  await expect(input).toBeVisible();
  await input.fill('Why are margins down?');
  await input.press('Enter');

  await expect(root.locator('textarea')).toBeHidden();
  await expect(root).toContainText('Why are margins down?');

  const label = await page.evaluate((k) => {
    const doc = JSON.parse(localStorage.getItem(k));
    return doc.nodes[doc.rootId].label;
  }, KEY);
  expect(label).toBe('Why are margins down?');
});

test('Escape cancels the edit without changing the label', async ({ page }) => {
  const root = await freshRoot(page);
  await root.click();
  await page.keyboard.press('Enter');

  const input = root.locator('textarea');
  await expect(input).toBeVisible();
  await input.fill('Discarded text');
  await input.press('Escape');

  await expect(root.locator('textarea')).toBeHidden();
  await expect(root).toContainText('Why is this happening?');
});
