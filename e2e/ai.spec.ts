import { expect, type Page, test } from '@playwright/test';

const KEY = 'mece-studio:doc:v1';

async function freshTree(page: Page) {
  await page.goto('/');
  await page.evaluate((k) => localStorage.removeItem(k), KEY);
  await page.reload();
  await expect(page.locator('.react-flow__node').first()).toBeVisible();
}

test('Synthesis "AI critique" copies a prompt with the tree embedded', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await freshTree(page);

  await page.getByRole('button', { name: 'Synthesis' }).click();
  await page.getByRole('button', { name: 'AI critique' }).click();

  const clip = await page.evaluate(() => navigator.clipboard.readText());
  expect(clip).toContain('MECE');
  expect(clip).toContain('Why is this happening?'); // root label, embedded as Markdown
});

test('inspector copies a "suggest a split" prompt for the selected node', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await freshTree(page);

  await page.locator('.react-flow__node').first().click();
  await page.getByRole('button', { name: /suggest a split/ }).click();

  const clip = await page.evaluate(() => navigator.clipboard.readText());
  expect(clip).toContain('Propose a MECE decomposition');
});
