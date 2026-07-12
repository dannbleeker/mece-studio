import { expect, type Page, test } from '@playwright/test';
import { activeDoc, resetApp } from './helpers';

type RawSplit = { parentId: string; logic?: string; summary?: string };

async function freshRootSelected(page: Page) {
  await resetApp(page);
  await page.locator('.react-flow__node').first().click();
}

test('the problem brief writes situation + complication to the doc', async ({ page }) => {
  await freshRootSelected(page);

  await page.getByRole('button', { name: /Problem brief/ }).click();
  await page.getByLabel('Situation').fill('Stable mid-sized co');
  await page.getByLabel('Situation').blur();
  await page.getByLabel('Complication').fill('Margin fell to 9%');
  await page.getByLabel('Complication').blur();
  await page.keyboard.press('Escape'); // close the dialog

  const doc = await activeDoc(page);
  expect(doc.problemBrief).toEqual({
    situation: 'Stable mid-sized co',
    complication: 'Margin fell to 9%',
  });
});

test('split logic toggle and so-what land in the doc and the synthesis', async ({ page }) => {
  await freshRootSelected(page);

  // Two sub-issues → the root now has a real split (the root stays selected).
  await page.getByRole('button', { name: '+ Add sub-issue' }).click();
  await page.getByRole('button', { name: '+ Add sub-issue' }).click();

  await page.getByRole('button', { name: 'Logic' }).click();
  await page.getByRole('button', { name: 'deductive' }).click();
  const soWhat = page.getByPlaceholder(/the one takeaway/);
  await soWhat.fill('Profit is squeezed on both sides');
  await soWhat.blur();

  const doc = await activeDoc(page);
  const rootSplit = (Object.values(doc.splits) as RawSplit[]).find(
    (sp) => sp.parentId === doc.rootId
  );
  expect(rootSplit?.logic).toBe('deductive');
  expect(rootSplit?.summary).toBe('Profit is squeezed on both sides');

  // The so-what leads the branch in the answer-first synthesis.
  await page.getByRole('button', { name: 'Synthesis' }).click();
  await expect(page.getByText('Profit is squeezed on both sides')).toBeVisible();
});
