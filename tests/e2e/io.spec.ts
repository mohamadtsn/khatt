import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.cm-content')).toBeVisible();
});

test('imports several markdown files at once', async ({ page }) => {
  await page.getByRole('button', { name: 'Toggle Explorer' }).click();
  await page.getByRole('button', { name: 'More actions' }).click();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('menuitem', { name: 'Open a file' }).click();
  await (
    await chooser
  ).setFiles([
    { name: 'one.md', mimeType: 'text/markdown', buffer: Buffer.from('# One') },
    { name: 'two.md', mimeType: 'text/markdown', buffer: Buffer.from('# Two') },
  ]);
  await expect(page.getByRole('button', { name: 'one.md', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'two.md', exact: true })).toBeVisible();
  await expect(page.locator('.preview h1')).toHaveText('Two');
});

test('exports the document as markdown', async ({ page }) => {
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('# Exported');
  await page.getByRole('button', { name: 'Export as' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('menuitem', { name: 'Markdown' }).click();
  expect((await download).suggestedFilename()).toBe('document.md');
});

test('exports a self-contained HTML file with no external references', async ({ page }) => {
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('# Exported\n\n```js\nconst x = 1;');
  await page.getByRole('button', { name: 'Export as' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('menuitem', { name: 'HTML' }).click();
  const stream = await (await download).createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  const html = Buffer.concat(chunks).toString('utf8');
  expect(html).toContain('<h1>Exported</h1>');
  expect(html).not.toMatch(/<link[^>]+href="http/);
  expect(html).not.toMatch(/<script[^>]+src="http/);
});

test('copies as plain text', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('# Copy me');
  await page.getByRole('button', { name: 'Copy as' }).click();
  await page.getByRole('menuitem', { name: 'Plain text' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('Copy me');
});

test('imports a file dropped onto the window', async ({ page }) => {
  await page.getByRole('button', { name: 'Toggle Explorer' }).click();
  await page.evaluate(() => {
    const transfer = new DataTransfer();
    transfer.items.add(new File(['# Dropped'], 'dropped.md', { type: 'text/markdown' }));
    document.body.dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true }));
  });
  await expect(page.getByRole('button', { name: 'dropped.md', exact: true })).toBeVisible();
});
