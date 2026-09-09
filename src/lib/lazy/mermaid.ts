let mermaid: Promise<typeof import('mermaid')> | null = null;
let counter = 0;

async function ensureMermaid(dark: boolean) {
  mermaid ??= import('mermaid');
  const { default: m } = await mermaid;
  m.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: dark ? 'dark' : 'default',
    fontFamily: 'var(--font-ui)',
  });
  return m;
}

/* `data-rendered` carries the theme, so a theme flip re-renders every diagram
   exactly once and an unrelated edit re-renders none. That is the whole
   re-theming mechanism; there is no separate rethemeMermaid(). */
export async function renderMermaidIn(root: HTMLElement, dark: boolean): Promise<void> {
  const wanted = dark ? 'dark' : 'light';
  const blocks = [...root.querySelectorAll<HTMLElement>('.mermaid-block')].filter(
    (b) => b.dataset['rendered'] !== wanted
  );
  if (blocks.length === 0) return;
  const m = await ensureMermaid(dark);
  for (const block of blocks) {
    const source = block.dataset['mmd'] ?? '';
    try {
      const { svg } = await m.render(`mmd-${++counter}`, source);
      block.innerHTML = svg;
      block.classList.remove('mermaid-error');
    } catch {
      block.textContent = source;
      block.classList.add('mermaid-error');
    }
    block.dataset['rendered'] = wanted;
  }
}
