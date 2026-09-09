import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const STANDARDS = ['wcag2a', 'wcag2aa'];

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.cm-content')).toBeVisible();
});

test('the default view has no violations', async ({ page }) => {
  const results = await new AxeBuilder({ page }).withTags(STANDARDS).analyze();
  expect(results.violations).toEqual([]);
});

test('the open explorer has no violations', async ({ page }) => {
  await page.getByRole('button', { name: 'Toggle Explorer' }).click();
  const results = await new AxeBuilder({ page }).withTags(STANDARDS).analyze();
  expect(results.violations).toEqual([]);
});

test('an open menu has no violations', async ({ page }) => {
  await page.getByRole('button', { name: 'More actions' }).click();
  await expect(page.getByRole('menu')).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(STANDARDS).analyze();
  expect(results.violations).toEqual([]);
});

test('an open dialog has no violations', async ({ page }) => {
  await page.getByRole('button', { name: 'Toggle Explorer' }).click();
  await page.getByRole('button', { name: 'Rename document.md' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(STANDARDS).analyze();
  expect(results.violations).toEqual([]);
});

test('reading mode has no violations', async ({ page }) => {
  await page.getByRole('button', { name: 'Reading mode' }).click();
  const results = await new AxeBuilder({ page }).withTags(STANDARDS).analyze();
  expect(results.violations).toEqual([]);
});
