/* The exported file must carry the styles the reader needs, so they are read out
   of the live document rather than re-derived: whatever is on the page — the
   app's own sheet plus KaTeX's, if the document loaded it — is what gets inlined.
   Cross-origin sheets are unreadable and there are none by design. */
export function collectCss(): string {
  const parts: string[] = [];
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) parts.push(rule.cssText);
    } catch {
      /* An unreadable sheet would have to be cross-origin, which this app never
         loads; skipping it is correct rather than merely defensive. */
    }
  }
  /* The export has no theme switch, so the palette is pinned to light: the tokens
     the preview reads must resolve in a bare document. */
  const root = getComputedStyle(document.documentElement);
  const tokens = [
    '--color-canvas', '--color-surface', '--color-border', '--color-border-strong',
    '--color-text-primary', '--color-text-secondary', '--color-text-tertiary',
    '--color-accent', '--color-accent-text', '--color-highlight', '--color-selection',
    '--radius-sm', '--radius-md', '--radius-lg', '--radius-xl',
    '--font-ui', '--font-mono',
  ]
    .map((name) => `${name}:${root.getPropertyValue(name).trim()}`)
    .join(';');

  return `${parts.join('\n')}\n:root{${tokens}}\nbody{margin:0;padding:2rem 1rem;font-family:var(--font-ui);background:#fff;color:#111}`;
}
