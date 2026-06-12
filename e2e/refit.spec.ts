import { expect, type Page, test } from '@playwright/test';
import { resetApp } from './helpers';

// Add a child to the root via the proven Tab → textarea → Enter path.
async function addChildToRoot(page: Page, label: string) {
  await page.locator('.react-flow__node').first().click();
  await page.keyboard.press('Tab');
  const ta = page.locator('.react-flow__node textarea');
  await expect(ta).toBeVisible();
  await ta.fill(label);
  await ta.press('Enter');
}

// Is every rendered node inside the canvas container? (the safety invariant: the
// smart re-fit must never leave a node off-screen).
async function allNodesOnScreen(page: Page): Promise<boolean> {
  const box = await page.locator('.react-flow').boundingBox();
  if (!box) return false;
  for (const n of await page.locator('.react-flow__node').all()) {
    const b = await n.boundingBox();
    if (!b) continue;
    if (
      b.x < box.x - 1 ||
      b.y < box.y - 1 ||
      b.x + b.width > box.x + box.width + 1 ||
      b.y + b.height > box.y + box.height + 1
    ) {
      return false;
    }
  }
  return true;
}

test('auto-fit keeps every node on screen as the tree grows past the viewport', async ({
  page,
}) => {
  await resetApp(page);
  for (let i = 0; i < 10; i++) await addChildToRoot(page, `Child ${i + 1}`);
  await expect(page.locator('.react-flow__node')).toHaveCount(11);
  await page.waitForTimeout(400); // let the final fit settle
  expect(await allNodesOnScreen(page)).toBe(true);
});

test('auto-fit leaves the view alone when a new node already fits', async ({ page }) => {
  await resetApp(page);
  await addChildToRoot(page, 'A');
  await addChildToRoot(page, 'B');

  // Zoom out for headroom so the next node is comfortably in view.
  await page.locator('.react-flow__controls-zoomout').click();
  await page.locator('.react-flow__controls-zoomout').click();
  await page.locator('.react-flow__controls-zoomout').click();
  await page.waitForTimeout(300);

  const before = await page.locator('.react-flow__viewport').getAttribute('style');
  await addChildToRoot(page, 'C');
  await expect(page.locator('.react-flow__node')).toHaveCount(4);
  await page.waitForTimeout(400);
  const after = await page.locator('.react-flow__viewport').getAttribute('style');

  expect(after).toBe(before); // no jump — the viewport was left untouched
});
