import type { Schema } from 'hast-util-sanitize';

/* An arbitrary id from a document could shadow one of the app's own elements in
   a later getElementById lookup, so only the ids the renderer generates survive. */
export const FOOTNOTE_ANCHOR = /^fn(ref)?-\d+$/;

/* The legacy sanitizer blocked javascript:, vbscript: and data: URLs but carved
   out data:image/ for src, so inline images keep working. hast-util-sanitize
   matches on scheme name alone, so `data` is allowed here and narrowed to images
   by the src guard the pipeline runs (see parse.ts). */
export const DATA_IMAGE = /^\s*data:image\//i;

/* Transcribed from the legacy ALLOWED_TAGS. `input` is here because task-list
   checkboxes are real inputs; `disabled` and `checked` keep them inert.
   `section` is the one addition: remark's footnote output wraps in it. */
const TAG_NAMES = [
  'a', 'abbr', 'b', 'blockquote', 'br', 'caption', 'code', 'dd', 'del',
  'details', 'div', 'dl', 'dt', 'em', 'figcaption', 'figure', 'h1', 'h2', 'h3',
  'h4', 'h5', 'h6', 'hr', 'i', 'img', 'input', 'ins', 'kbd', 'li', 'mark', 'ol',
  'p', 'picture', 'pre', 'q', 's', 'samp', 'section', 'small', 'source', 'span',
  'strong', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'tfoot', 'th',
  'thead', 'tr', 'u', 'ul', 'var',
];

/* `id` is deliberately absent. Footnote anchors are the only generated ids, and
   the footnotes plugin reattaches them after sanitization, so a document can
   never inject an id that shadows one of the app's own elements.

   Names are hast property names, not HTML attribute names: hast-util-sanitize
   matches `className` / `colSpan` / `rowSpan` / `srcSet`, which serialize back to
   class / colspan / rowspan / srcset. */
const GLOBAL_ATTRIBUTES = [
  'align', 'alt', 'checked', 'className', 'colSpan', 'dir', 'disabled',
  'height', 'href', 'open', 'rel', 'rowSpan', 'span', 'src', 'srcSet', 'start',
  'target', 'title', 'type', 'width',
  'data-mmd',    // inert diagram source — carries no executable surface
  'data-tex',    // inert math source — same story
  'data-fm',     // inert front-matter source, for the round trip
  'data-fn',     // footnote label, for the round trip
  'data-fn-src', // footnote markdown source, for the round trip
  'data-lang',   // fence language, read by the lazy highlighter
  'contentEditable',
  'aria-label',
  'aria-hidden',
];

export const schema: Schema = {
  tagNames: TAG_NAMES,
  attributes: { '*': GLOBAL_ATTRIBUTES, a: ['href'], img: ['src'] },
  protocols: {
    href: ['http', 'https', 'mailto', 'tel'],
    src: ['http', 'https', 'data'],
  },
  clobberPrefix: '', // we police ids ourselves, see the note above
  strip: ['script', 'style'],
  allowComments: false,
};
