import { test, expect } from '@playwright/test';

const editor = '.cm-content';

test('types into the editor and persists across a reload', async ({ page }) => {
  await page.goto('/');
  await page.locator(editor).click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('# Hello');
  await page.reload();
  await expect(page.locator(editor)).toContainText('# Hello');
});

// unskip in Task 21, when the sidebar provides the document switcher
test.fixme('keeps undo history per document across a switch', async ({ page }) => {
  await page.goto('/');
  await page.locator(editor).click();
  await page.keyboard.type('first document');

  await page.getByRole('button', { name: 'New document' }).click();
  await page.locator(editor).click();
  await page.keyboard.type('second document');

  // Back to the first: its own history must still be there.
  await page.getByRole('button', { name: /document\.md/ }).click();
  await page.locator(editor).click();
  await page.keyboard.press('ControlOrMeta+z');
  await expect(page.locator(editor)).not.toContainText('first document');
});
