import { expect, test } from '@playwright/test';

const KEY = 'mece-studio:doc:v1';
const RING = /ring-\[#3f7d54\]/; // the drop-target highlight class

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

  const ab = await a.boundingBox();
  const bb = await b.boundingBox();
  if (!ab || !bb) throw new Error('expected both child nodes to be visible');

  // Drag B onto A with real (trusted) mouse movement.
  await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
  await page.mouse.down();
  await page.mouse.move(ab.x + ab.width / 2, ab.y + ab.height / 2, { steps: 12 });

  // Mid-drag: A is ringed as the valid drop target.
  await expect(a).toHaveClass(RING);
  // B (the node being dragged) is never its own drop target.
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
  const box = await child.boundingBox();
  if (!box) throw new Error('expected the child node to be visible');

  // Drag the child into empty space (far from any node) and drop.
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 400, box.y + 260, { steps: 10 });
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
