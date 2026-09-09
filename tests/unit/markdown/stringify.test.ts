import { describe, it, expect } from 'vitest';
import { stringify } from '@/lib/markdown/stringify';

describe('stringify', () => {
  it('uses the spellings the parser round-trips', () => {
    expect(stringify('<p><strong>b</strong></p>')).toBe('**b**\n');
    expect(stringify('<p><em>i</em></p>')).toBe('*i*\n');
    expect(stringify('<p><del>s</del></p>')).toBe('~~s~~\n');
    expect(stringify('<hr>')).toBe('---\n');
  });

  it('writes bullets as "- " with two-space nesting', () => {
    const html = '<ul><li>a<ul><li>b</li></ul></li></ul>';
    expect(stringify(html)).toBe('- a\n  - b\n');
  });

  it('writes task list items back as checkboxes', () => {
    const html =
      '<ul><li><input type="checkbox" disabled> a</li>' +
      '<li><input type="checkbox" disabled checked> b</li></ul>';
    expect(stringify(html)).toBe('- [ ] a\n- [x] b\n');
  });

  it('restores front matter from data-fm', () => {
    const html = '<pre class="front-matter" data-fm="title: Hello">title: Hello</pre>';
    expect(stringify(html)).toBe('---\ntitle: Hello\n---\n');
  });

  it('restores a mermaid fence from data-mmd', () => {
    const html = '<div class="mermaid-block" data-mmd="graph TD;">rendered svg here</div>';
    expect(stringify(html)).toBe('```mermaid\ngraph TD;\n```\n');
  });

  it('restores math from data-tex', () => {
    expect(stringify('<p><span class="math-inline" data-tex="x^2">rendered</span></p>')).toBe('$x^2$\n');
    expect(stringify('<div class="math-block" data-tex="x^2"><code>x^2</code></div>')).toBe('$$\nx^2\n$$\n');
  });

  it('restores footnotes from data-fn and data-fn-src', () => {
    const html =
      '<p>One<sup class="fn-ref" data-fn="a"><a href="#fn-1">1</a></sup>.</p>' +
      '<hr class="fn-sep">' +
      '<section class="footnotes"><ol><li data-fn="a" data-fn-src="First.">x</li></ol></section>';
    expect(stringify(html)).toBe('One[^a].\n\n[^a]: First.\n');
  });

  it('keeps a fence language', () => {
    const html = '<pre><code data-lang="js">const x = 1;\n</code></pre>';
    expect(stringify(html)).toBe('```js\nconst x = 1;\n```\n');
  });
});
