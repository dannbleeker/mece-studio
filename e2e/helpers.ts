import { expect, type Page } from '@playwright/test';

/** From the Start page, open the most-recent tree (the resume card) into the canvas. */
export async function enterWorkspace(page: Page) {
  await page.getByRole('button', { name: /Resume/ }).click();
  await expect(page.locator('.react-flow__node').first()).toBeVisible();
}

/**
 * Reset to a single fresh tree, on the canvas. Clearing the library + reloading
 * lands on the Start page; open that one seeded tree to enter the workspace
 * (without creating a second tree, so the library stays at one).
 */
export async function resetApp(page: Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await enterWorkspace(page);
}

/** Go Home to the Start shell (the ← Start button in the workspace header). */
export async function gotoStart(page: Page) {
  await page.getByRole('button', { name: '← Start' }).click();
}

/** From the workspace, go Home and open an example tree by name (opens a fresh copy). */
export async function openExample(page: Page, name: RegExp) {
  await gotoStart(page);
  await page.getByRole('button', { name }).click();
  await expect(page.locator('.react-flow__node').first()).toBeVisible();
}

/** From the workspace, go Home, open the Templates page, and open a named framework template. */
export async function openFrameworkTemplate(page: Page, name: RegExp) {
  await gotoStart(page);
  await page.getByRole('button', { name: 'Templates' }).click();
  await page.getByRole('button', { name }).click();
  await expect(page.locator('.react-flow__node').first()).toBeVisible();
}

/** How many trees are in the saved library, read straight from localStorage. */
export async function libraryCount(page: Page): Promise<number> {
  return page.evaluate(() => {
    const lib = JSON.parse(localStorage.getItem('mece-studio:library:v1') ?? 'null');
    return lib ? lib.docs.length : 0;
  });
}

/** The currently-active document, read straight from localStorage. */
// biome-ignore lint/suspicious/noExplicitAny: test-only structural read of persisted JSON
export async function activeDoc(page: Page): Promise<any> {
  return page.evaluate(() => {
    const lib = JSON.parse(localStorage.getItem('mece-studio:library:v1') ?? 'null');
    return lib
      ? JSON.parse(localStorage.getItem(`mece-studio:doc:${lib.activeId}`) ?? 'null')
      : null;
  });
}
