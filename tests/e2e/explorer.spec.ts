import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // addInitScript re-runs on reload, so seed only when the key is absent —
  // otherwise it would overwrite what the app itself saved.
  await page.addInitScript(() => {
    if (localStorage.getItem('md-editor-explorer') === null) {
      localStorage.setItem('md-editor-explorer', 'open');
    }
  });
  await page.goto('/');
  await expect(page.locator('.cm-content')).toBeVisible();
});

test('creates, switches, renames and closes documents', async ({ page }) => {
  await page.getByRole('button', { name: 'New document' }).click();
  await expect(page.getByRole('button', { name: 'untitled.md', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'document.md', exact: true }).click();
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('in the first');

  await page.getByRole('button', { name: 'untitled.md', exact: true }).click();
  await expect(page.locator('.cm-content')).not.toContainText('in the first');

  await page.getByRole('button', { name: 'Rename untitled.md' }).click();
  await page.getByLabel('Name', { exact: true }).fill('notes.md');
  await page.getByRole('button', { name: 'Rename', exact: true }).click();
  await expect(page.getByRole('button', { name: 'notes.md', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Close notes.md' }).click();
  await expect(page.getByRole('button', { name: 'notes.md', exact: true })).toBeHidden();
});

test('closing the last document leaves a fresh empty one', async ({ page }) => {
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.press('Backspace');
  await page.getByRole('button', { name: 'Close document.md' }).click();
  await expect(page.getByRole('button', { name: 'document.md', exact: true })).toBeVisible();
  await expect(page.locator('.cm-content')).toHaveText('');
});

test('remembers whether the explorer was open', async ({ page }) => {
  await page.getByRole('button', { name: 'Toggle Explorer' }).click();
  await page.reload();
  await expect(page.locator('.cm-content')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Toggle Explorer' })).toHaveAttribute(
    'aria-expanded',
    'false'
  );
});

test('warns before closing a document with content', async ({ page }) => {
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('some words');
  await page.getByRole('button', { name: 'Close document.md' }).click();
  await expect(page.getByRole('dialog')).toContainText('document.md');
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.locator('.cm-content')).toContainText('some words');
});
