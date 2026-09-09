import { describe, it, expect } from 'vitest';
import { parse } from '@/lib/markdown/parse';

describe('front matter', () => {
  const doc = '---\ntitle: Hello\ntags: [a, b]\n---\n\n# After\n';

  it('renders the block as an inert panel carrying its source', () => {
    const html = parse(doc);
    expect(html).toContain('class="front-matter"');
    expect(html).toContain('contenteditable="false"');
    // The newline stays literal in the attribute, as it did in the legacy output;
    // the DOM preserves it, so the round trip reads back exactly this source.
    expect(html).toContain('data-fm="title: Hello\ntags: [a, b]"');
  });

  it('still renders the body after it', () => {
    expect(parse(doc)).toContain('<h1>After</h1>');
  });

  it('leaves a thematic break alone when it is not front matter', () => {
    const html = parse('text\n\n---\n\nmore\n');
    expect(html).toContain('<hr>');
    expect(html).not.toContain('front-matter');
  });
});
