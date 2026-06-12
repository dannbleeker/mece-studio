import { expect, type Page, test } from '@playwright/test';
import { activeDoc, resetApp } from './helpers';

// Inline editing opens by double-clicking a node (the everyday gesture) or by
// pressing Enter / F2 on the selected node. Playwright's simulated dblclick goes
// through React Flow's pointer-capture drag layer and doesn't fire the native
// dblclick, so the keyboard tests drive the Enter path (same editing machinery),
// and the double-click wiring is covered by dispatching the native event.

async function freshRoot(page: Page) {
  await resetApp(page);
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

  const doc = await activeDoc(page);
  expect(doc.nodes[doc.rootId].label).toBe('Why are margins down?');
});

test('Tab on the selected node adds a child and edits it', async ({ page }) => {
  const root = await freshRoot(page);
  await root.click(); // select the root
  await page.keyboard.press('Tab'); // add a child and start editing it

  await expect(page.locator('.react-flow__node')).toHaveCount(2);
  const input = page.locator('.react-flow__node textarea');
  await expect(input).toBeVisible();
  await input.fill('Revenue');
  await input.press('Enter');

  const doc = await activeDoc(page);
  const split = Object.values(doc.splits).find((s) => s.parentId === doc.rootId);
  expect(doc.nodes[split.childIds[0]].label).toBe('Revenue');
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
