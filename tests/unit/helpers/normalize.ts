/** Collapses formatting-only differences so parity compares structure, not bytes. */
export function normalizeHtml(html: string): string {
  return html
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .replace(/\s+>/g, '>')
    .trim();
}

/** Element names and their nesting, ignoring attributes and text. */
export function structureOf(html: string): string[] {
  return [...html.matchAll(/<([a-z][a-z0-9]*)\b/gi)].map((m) => m[1]!.toLowerCase());
}
