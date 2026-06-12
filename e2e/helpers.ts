import { expect, type Page } from '@playwright/test';

/** Reset to a single fresh tree by clearing the whole document library. */
export async function resetApp(page: Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('.react-flow__node').first()).toBeVisible();
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
