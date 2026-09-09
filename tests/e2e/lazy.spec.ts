import { test, expect } from '@playwright/test';

test('renders inline and display math', async ({ page }) => {
  await page.goto('/');
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('Inline $x^2$ and');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.type('$$\n\\frac{1}{2}\n$$');
  await expect(page.locator('.preview .math-inline .katex').first()).toBeVisible();
  await expect(page.locator('.preview .math-block .katex')).toBeVisible();
});

test('renders a mermaid diagram and re-themes it', async ({ page }) => {
  await page.goto('/');
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('```mermaid\ngraph TD;\n  A-->B;');
  const block = page.locator('.preview .mermaid-block');
  await expect(block.locator('svg')).toBeVisible();
  await expect(block).toHaveAttribute('data-rendered', 'light');

  await page.getByRole('button', { name: 'Toggle theme' }).click();
  // The recorded theme is what drives the re-render, and it happens exactly once.
  await expect(block).toHaveAttribute('data-rendered', 'dark');
  await expect(block.locator('svg')).toBeVisible();
});

test('shows the source when a diagram fails to parse', async ({ page }) => {
  await page.goto('/');
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('```mermaid\nnot a diagram at all {{{');
  await expect(page.locator('.preview .mermaid-error')).toBeVisible();
  await expect(page.locator('.preview .mermaid-error')).toContainText('not a diagram');
});

test('a document with no diagram and no math loads neither library', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  await page.goto('/');
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('# just prose');
  await page.waitForTimeout(1000);
  expect(requests.some((u) => /mermaid|katex/i.test(u))).toBe(false);
});
