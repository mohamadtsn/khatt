import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeRemark from 'rehype-remark';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import { toString } from 'hast-util-to-string';
import { visit } from 'unist-util-visit';
import type { Element, Root as HastRoot } from 'hast';

/* Mirrors parse.ts. Every option here exists because the parser accepts that
   spelling; changing one without changing the other is what makes editing a
   single word reformat the entire document. */
const STRINGIFY_OPTIONS = {
  bullet: '-',
  rule: '-',
  emphasis: '*',
  strong: '*',
  listItemIndent: 'one',
  fences: true,
  resourceLink: false,
  tightDefinitions: true,
} as const;

const classesOf = (el: Element): string[] => {
  const c: unknown = el.properties?.['className'];
  if (Array.isArray(c)) return c.map(String);
  return typeof c === 'string' ? c.split(' ') : [];
};

/* hast camel-cases data-* attributes when it parses HTML (`data-fm` becomes
   `dataFm`), while the writer side sets the literal name. Accept both so the
   handlers work on a tree from either direction. */
const camel = (name: string): string =>
  name.replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase());

const attr = (el: Element, name: string): string | undefined => {
  const v = el.properties?.[name] ?? el.properties?.[camel(name)];
  return typeof v === 'string' ? v : undefined;
};

/* hast-util-to-mdast collapses insignificant whitespace before any handler sees
   the tree, which erases a code span whose content is only whitespace (`` ` ` ``).
   Such a span is swapped for a sentinel carrying its character codes and restored
   after serialization, so it survives instead of silently disappearing. */
const BLANK_CODE_OPEN = '\uE000';
const BLANK_CODE_CLOSE = '\uE001';

function rehypeProtectBlankCode() {
  return (tree: HastRoot) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'code' || !parent || index === undefined) return;
      const value = toString(node);
      if (value === '' || value.trim() !== '') return;
      const codes = [...value].map((c) => c.codePointAt(0)).join('.');
      parent.children[index] = {
        type: 'text',
        value: `${BLANK_CODE_OPEN}${codes}${BLANK_CODE_CLOSE}`,
      };
      return;
    });
  };
}

function restoreBlankCode(markdown: string): string {
  const pattern = new RegExp(`${BLANK_CODE_OPEN}([\\d.]*)${BLANK_CODE_CLOSE}`, 'g');
  return markdown.replace(pattern, (_m, codes: string) => {
    const value = codes
      .split('.')
      .map((c) => String.fromCodePoint(Number(c)))
      .join('');
    return `\`${value}\``;
  });
}

/* Inline math has no mdast node of its own, so it travels as inline code with a
   sentinel and is unwrapped after serialization. */
const TEX_SENTINEL = '__TEX__';

type State = { all: (node: Element) => unknown[] };

/* Generated blocks are contenteditable="false" in the preview, so the user never
   edits their rendered form. Their markdown source rides along in a data-*
   attribute; these handlers put it back verbatim rather than trying to reverse
   an SVG or a KaTeX tree. */
const handlers = {
  pre(_state: State, node: Element) {
    const fm = attr(node, 'data-fm');
    if (fm !== undefined) return { type: 'html', value: `---\n${fm}\n---` };
    const code = node.children.find(
      (c): c is Element => c.type === 'element' && c.tagName === 'code'
    );
    const lang = code ? attr(code, 'data-lang') : undefined;
    const value = code ? toString(code).replace(/\n$/, '') : toString(node);
    return { type: 'code', lang: lang ?? null, value };
  },
  /* The default handler trims an inline code span, which loses a span whose
     content is exactly a space (`` ` ` ``) and breaks the fixed point. */
  code(_state: State, node: Element) {
    return { type: 'inlineCode', value: toString(node) };
  },
  div(state: State, node: Element) {
    const mmd = attr(node, 'data-mmd');
    if (mmd !== undefined) return { type: 'code', lang: 'mermaid', value: mmd };
    const tex = attr(node, 'data-tex');
    if (tex !== undefined) return { type: 'html', value: `$$\n${tex}\n$$` };
    return { type: 'root', children: state.all(node) };
  },
  span(state: State, node: Element) {
    const tex = attr(node, 'data-tex');
    if (tex !== undefined) {
      return { type: 'inlineCode', value: `${TEX_SENTINEL}${tex}${TEX_SENTINEL}` };
    }
    return { type: 'root', children: state.all(node) };
  },
  sup(_state: State, node: Element) {
    const label = attr(node, 'data-fn');
    if (label === undefined) return { type: 'html', value: `<sup>${toString(node)}</sup>` };
    return { type: 'footnoteReference', identifier: label, label };
  },
  section(state: State, node: Element) {
    if (!classesOf(node).includes('footnotes')) return { type: 'root', children: state.all(node) };
    const definitions: unknown[] = [];
    const walk = (el: Element) => {
      if (el.tagName === 'li') {
        const label = attr(el, 'data-fn');
        const source = attr(el, 'data-fn-src');
        if (label !== undefined && source !== undefined) {
          definitions.push({
            type: 'footnoteDefinition',
            identifier: label,
            label,
            children: [{ type: 'paragraph', children: [{ type: 'text', value: source }] }],
          });
        }
      }
      for (const child of el.children) if (child.type === 'element') walk(child);
    };
    walk(node);
    return { type: 'root', children: definitions };
  },
  hr(_state: State, node: Element) {
    // The rule above the footnote list is generated, not authored: dropping it
    // keeps it from accumulating one --- per round trip.
    return classesOf(node).includes('fn-sep') ? undefined : { type: 'thematicBreak' };
  },
} as const;

export function stringify(html: string): string {
  const out = String(
    unified()
      .use(rehypeParse, { fragment: true })
      .use(rehypeProtectBlankCode)
      .use(rehypeRemark, { handlers: handlers as never })
      .use(remarkGfm)
      .use(remarkStringify, STRINGIFY_OPTIONS)
      .processSync(html)
  );
  // Inline math had to travel as inline code to survive mdast; unwrap it here.
  const unwrap = new RegExp('`' + TEX_SENTINEL + '([\\s\\S]*?)' + TEX_SENTINEL + '`', 'g');
  return restoreBlankCode(out.replace(unwrap, (_m, tex: string) => `$${tex}$`));
}
