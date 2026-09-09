import { visit } from 'unist-util-visit';
import { toString } from 'hast-util-to-string';
import type { Root, Element, ElementContent } from 'hast';

const isElement = (n: ElementContent): n is Element => n.type === 'element';

const classesOf = (el: Element): string[] => {
  const c: unknown = el.properties?.['className'];
  if (Array.isArray(c)) return c.map(String);
  return typeof c === 'string' ? c.split(' ') : [];
};

/* The three lazy renderers (mermaid, KaTeX, Shiki) run in the browser after this
   HTML is in the DOM. They find their work by these markers rather than by
   re-parsing, and the data-* attributes keep the original source so a preview
   edit can round-trip a block the user cannot type into. */
export function rehypeLazyBlocks() {
  return (tree: Root) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'pre' || !parent || index === undefined) return;
      const code = node.children.find(isElement);
      if (!code || code.tagName !== 'code') return;

      const language = classesOf(code)
        .find((c) => c.startsWith('language-'))
        ?.slice('language-'.length);
      if (!language) return;

      if (language === 'mermaid') {
        const source = toString(code).replace(/\n$/, '');
        parent.children[index] = {
          type: 'element',
          tagName: 'div',
          properties: {
            className: ['mermaid-block'],
            contentEditable: 'false',
            'data-mmd': source,
          },
          /* The fenced source stays visible in a <pre><code> until mermaid loads,
             so a diagram is still readable with the diagram renderer unavailable. */
          children: [
            {
              type: 'element',
              tagName: 'pre',
              properties: {},
              children: [
                { type: 'element', tagName: 'code', properties: {}, children: [{ type: 'text', value: source }] },
              ],
            },
          ],
        };
        return;
      }
      code.properties = { ...code.properties, 'data-lang': language };
      return;
    });

    /* remark-math renders math as <code class="language-math math-inline"> and
       <pre><code class="… math-display">. Reshape both into the legacy
       placeholders the KaTeX pass looks for, keeping the TeX in data-tex: that
       attribute, not the rendered markup, is the only editable form of a formula. */
    visit(tree, 'element', (node, index, parent) => {
      const classes = classesOf(node);
      const display = classes.includes('math-display');
      const inline = classes.includes('math-inline');
      if ((!display && !inline) || !parent || index === undefined) return;

      const raw = toString(node);

      /* "$5 and $10" is a price, not a formula. The legacy renderer required the
         delimited text to neither start nor end with whitespace, and micromark
         does not, so the guard lives here: unwrap back to literal text. */
      if (inline && /^\s|\s$/.test(raw)) {
        parent.children[index] = { type: 'text', value: `$${raw}$` };
        return;
      }

      const source = raw.trim();
      const replacement: Element = display
        ? {
            type: 'element',
            tagName: 'div',
            properties: {
              className: ['math-block'],
              contentEditable: 'false',
              'data-tex': source,
            },
            children: [
              { type: 'element', tagName: 'code', properties: {}, children: [{ type: 'text', value: source }] },
            ],
          }
        : {
            type: 'element',
            tagName: 'span',
            properties: { className: ['math-inline'], 'data-tex': source },
            children: [{ type: 'text', value: source }],
          };

      // Display math arrives wrapped in a <pre>; replace the wrapper, not the code.
      const target = display && parent.type === 'element' && parent.tagName === 'pre' ? null : parent;
      if (target) {
        target.children[index] = replacement;
      } else {
        Object.assign(parent, replacement);
      }
      return;
    });
  };
}
