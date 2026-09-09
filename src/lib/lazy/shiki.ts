import type { Highlighter } from 'shiki';

let highlighter: Promise<Highlighter> | null = null;

const LANGS = [
  'js', 'ts', 'jsx', 'tsx', 'json', 'html', 'css', 'python', 'bash',
  'go', 'rust', 'sql', 'yaml', 'markdown', 'java', 'c', 'cpp', 'php',
];

/* Loaded on first use and never again. A document with no fenced code costs zero
   bytes here — that is a stated property of this app, not an optimisation. */
export function ensureShiki(): Promise<Highlighter> {
  highlighter ??= import('shiki').then((shiki) =>
    shiki.createHighlighter({ themes: ['github-light', 'github-dark'], langs: LANGS })
  );
  return highlighter;
}

export async function highlightIn(root: HTMLElement, dark: boolean): Promise<void> {
  const wanted = dark ? 'dark' : 'light';
  const blocks = [...root.querySelectorAll<HTMLElement>('code[data-lang]')].filter(
    (b) => b.dataset['hl'] !== wanted && b.dataset['hl'] !== 'skipped'
  );
  if (blocks.length === 0) return;
  const shiki = await ensureShiki();
  const loaded = new Set(shiki.getLoadedLanguages());
  for (const block of blocks) {
    const lang = block.dataset['lang'] ?? '';
    if (!loaded.has(lang)) {
      block.dataset['hl'] = 'skipped';
      continue;
    }
    const html = shiki.codeToHtml(block.textContent ?? '', {
      lang,
      theme: dark ? 'github-dark' : 'github-light',
    });
    // codeToHtml returns <pre><code>…</code></pre>; graft only the inner code.
    const parsed = new DOMParser().parseFromString(html, 'text/html');
    const inner = parsed.querySelector('code');
    if (inner) block.innerHTML = inner.innerHTML;
    block.dataset['hl'] = wanted;
  }
}
