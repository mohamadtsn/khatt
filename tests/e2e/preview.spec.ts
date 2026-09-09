import { test, expect } from '@playwright/test';

test('renders markdown live as you type', async ({ page }) => {
  await page.goto('/');
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('## Live');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.type('- a');
  await page.keyboard.press('Enter');
  await page.keyboard.type('b');
  await expect(page.locator('.preview h2')).toHaveText('Live');
  await expect(page.locator('.preview li')).toHaveCount(2);
});

test('highlights a fenced code block only when a document has one', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  await page.goto('/');
  await expect(page.locator('.preview')).toBeVisible();
  expect(requests.some((u) => /shiki/i.test(u))).toBe(false);

  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('```js\nconst x = 1;');
  await expect(page.locator('.preview pre code span').first()).toBeVisible();
});

test('makes no cross-origin request', async ({ page }) => {
  const external: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith('http://localhost')) external.push(r.url());
  });
  await page.goto('/');
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('```js\nconst x = 1;');
  await page.waitForTimeout(1500);
  expect(external).toEqual([]);
});
