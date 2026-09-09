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

test('keeps undo history per document across a switch', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('md-editor-explorer', 'open'));
  await page.goto('/');
  await page.locator(editor).click();
  await page.keyboard.type('first document');

  await page.getByRole('button', { name: 'New document' }).click();
  await page.locator(editor).click();
  await page.keyboard.type('second document');

  // Back to the first: its own history must still be there.
  await page.getByRole('button', { name: 'document.md', exact: true }).click();
  await page.locator(editor).click();
  await page.keyboard.press('ControlOrMeta+z');
  await expect(page.locator(editor)).not.toContainText('first document');
});

test('Enter continues a list and a second Enter ends it', async ({ page }) => {
  await page.goto('/');
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('- one');
  await page.keyboard.press('Enter');
  await page.keyboard.type('two');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.type('after');
  await expect(page.locator('.cm-content')).toContainText('- two');
  await expect(page.locator('.cm-content')).not.toContainText('- after');
});
