import { test, expect } from '@playwright/test';

/* The spec's parity contract, proved as a whole rather than feature by feature.
   Lines already covered exactly by an earlier spec file are referenced, not
   duplicated: editing and per-document undo (editor.spec.ts), find and replace
   (find.spec.ts), the return path and checkbox toggle (editable-preview.spec.ts),
   formatting commands (selection-toolbar.spec.ts), explorer (explorer.spec.ts),
   panes, reading mode, direction, sync scroll, word count (chrome.spec.ts),
   import/export/copy (io.spec.ts), lazy math and diagrams (lazy.spec.ts). */

test('restores the whole workspace after a reload', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.cm-content')).toBeVisible();
  await page.getByRole('button', { name: 'Toggle Explorer' }).click();

  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('# First');

  await page.getByRole('button', { name: 'New document' }).click();
  await page.locator('.cm-content').click();
  await page.keyboard.type('# Second');

  await page.reload();
  await expect(page.locator('.preview h1')).toHaveText('Second');
  await page.getByRole('button', { name: 'document.md', exact: true }).click();
  await expect(page.locator('.preview h1')).toHaveText('First');
});

test('opens a workspace written by the previous version', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'md-editor-files',
      JSON.stringify([
        { id: 'legacy-1', name: 'old.md', content: '# From the old build', dir: 'rtl' },
      ])
    );
    localStorage.setItem('md-editor-active-file', 'legacy-1');
  });
  await page.goto('/');
  await expect(page.locator('.preview h1')).toHaveText('From the old build');
  await expect(page.locator('.preview')).toHaveAttribute('dir', 'rtl');
});

test('migrates the legacy single-document key', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('md-editor-content', '# Very old'));
  await page.goto('/');
  await expect(page.locator('.preview h1')).toHaveText('Very old');
});

test('renders every syntax in the README table', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.cm-content')).toBeVisible();
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.insertText(
    [
      '**bold** *italic* ~~strike~~ `code`',
      '',
      '# H1',
      '###### H6',
      '',
      '> quote',
      '',
      '- item',
      '  - nested',
      '',
      '1. numbered',
      '',
      '- [ ] unchecked',
      '- [x] checked',
      '',
      '[text](https://example.com)',
      'https://bare.example.com',
      '[ref][r]',
      '',
      '[r]: https://ref.example.com',
      '',
      '| a | b |',
      '| :--- | ---: |',
      '| 1 | 2 |',
      '',
      'note[^1]',
      '',
      '[^1]: the note',
    ].join('\n')
  );

  const preview = page.locator('.preview');
  await expect(preview.locator('strong')).toHaveText('bold');
  await expect(preview.locator('em')).toHaveText('italic');
  await expect(preview.locator('del')).toHaveText('strike');
  await expect(preview.locator('h1')).toHaveText('H1');
  await expect(preview.locator('h6')).toHaveText('H6');
  await expect(preview.locator('blockquote')).toContainText('quote');
  await expect(preview.locator('input[type=checkbox]')).toHaveCount(2);
  await expect(preview.locator('table th')).toHaveCount(2);
  await expect(preview.locator('a[href="https://bare.example.com"]')).toBeVisible();
  await expect(preview.locator('a[href="https://ref.example.com"]')).toBeVisible();
  await expect(preview.locator('.footnotes li')).toHaveCount(1);
});

test('keeps a rendered document safe from injected script', async ({ page }) => {
  const dialogs: string[] = [];
  page.on('dialog', (d) => {
    dialogs.push(d.message());
    void d.dismiss();
  });
  await page.goto('/');
  await expect(page.locator('.cm-content')).toBeVisible();
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.insertText(
    '<img src=x onerror="alert(1)">\n\n<script>alert(2)</script>\n\n[a](javascript:alert(3))'
  );
  await page.waitForTimeout(500);
  expect(dialogs).toEqual([]);
  await expect(page.locator('.preview a')).not.toHaveAttribute('href', /javascript:/);
});

test('an id in the document never reaches the DOM', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.cm-content')).toBeVisible();
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.insertText('<div id="editor">clobber</div>');
  await expect(page.locator('.preview div#editor')).toHaveCount(0);
});

test('keeps direction per document rather than globally', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'md-editor-files',
      JSON.stringify([
        { id: 'l', name: 'ltr.md', content: 'left to right', dir: 'ltr' },
        { id: 'r', name: 'rtl.md', content: 'راست به چپ', dir: 'rtl' },
      ])
    );
    if (localStorage.getItem('md-editor-explorer') === null) {
      localStorage.setItem('md-editor-explorer', 'open');
    }
  });
  await page.goto('/');
  await expect(page.locator('.preview')).toHaveAttribute('dir', 'ltr');
  await page.getByRole('button', { name: 'rtl.md', exact: true }).click();
  await expect(page.locator('.preview')).toHaveAttribute('dir', 'rtl');
});
