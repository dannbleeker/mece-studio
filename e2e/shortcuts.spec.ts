import { expect, test } from '@playwright/test';
import { resetApp } from './helpers';

test('keyboard-shortcuts overlay opens via the header button and the ? key, and Escape closes it', async ({
  page,
}) => {
  await resetApp(page);
  const dialog = page.getByRole('dialog', { name: 'Keyboard shortcuts' });
  const trigger = page.getByRole('button', { name: 'Keyboard shortcuts' });

  // Opens from the header "?" button, moving focus into the dialog.
  await trigger.click();
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Add a child to the selected node and edit it');
  await expect(dialog).toBeFocused();

  // Escape closes it and restores focus to the trigger.
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();

  // The "?" key on the canvas opens it again.
  await page.locator('.react-flow__pane').click();
  await page.keyboard.press('?');
  await expect(dialog).toBeVisible();
});
