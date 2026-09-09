import { visit } from 'unist-util-visit';
import { toString } from 'hast-util-to-string';
import type { Root, Element, ElementContent } from 'hast';

const isElement = (n: ElementContent): n is Element => n.type === 'element';

const classesOf = (el: Element): string[] => {
  const c: unknown = el.properties?.['className'];
  if (Array.isArray(c)) return c.map(String);
  return typeof c === 'string' ? c.split(' ') : [];
};

const DEF_ID_PREFIX = 'user-content-fn-';
const REF_PREFIX = '#user-content-fn-';
const BACKREF_PREFIX = '#user-content-fnref-';

/* Runs BEFORE sanitize. The definition list items are keyed only by an id, and
   the schema strips every id that came from the document, so the label has to be
   moved onto an allowed attribute first or rehypeFootnotes cannot find it. */
export function rehypeFootnoteLabels() {
  return (tree: Root) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'li') return;
      const id = node.properties?.['id'];
      if (typeof id !== 'string' || !id.startsWith(DEF_ID_PREFIX)) return;
      node.properties['data-fn'] = decodeURIComponent(id.slice(DEF_ID_PREFIX.length));
    });
  };
}

/* remark-gfm emits ids like `user-content-fn-<label>` and a
   <section class="footnotes"> at the end. Reshape both into the legacy spelling
   so styling, back-links and the return path all keep working, and number by
   first use rather than by definition order. This plugin runs after sanitize
   because it is the only code permitted to introduce an id. */
export function rehypeFootnotes() {
  return (tree: Root) => {
    const numbers = new Map<string, number>();
    const seen = new Set<string>();

    // Pass 1: renumber the references. Definition order is not use order, and the
    // legacy renderer numbered by first use, so the map is built here.
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'a') return;
      const href = node.properties?.['href'];
      if (typeof href !== 'string' || !href.startsWith(REF_PREFIX)) return;
      const label = decodeURIComponent(href.slice(REF_PREFIX.length));
      let n = numbers.get(label);
      if (n === undefined) {
        n = numbers.size + 1;
        numbers.set(label, n);
      }
      node.properties = { href: `#fn-${n}` };
      node.children = [{ type: 'text', value: String(n) }];
    });

    // Pass 2: give the wrapping <sup> the legacy class, label and anchor id. Only
    // the first use of a label gets an id — that is what the back-link targets.
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'sup') return;
      const link = node.children.find(isElement);
      const href = link?.properties?.['href'];
      if (typeof href !== 'string' || !href.startsWith('#fn-')) return;
      const n = Number(href.slice(4));
      const label = [...numbers].find(([, v]) => v === n)?.[0] ?? '';
      const first = !seen.has(label);
      seen.add(label);
      node.properties = {
        className: ['fn-ref'],
        'data-fn': label,
        ...(first ? { id: `fnref-${n}` } : {}),
      };
    });

    // Pass 3: reshape the generated list, and precede it with the separator rule
    // the legacy stylesheet expects.
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'section' || !classesOf(node).includes('footnotes')) return;
      node.properties = { className: ['footnotes'], contentEditable: 'false' };

      visit(node, 'element', (li) => {
        if (li.tagName !== 'li') return;
        const label = li.properties?.['data-fn'];
        if (typeof label !== 'string') return;
        const n = numbers.get(label);
        if (n === undefined) {
          li.properties = {};
          return;
        }
        reshapeBackrefs(li, n);
        li.properties = {
          id: `fn-${n}`,
          'data-fn': label,
          // The source is what the return path re-emits, so it excludes the
          // generated back-link and folds the definition onto one line.
          'data-fn-src': sourceOf(li),
        };
      });

      if (parent && index !== undefined) {
        parent.children.splice(index, 0, {
          type: 'element',
          tagName: 'hr',
          properties: { className: ['fn-sep'] },
          children: [],
        });
        // The section has shifted one place right; resume past both nodes, or the
        // traversal would find this same section again and insert forever.
        return index + 2;
      }
      return;
    });
  };
}

/* GFM appends one back-link per use of a label. Only the first use carries an
   anchor id, so the extras would point nowhere — keep the first, drop the rest. */
function reshapeBackrefs(li: Element, n: number): void {
  let kept = false;
  visit(li, 'element', (el, index, parent) => {
    if (el.tagName !== 'a') return;
    const href = el.properties?.['href'];
    if (typeof href !== 'string' || !href.startsWith(BACKREF_PREFIX)) return;
    if (kept) {
      if (parent && index !== undefined) parent.children.splice(index, 1);
      return index;
    }
    kept = true;
    el.properties = {
      className: ['fn-back'],
      href: `#fnref-${n}`,
      'aria-label': `Back to reference ${n}`,
    };
    el.children = [{ type: 'text', value: '↩' }];
    return;
  });
}

function sourceOf(li: Element): string {
  const withoutBackrefs: Element = {
    ...li,
    children: stripBackrefs(li.children),
  };
  return toString(withoutBackrefs).replace(/\s+/g, ' ').trim();
}

function stripBackrefs(children: ElementContent[]): ElementContent[] {
  return children
    .filter((c) => !(isElement(c) && classesOf(c).includes('fn-back')))
    .map((c) => (isElement(c) ? { ...c, children: stripBackrefs(c.children) } : c));
}
