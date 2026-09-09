import { test, expect } from '@playwright/test';

test('applies the stored theme before first paint', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('md-editor-theme', 'dark'));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('an explicit light choice beats a dark system preference', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.addInitScript(() => localStorage.setItem('md-editor-theme', 'light'));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('a menu closes on Escape and returns focus to its trigger', async ({ page }) => {
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'More actions' });
  await trigger.click();
  await expect(page.getByRole('menu')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toBeHidden();
  await expect(trigger).toBeFocused();
});
