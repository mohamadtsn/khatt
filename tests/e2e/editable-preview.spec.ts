import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'md-editor-files',
      JSON.stringify([
        { id: 'a', name: 'a.md', content: '# Title\n\nA paragraph.\n\n- [ ] task\n', dir: 'ltr' },
      ])
    )
  );
  await page.goto('/');
  await expect(page.locator('.preview p')).toBeVisible();
});

test('typing in the preview writes back to the markdown', async ({ page }) => {
  await page.locator('.preview p').click();
  await page.keyboard.press('End');
  await page.keyboard.type(' Extra.');
  await expect(page.locator('.cm-content')).toContainText('A paragraph. Extra.');
});

test('editing one word does not reformat the rest of the document', async ({ page }) => {
  await page.locator('.preview p').click();
  await page.keyboard.press('End');
  await page.keyboard.type('!');
  await expect(page.locator('.cm-content')).toContainText('# Title');
  await expect(page.locator('.cm-content')).toContainText('- [ ] task');
});

test('ticking a checkbox edits one character, not the whole file', async ({ page }) => {
  await page.locator('.preview input[type=checkbox]').click();
  await expect(page.locator('.cm-content')).toContainText('- [x] task');
  await expect(page.locator('.cm-content')).toContainText('A paragraph.');
});

test('a generated block cannot be typed into', async ({ page }) => {
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('```mermaid\ngraph TD;\n  A-->B;');
  await expect(page.locator('.preview .mermaid-block')).toHaveAttribute('contenteditable', 'false');
});
