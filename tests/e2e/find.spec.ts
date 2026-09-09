import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'md-editor-files',
      JSON.stringify([
        { id: 'a', name: 'a.md', content: 'alpha beta alpha gamma alpha', dir: 'ltr' },
      ])
    )
  );
  await page.goto('/');
  // The shortcut is bound after hydration; typing before it is bound does nothing.
  await expect(page.locator('.cm-content')).toBeVisible();
});

test('counts matches and moves between them', async ({ page }) => {
  await page.keyboard.press('ControlOrMeta+f');
  await page.getByLabel('Find').fill('alpha');
  await expect(page.getByTestId('find-count')).toHaveText('1 of 3');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByTestId('find-count')).toHaveText('2 of 3');
});

test('replaces all and the change is undoable in one step', async ({ page }) => {
  await page.keyboard.press('ControlOrMeta+f');
  await page.getByLabel('Find').fill('alpha');
  await page.getByLabel('Replace with').fill('delta');
  await page.getByRole('button', { name: 'Replace all' }).click();
  await expect(page.locator('.cm-content')).toContainText('delta beta delta gamma delta');
  await page.keyboard.press('Escape');
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+z');
  await expect(page.locator('.cm-content')).toContainText('alpha beta alpha gamma alpha');
});

test('Escape closes the bar', async ({ page }) => {
  await page.keyboard.press('ControlOrMeta+f');
  await expect(page.getByLabel('Find')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByLabel('Find')).toBeHidden();
});

test('reports no match without throwing', async ({ page }) => {
  await page.keyboard.press('ControlOrMeta+f');
  await page.getByLabel('Find').fill('zzz');
  await expect(page.getByTestId('find-count')).toHaveText('No results');
});
