import { visit } from 'unist-util-visit';
import { toString } from 'hast-util-to-string';
import type { Root, Element } from 'hast';

/* remark-gfm renders task checkboxes disabled, but ticking one in the preview is
   how a task is completed here, so they stay interactive — the same choice the
   legacy renderer made. The label is the item's own text, because an unlabelled
   checkbox announces nothing. */
export function rehypeTaskList() {
  return (tree: Root) => {
    visit(tree, 'element', (node, _index, parent) => {
      if (node.tagName !== 'input') return;
      if (node.properties?.['type'] !== 'checkbox') return;
      if (!parent || parent.type !== 'element' || parent.tagName !== 'li') return;

      delete node.properties['disabled'];
      node.properties['aria-label'] = toString(parent).replace(/\s+/g, ' ').trim();

      parent.properties = {
        ...parent.properties,
        className: [...classesOf(parent), 'task-item'],
      };
    });

    visit(tree, 'element', (node) => {
      if (node.tagName !== 'ul' && node.tagName !== 'ol') return;
      const hasTask = node.children.some(
        (c) => c.type === 'element' && classesOf(c).includes('task-item')
      );
      if (!hasTask) return;
      node.properties = { ...node.properties, className: [...classesOf(node), 'task-list'] };
    });
  };
}

function classesOf(el: Element): string[] {
  const c: unknown = el.properties?.['className'];
  if (Array.isArray(c)) return c.map(String);
  return typeof c === 'string' ? c.split(' ') : [];
}
