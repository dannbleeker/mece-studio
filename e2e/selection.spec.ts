import { expect, type Page, test } from '@playwright/test';
import { activeDoc, resetApp } from './helpers';

// Build root → Revenue + Costs (two siblings) from the keyboard.
async function twoSiblings(page: Page) {
  await resetApp(page);
  const root = page.locator('.react-flow__node').first();
  await root.click();
  await page.keyboard.press('Tab');
  await page.locator('.react-flow__node textarea').fill('Revenue');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Shift+Enter'); // add a sibling under the same parent
  await page.locator('.react-flow__node textarea').fill('Costs');
  await page.keyboard.press('Enter');
  await expect(page.locator('.react-flow__node')).toHaveCount(3);
}

const box = (b: { x: number; y: number; width: number; height: number }) => b;

/** A generous box enclosing the two children, clamped to stay right of the root. */
async function childrenBox(page: Page) {
  const rev = box((await page.locator('.react-flow__node', { hasText: 'Revenue' }).boundingBox())!);
  const cost = box((await page.locator('.react-flow__node', { hasText: 'Costs' }).boundingBox())!);
  const root = box(
    (await page.locator('.react-flow__node', { hasText: 'Why is this happening?' }).boundingBox())!
  );
  const pad = 30;
  // Left edge stays right of the root so the box never encloses it.
  const minX = Math.max(Math.min(rev.x, cost.x) - pad, root.x + root.width + 8);
  const minY = Math.min(rev.y, cost.y) - pad;
  const maxX = Math.max(rev.x + rev.width, cost.x + cost.width) + pad;
  const maxY = Math.max(rev.y + rev.height, cost.y + cost.height) + pad;
  return { minX, minY, maxX, maxY };
}

test('Shift+drag box-selects nodes and a bulk action applies to all', async ({ page }) => {
  await twoSiblings(page);
  const r = await childrenBox(page);

  await page.keyboard.down('Shift');
  await page.mouse.move(r.minX, r.minY);
  await page.mouse.down();
  await page.mouse.move((r.minX + r.maxX) / 2, (r.minY + r.maxY) / 2, { steps: 8 });
  await page.mouse.move(r.maxX, r.maxY, { steps: 8 });
  await page.mouse.up();
  await page.keyboard.up('Shift');

  // The floating action bar confirms both are selected (root is left of the box).
  await expect(page.getByText('2 selected')).toBeVisible();

  await page.getByRole('button', { name: 'Set status supported' }).click();
  const doc = await activeDoc(page);
  const supported = Object.values(doc.nodes)
    // biome-ignore lint/suspicious/noExplicitAny: test-only structural read
    .filter((n: any) => n.status === 'supported')
    // biome-ignore lint/suspicious/noExplicitAny: test-only structural read
    .map((n: any) => n.label)
    .sort();
  expect(supported).toEqual(['Costs', 'Revenue']);
});

test('a plain drag pans and does not box-select', async ({ page }) => {
  await twoSiblings(page);
  const r = await childrenBox(page);

  // Same drag, but without Shift → this pans the canvas, no selection box.
  await page.mouse.move(r.minX, r.minY);
  await page.mouse.down();
  await page.mouse.move(r.maxX, r.maxY, { steps: 12 });
  await page.mouse.up();

  await expect(page.getByText('2 selected')).toHaveCount(0);
});
