import { describe, it, expect } from 'vitest';
import { parse } from '@/lib/markdown/parse';

describe('lazy blocks', () => {
  it('marks a mermaid fence and keeps its source', () => {
    const html = parse('```mermaid\ngraph TD;\n  A-->B;\n```');
    expect(html).toContain('class="mermaid-block"');
    expect(html).toContain('contenteditable="false"');
    expect(html).toContain('data-mmd="graph TD;\n  A-->B;"');
  });

  // The class names are the legacy ones the KaTeX pass and the stylesheet expect.
  it('marks inline and display math', () => {
    expect(parse('$x^2$')).toContain('<span class="math-inline" data-tex="x^2">');
    expect(parse('$$\nx^2\n$$')).toContain('<div class="math-block"');
    expect(parse('$$\nx^2\n$$')).toContain('data-tex="x^2"');
  });

  it('leaves the display wrapper out of the flow of a paragraph', () => {
    expect(parse('$$\nx^2\n$$')).not.toContain('<pre>');
  });

  it('does not treat a lone dollar sign as math', () => {
    const html = parse('Costs $5 and $10 today.');
    expect(html).not.toContain('data-tex');
    expect(html).toContain('Costs $5 and $10 today.');
  });

  it('tags a fence language for the highlighter', () => {
    expect(parse('```js\nconst x = 1;\n```')).toContain('data-lang="js"');
  });

  it('leaves an untagged fence without a language marker', () => {
    expect(parse('```\nplain\n```')).not.toContain('data-lang');
  });
});
