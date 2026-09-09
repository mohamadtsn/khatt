import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import remarkFrontmatter from 'remark-frontmatter';
import { remarkCaptureFrontMatter, rehypeFrontMatter } from './plugins/front-matter';
import { visit } from 'unist-util-visit';
import type { Root } from 'hast';
import { schema, DATA_IMAGE } from './sanitize-schema';

/* hast-util-sanitize allows or blocks a whole URL scheme, but the legacy
   sanitizer allowed `data:` for images only. This runs after sanitization and
   narrows what the schema had to let through. */
function rehypeDataImageOnly() {
  return (tree: Root) => {
    visit(tree, 'element', (node) => {
      const src = node.properties?.['src'];
      if (typeof src === 'string' && /^\s*data:/i.test(src) && !DATA_IMAGE.test(src)) {
        delete node.properties['src'];
      }
    });
  };
}

/* The legacy renderer opened every link in a new tab, but left fragment links
   (footnote refs and backrefs) alone so in-page navigation still works. */
function rehypeExternalLinks() {
  return (tree: Root) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'a') return;
      const href = node.properties?.['href'];
      if (typeof href !== 'string' || href.startsWith('#')) return;
      node.properties['target'] = '_blank';
      node.properties['rel'] = ['noopener', 'noreferrer']; // hast models rel as a token list
    });
  };
}

/* Built as a function rather than a module-level constant so later plugins have
   one place to slot in, and so a processor is never shared across a re-entrant
   render. */
export function pipeline() {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkFrontmatter, ['yaml'])
    .use(remarkCaptureFrontMatter)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeFrontMatter)
    .use(rehypeSanitize, schema)
    .use(rehypeDataImageOnly)
    .use(rehypeExternalLinks)
    .use(rehypeStringify, { allowDangerousHtml: false });
}

export function parse(markdown: string): string {
  return String(pipeline().processSync(markdown));
}
