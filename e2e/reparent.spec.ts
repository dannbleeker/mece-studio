import { expect, type Locator, test } from '@playwright/test';

const KEY = 'mece-studio:doc:v1';
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
  await page.goto('/');
  await page.evaluate((k) => localStorage.removeItem(k), KEY);
  await page.reload();

  // Add two sub-issues under the root.
  await page.locator('.react-flow__node').first().click();
  const add = page.getByRole('button', { name: '+ Add sub-issue' });
  await add.click();
  await add.click();
  await expect(page.locator('.react-flow__node')).toHaveCount(3);

  // Identify the root and its two children from the persisted document.
  const { childIds } = await page.evaluate((k) => {
    const doc = JSON.parse(localStorage.getItem(k));
    return { childIds: Object.keys(doc.nodes).filter((id) => id !== doc.rootId) };
  }, KEY);
  const [aId, bId] = childIds;
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
  const parentOfB = await page.evaluate(
    ({ k, id }) => {
      const doc = JSON.parse(localStorage.getItem(k));
      return Object.values(doc.splits).find((s) => s.childIds.includes(id))?.parentId;
    },
    { k: KEY, id: bId }
  );
  expect(parentOfB).toBe(aId);
  await expect(a).not.toHaveClass(RING);
});

test('dropping onto nothing snaps back (no re-parent)', async ({ page }) => {
  await page.goto('/');
  await page.evaluate((k) => localStorage.removeItem(k), KEY);
  await page.reload();

  await page.locator('.react-flow__node').first().click();
  await page.getByRole('button', { name: '+ Add sub-issue' }).click();
  await expect(page.locator('.react-flow__node')).toHaveCount(2);

  const { rootId, childIds } = await page.evaluate((k) => {
    const doc = JSON.parse(localStorage.getItem(k));
    return { rootId: doc.rootId, childIds: Object.keys(doc.nodes).filter((id) => id !== doc.rootId) };
  }, KEY);
  const child = page.locator(`.react-flow__node[data-id="${childIds[0]}"]`);
  const c = center(await settledBox(child));

  // Drag the child straight down into empty space (no node there) and drop.
  await page.mouse.move(c.x, c.y);
  await page.mouse.down();
  await page.mouse.move(c.x, c.y + 300, { steps: 12 });
  await page.mouse.up();

  // Still a child of the root — the drop resolved to nothing.
  const parent = await page.evaluate(
    ({ k, id }) => {
      const doc = JSON.parse(localStorage.getItem(k));
      return Object.values(doc.splits).find((s) => s.childIds.includes(id))?.parentId;
    },
    { k: KEY, id: childIds[0] }
  );
  expect(parent).toBe(rootId);
});
