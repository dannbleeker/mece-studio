import { expect, type Page, test } from '@playwright/test';

const KEY = 'mece-studio:doc:v1';

// Build root → Branch → Leaf from the keyboard (Tab adds a child and edits it).
async function buildThreeLevels(page: Page) {
  await page.goto('/');
  await page.evaluate((k) => localStorage.removeItem(k), KEY);
  await page.reload();

  const root = page.locator('.react-flow__node').first();
  await root.click();
  await page.keyboard.press('Tab');
  await page.locator('.react-flow__node textarea').fill('Branch');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await page.locator('.react-flow__node textarea').fill('Leaf');
  await page.keyboard.press('Enter');
  await expect(page.locator('.react-flow__node')).toHaveCount(3);
}

test('collapse hides a subtree and expand restores it', async ({ page }) => {
  await buildThreeLevels(page);

  const branchId = await page.evaluate((k) => {
    const doc = JSON.parse(localStorage.getItem(k));
    const rootSplit = Object.values(doc.splits).find((s) => s.parentId === doc.rootId);
    return rootSplit.childIds[0];
  }, KEY);
  const branch = page.locator(`.react-flow__node[data-id="${branchId}"]`);

  await branch.locator('button[aria-label="Collapse subtree"]').click();
  await expect(page.locator('.react-flow__node')).toHaveCount(2); // Leaf hidden
  await expect(branch.locator('button[aria-label="Expand subtree"]')).toContainText('1');

  await branch.locator('button[aria-label="Expand subtree"]').click();
  await expect(page.locator('.react-flow__node')).toHaveCount(3);
});

test('search rings the matching node', async ({ page }) => {
  await page.goto('/');
  await page.evaluate((k) => localStorage.removeItem(k), KEY);
  await page.reload();

  const root = page.locator('.react-flow__node').first();
  await root.click();
  await page.keyboard.press('Tab');
  await page.locator('.react-flow__node textarea').fill('Revenue');
  await page.keyboard.press('Enter');

  await page.getByLabel('Find nodes').fill('reven');

  const revenue = page.locator('.react-flow__node', { hasText: 'Revenue' });
  await expect(revenue.locator('> div').first()).toHaveClass(/ring-\[#d99a2b\]/);
  // the root ("Why is this happening?") does not match
  const rootNode = page.locator('.react-flow__node', { hasText: 'Why is this happening?' });
  await expect(rootNode.locator('> div').first()).not.toHaveClass(/ring-\[#d99a2b\]/);
});
