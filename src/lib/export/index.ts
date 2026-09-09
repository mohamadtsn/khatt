import type { Doc } from '@/lib/storage/workspace';
import { buildStandaloneHtml } from './html';
import { collectCss } from './collect-css';
import { download } from './download';
import { renderMermaidIn } from '@/lib/lazy/mermaid';
import { isDarkNow } from '@/lib/theme-state';

const stem = (name: string): string => name.replace(/\.(md|markdown|txt)$/i, '');

export function downloadMarkdown(doc: Doc): void {
  download(`${stem(doc.name)}.md`, doc.content, 'text/markdown');
}

/* Diagrams are exported as the SVG that is on screen, so a dark-themed diagram
   would arrive as dark-on-white. Re-render light first, then restore. */
async function withLightDiagrams<T>(root: HTMLElement, fn: () => T): Promise<T> {
  const dark = isDarkNow();
  const hasDiagram = root.querySelector('.mermaid-block') !== null;
  if (dark && hasDiagram) await renderMermaidIn(root, false);
  try {
    return fn();
  } finally {
    if (dark && hasDiagram) await renderMermaidIn(root, true);
  }
}

export async function downloadHtml(doc: Doc, root: HTMLElement): Promise<void> {
  const html = await withLightDiagrams(root, () =>
    buildStandaloneHtml(doc, root.innerHTML, collectCss())
  );
  download(`${stem(doc.name)}.html`, html, 'text/html');
}

/* Through the browser's own print engine rather than a PDF library, so the text
   in the resulting file stays selectable and searchable. */
export function printPdf(): void {
  window.print();
}

export type CopyKind = 'markdown' | 'html' | 'text';

export async function copyAs(kind: CopyKind, doc: Doc, root: HTMLElement): Promise<void> {
  const text =
    kind === 'markdown' ? doc.content : kind === 'html' ? root.innerHTML : (root.innerText ?? '');

  if (kind === 'html' && typeof ClipboardItem !== 'undefined' && navigator.clipboard.write) {
    // Rich HTML keeps its formatting when pasted into a word processor.
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([text], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' }),
      }),
    ]);
    return;
  }
  await navigator.clipboard.writeText(text);
}
