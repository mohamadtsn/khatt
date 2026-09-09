import { test, expect } from '@playwright/test';

test('serves a valid manifest', async ({ page }) => {
  const response = await page.request.get('/manifest.webmanifest');
  expect(response.ok()).toBe(true);
  const manifest = (await response.json()) as {
    display: string;
    name: string;
    icons: { purpose?: string }[];
  };
  expect(manifest.display).toBe('standalone');
  expect(manifest.name).toContain('Markdown');
  expect(manifest.icons.some((i) => i.purpose === 'maskable')).toBe(true);
});

test('registers a service worker', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, {
    timeout: 15000,
  });
  expect(await page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
});

test('still works with the network cut', async ({ page, context }) => {
  await page.goto('/');
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, {
    timeout: 15000,
  });
  await context.setOffline(true);
  await page.reload();
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('# Offline');
  await expect(page.locator('.preview h1')).toHaveText('Offline');
});
