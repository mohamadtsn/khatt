let katex: Promise<typeof import('katex')> | null = null;
let cssLoaded = false;

/* The stylesheet is imported next to the library rather than in globals.css, so
   a document with no math never downloads it. */
async function ensureKatex() {
  if (!cssLoaded) {
    await import('katex/dist/katex.min.css');
    cssLoaded = true;
  }
  katex ??= import('katex');
  return katex;
}

export async function renderMathIn(root: HTMLElement): Promise<void> {
  const nodes = [...root.querySelectorAll<HTMLElement>('[data-tex]:not([data-rendered])')];
  if (nodes.length === 0) return;
  const { default: k } = await ensureKatex();
  for (const node of nodes) {
    const tex = node.dataset['tex'] ?? '';
    try {
      k.render(tex, node, {
        displayMode: node.classList.contains('math-block'),
        throwOnError: false,
        output: 'html',
      });
    } catch {
      /* Leave the source visible rather than blanking the block: a typo in a
         formula should not make the surrounding text disappear. */
      node.textContent = tex;
      node.classList.add('math-error');
    }
    node.dataset['rendered'] = '1';
  }
}
