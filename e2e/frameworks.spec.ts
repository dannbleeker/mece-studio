import { expect, test } from '@playwright/test';
import { activeDoc, libraryCount, openFrameworkTemplate, resetApp } from './helpers';

test('loading a named framework template opens it as a fresh framework tree', async ({ page }) => {
  await resetApp(page);

  // Open SWOT from the Templates page. (Its card name is globally unique — unlike
  // "4Ps", which also appears in the generic Framework hint and the 4Cs blurb.)
  await openFrameworkTemplate(page, /SWOT analysis/);

  // Root + Strengths / Weaknesses / Opportunities / Threats = 5 nodes.
  await expect(page.locator('.react-flow__node')).toHaveCount(5);

  const doc = await activeDoc(page);
  expect(Object.keys(doc.nodes)).toHaveLength(5);

  // The single split is a (not-provably-MECE) framework split with four branches.
  const splits = Object.values(doc.splits);
  expect(splits).toHaveLength(1);
  expect(splits[0].decomposition).toBe('framework');
  expect(splits[0].childIds).toHaveLength(4);

  // Opened as a fresh library entry alongside the starter tree (2 documents total).
  expect(await libraryCount(page)).toBe(2);
});
