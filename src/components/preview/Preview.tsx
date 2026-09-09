'use client';
import { useEffect, useMemo, useRef } from 'react';
import { parse } from '@/lib/markdown/parse';
import { useActiveDoc } from '@/state/documents';
import { useUi } from '@/state/ui';
import { highlightIn } from '@/lib/lazy/shiki';
import { renderMathIn } from '@/lib/lazy/katex';
import { renderMermaidIn } from '@/lib/lazy/mermaid';
import { isDarkNow } from '@/lib/theme-state';
import { useReturnPath } from './useReturnPath';

export function Preview() {
  const host = useRef<HTMLDivElement>(null);
  const doc = useActiveDoc();
  const theme = useUi((s) => s.theme);
  const readingLocked = useUi((s) => s.readingLocked);
  useReturnPath(host);
  const content = doc?.content ?? '';
  const html = useMemo(() => parse(content), [content]);

  useEffect(() => {
    const root = host.current;
    // Re-rendering while the user is typing in here would destroy the caret.
    if (!root || root.dataset['editing'] === '1') return;
    root.innerHTML = html;
    const dark = isDarkNow();
    /* After the HTML is in the DOM, on purpose: these three inject trusted
       library output that the sanitizer in the pipeline would strip. */
    void highlightIn(root, dark);
    void renderMathIn(root);
    void renderMermaidIn(root, dark);
  }, [html, theme]);

  return (
    <div
      ref={host}
      className="preview h-full overflow-auto px-8 py-6"
      dir={doc?.dir ?? 'ltr'}
      contentEditable={!readingLocked}
      suppressContentEditableWarning
    />
  );
}
