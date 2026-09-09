import type { Doc } from '@/lib/storage/workspace';

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The filename without its extension, which is what a reader sees as the title. */
const titleOf = (name: string): string => name.replace(/\.(md|markdown|txt)$/i, '');

/* One file that opens anywhere, with no network at all: the stylesheet is inlined
   and nothing is referenced by URL. That is the point of the export — a file that
   needs this app to read it is not an export. */
export function buildStandaloneHtml(doc: Doc, renderedHtml: string, css: string): string {
  return `<!doctype html>
<html lang="en" dir="${doc.dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(titleOf(doc.name))}</title>
<style>${css}</style>
</head>
<body>
<article class="preview">${renderedHtml}</article>
</body>
</html>
`;
}
