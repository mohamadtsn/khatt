import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.cm-content')).toBeVisible();
});

test('toggles the theme and remembers it', async ({ page }) => {
  await page.getByRole('button', { name: 'Toggle theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('switches direction per document', async ({ page }) => {
  await page.getByRole('button', { name: 'More actions' }).click();
  await page.getByRole('menuitem', { name: 'Text direction' }).click();
  await expect(page.locator('.preview')).toHaveAttribute('dir', 'rtl');

  // A new document inherits the direction the fallback key now holds.
  await page.getByRole('button', { name: 'Toggle Explorer' }).click();
  await page.getByRole('button', { name: 'New document' }).click();
  await expect(page.locator('.preview')).toHaveAttribute('dir', 'rtl');
});

test('drags the divider and remembers the split', async ({ page }) => {
  const divider = page.getByRole('separator', { name: 'Resize editor and preview panes' });
  const box = await divider.boundingBox();
  if (!box) throw new Error('the divider has no box');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x - 200, box.y + box.height / 2, { steps: 10 });
  await page.mouse.up();
  const split = await page.evaluate(() => localStorage.getItem('md-editor-split'));
  expect(Number(split)).toBeLessThan(50);
});

test('resizes the panes with the arrow keys', async ({ page }) => {
  await page.getByRole('separator', { name: 'Resize editor and preview panes' }).focus();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  const split = await page.evaluate(() => localStorage.getItem('md-editor-split'));
  expect(Number(split)).toBeLessThan(50);
});

test('enters and leaves reading mode with Escape', async ({ page }) => {
  await page.getByRole('button', { name: 'Reading mode' }).click();
  await expect(page.locator('body')).toHaveClass(/reading/);
  await page.keyboard.press('Escape');
  await expect(page.locator('body')).not.toHaveClass(/reading/);
});

test('locking reading mode makes the preview read-only', async ({ page }) => {
  await page.getByRole('button', { name: 'Reading mode' }).click();
  await page.getByRole('button', { name: 'Lock reading mode' }).click();
  await expect(page.locator('.preview')).toHaveAttribute('contenteditable', 'false');
});

test('cycles the visible pane', async ({ page }) => {
  await page.getByRole('button', { name: 'Switch pane' }).click();
  await expect(page.locator('.preview')).toBeHidden();
  await page.getByRole('button', { name: 'Switch pane' }).click();
  await expect(page.locator('.cm-content')).toBeHidden();
  await page.getByRole('button', { name: 'Switch pane' }).click();
  await expect(page.locator('.preview')).toBeVisible();
  await expect(page.locator('.cm-content')).toBeVisible();
});

test('clearing the editor is undoable', async ({ page }) => {
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('words to keep');
  await page.getByRole('button', { name: 'More actions' }).click();
  await page.getByRole('menuitem', { name: 'Clear editor' }).click();
  await expect(page.locator('.cm-content')).toHaveText('');
  await page.keyboard.press('ControlOrMeta+z');
  await expect(page.locator('.cm-content')).toContainText('words to keep');
});

test('counts words and characters', async ({ page }) => {
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('one two three');
  await expect(page.getByTestId('stat-words')).toHaveText('3 words');
  await expect(page.getByTestId('stat-chars')).toHaveText('13 chars');
});
