import { test, expect, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'md-editor-files',
      JSON.stringify([{ id: 'a', name: 'a.md', content: 'make this bold please\n', dir: 'ltr' }])
    )
  );
  await page.goto('/');
  await expect(page.locator('.preview p')).toBeVisible();
});

async function selectWord(page: Page, word: string) {
  await page.locator('.preview p').evaluate((el, w) => {
    const text = el.firstChild as Text;
    const start = text.data.indexOf(w);
    const range = document.createRange();
    range.setStart(text, start);
    range.setEnd(text, start + w.length);
    const selection = getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  }, word);
}

test('appears on selection and applies bold', async ({ page }) => {
  await selectWord(page, 'bold');
  await expect(page.getByRole('toolbar', { name: 'Formatting' })).toBeVisible();
  await page.getByRole('button', { name: 'Bold' }).click();
  await expect(page.locator('.cm-content')).toContainText('**bold**');
});

test('a formatting action is one undo step', async ({ page }) => {
  await selectWord(page, 'bold');
  await page.getByRole('button', { name: 'Bold' }).click();
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+z');
  await expect(page.locator('.cm-content')).toContainText('make this bold please');
  await expect(page.locator('.cm-content')).not.toContainText('**');
});

test('hides when the selection collapses', async ({ page }) => {
  await selectWord(page, 'bold');
  await expect(page.getByRole('toolbar', { name: 'Formatting' })).toBeVisible();
  await page.locator('.preview').click();
  await expect(page.getByRole('toolbar', { name: 'Formatting' })).toBeHidden();
});

const inline: [string, string][] = [
  ['Italic', '*bold*'],
  ['Strikethrough', '~~bold~~'],
  ['Inline code', '`bold`'],
];
for (const [name, expected] of inline) {
  test(`applies ${name.toLowerCase()}`, async ({ page }) => {
    await selectWord(page, 'bold');
    await page.getByRole('button', { name }).click();
    await expect(page.locator('.cm-content')).toContainText(expected);
  });
}

const blocks: [string, string][] = [
  ['Quote', '> make this bold please'],
  ['Bullet list', '- make this bold please'],
  ['Numbered list', '1. make this bold please'],
  ['Checklist', '- [ ] make this bold please'],
];
for (const [name, expected] of blocks) {
  test(`applies ${name.toLowerCase()}`, async ({ page }) => {
    await selectWord(page, 'bold');
    await page.getByRole('button', { name }).click();
    await expect(page.locator('.cm-content')).toContainText(expected);
  });
}

// One test per level: applying a heading turns the <p> into an <h*>, so a loop
// inside one test would be selecting an element that no longer exists.
for (const [level, hashes] of [
  ['H1', '#'], ['H2', '##'], ['H3', '###'],
  ['H4', '####'], ['H5', '#####'], ['H6', '######'],
] as const) {
  test(`applies ${level}`, async ({ page }) => {
    await selectWord(page, 'bold');
    await page.getByRole('button', { name: 'Heading' }).click();
    await page.getByRole('menuitem', { name: level, exact: true }).click();
    await expect(page.locator('.cm-content')).toContainText(`${hashes} make this bold please`);
  });
}

test('adds a link from the dialog', async ({ page }) => {
  await selectWord(page, 'bold');
  await page.getByRole('button', { name: 'Link' }).click();
  await page.getByLabel('Address').fill('https://example.com');
  await page.getByRole('button', { name: 'Add link' }).click();
  await expect(page.locator('.cm-content')).toContainText('[bold](https://example.com)');
});

test('inserts a table of the chosen size', async ({ page }) => {
  await selectWord(page, 'bold');
  await page.getByRole('button', { name: 'Table' }).click();
  await page.getByLabel('Rows').fill('2');
  await page.getByLabel('Columns').fill('2');
  await page.getByRole('button', { name: 'Insert table' }).click();
  await expect(page.locator('.preview table')).toBeVisible();
  await expect(page.locator('.preview tbody tr')).toHaveCount(2);
});
