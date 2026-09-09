import { visit } from 'unist-util-visit';
import type { Root, Element } from 'hast';
import type { Root as MdastRoot } from 'mdast';
import type { VFile } from 'vfile';

/* remark-frontmatter parses the leading --- … --- block into a `yaml` node, and
   remark-rehype drops it. Re-add it as a locked panel: data-fm carries the
   source verbatim so a preview edit round-trips it instead of losing it. */
export function rehypeFrontMatter() {
  return (tree: Root, file: VFile) => {
    const source = file.data['frontMatterSource'];
    if (typeof source !== 'string') return;
    const panel: Element = {
      type: 'element',
      tagName: 'pre',
      properties: {
        className: ['front-matter'],
        contentEditable: 'false',
        'data-fm': source,
      },
      children: [{ type: 'text', value: source }],
    };
    tree.children.unshift(panel);
  };
}

/* Runs on the mdast side, before remark-rehype discards the node. */
export function remarkCaptureFrontMatter() {
  return (tree: MdastRoot, file: VFile) => {
    visit(tree, 'yaml', (node) => {
      file.data['frontMatterSource'] = node.value;
    });
  };
}
