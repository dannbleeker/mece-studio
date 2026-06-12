import { expect, type Locator, test } from '@playwright/test';
import { activeDoc, resetApp } from './helpers';

const RING = /ring-\[#3f7d54\]/; // the drop-target highlight class

// Wait until a node stops moving (the post-add fitView animation settles) before
// reading its box, so drag coordinates point at where the node actually is.
async function settledBox(locator: Locator) {
  let prev: { x: number; y: number; width: number; height: number } | null = null;
  for (let i = 0; i < 40; i++) {
    const box = await locator.boundingBox();
    if (box && prev && Math.abs(box.x - prev.x) < 0.5 && Math.abs(box.y - prev.y) < 0.5) {
      return box;
    }
    prev = box;
    await locator.page().waitForTimeout(50);
  }
  if (!prev) throw new Error('node never became visible');
  return prev;
}

const center = (b: { x: number; y: number; width: number; height: number }) => ({
  x: b.x + b.width / 2,
  y: b.y + b.height / 2,
});

test('drag-to-reparent: highlights the valid target and re-parents on drop', async ({ page }) => {
  await resetApp(page);

  // Add two sub-issues under the root.
  await page.locator('.react-flow__node').first().click();
  const add = page.getByRole('button', { name: '+ Add sub-issue' });
  await add.click();
  await add.click();
  await expect(page.locator('.react-flow__node')).toHaveCount(3);

  // Identify the root and its two children from the persisted document.
  const doc = await activeDoc(page);
  const [aId, bId] = Object.keys(doc.nodes).filter((id) => id !== doc.rootId);
  const a = page.locator(`.react-flow__node[data-id="${aId}"]`);
  const b = page.locator(`.react-flow__node[data-id="${bId}"]`);

  const aCenter = center(await settledBox(a));
  const bCenter = center(await settledBox(b));

  // Drag B onto A with real (trusted) mouse movement.
  await page.mouse.move(bCenter.x, bCenter.y);
  await page.mouse.down();
  await page.mouse.move(aCenter.x, aCenter.y, { steps: 16 });

  // Mid-drag: A is ringed as the valid drop target; the dragged node never is.
  await expect(a).toHaveClass(RING);
  await expect(b).not.toHaveClass(RING);

  await page.mouse.up();

  // After release: B is now a child of A, and the ring is cleared.
  const after = await activeDoc(page);
  const parentOfB = Object.values(after.splits).find((s) => s.childIds.includes(bId))?.parentId;
  expect(parentOfB).toBe(aId);
  await expect(a).not.toHaveClass(RING);
});

test('dropping onto nothing snaps back (no re-parent)', async ({ page }) => {
  await resetApp(page);

  await page.locator('.react-flow__node').first().click();
  await page.getByRole('button', { name: '+ Add sub-issue' }).click();
  await expect(page.locator('.react-flow__node')).toHaveCount(2);

  const doc = await activeDoc(page);
  const rootId = doc.rootId;
  const [childId] = Object.keys(doc.nodes).filter((id) => id !== doc.rootId);
  const child = page.locator(`.react-flow__node[data-id="${childId}"]`);
  const c = center(await settledBox(child));

  // Drag the child straight down into empty space (no node there) and drop.
  await page.mouse.move(c.x, c.y);
  await page.mouse.down();
  await page.mouse.move(c.x, c.y + 300, { steps: 12 });
  await page.mouse.up();

  // Still a child of the root — the drop resolved to nothing.
  const after = await activeDoc(page);
  const parent = Object.values(after.splits).find((s) => s.childIds.includes(childId))?.parentId;
  expect(parent).toBe(rootId);
});
