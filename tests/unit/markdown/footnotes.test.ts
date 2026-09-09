import { describe, it, expect } from 'vitest';
import { parse } from '@/lib/markdown/parse';

const doc = 'One[^a] and again[^a] and two[^b].\n\n[^a]: First.\n[^b]: Second.\n';

describe('footnotes', () => {
  it('numbers by first use and links reference to definition', () => {
    const html = parse(doc);
    expect(html).toContain('id="fnref-1"');
    expect(html).toContain('href="#fn-1"');
    expect(html).toContain('id="fn-1"');
    expect(html).toContain('id="fn-2"');
  });

  it('gives only the first reference of a label an id', () => {
    const html = parse(doc);
    expect(html.match(/id="fnref-1"/g)).toHaveLength(1);
  });

  it('carries the label and markdown source for the round trip', () => {
    const html = parse(doc);
    expect(html).toContain('data-fn="a"');
    expect(html).toContain('data-fn-src="First."');
  });

  it('locks the generated list against direct editing', () => {
    expect(parse(doc)).toContain('class="footnotes" contenteditable="false"');
  });

  it('separates the list from the body with a rule', () => {
    expect(parse(doc)).toContain('<hr class="fn-sep">');
  });

  it('points the back-link at the first reference', () => {
    const html = parse(doc);
    expect(html).toContain('href="#fnref-1"');
    expect(html).toContain('class="fn-back"');
    expect(html).not.toContain('user-content-fnref');
  });

  it('folds a multi-line definition into one source line', () => {
    const html = parse('x[^a]\n\n[^a]: line one,\n    line two.\n');
    expect(html).toContain('data-fn-src="line one, line two."');
  });

  it('emits no footnote section when the document has none', () => {
    expect(parse('plain text')).not.toContain('footnotes');
  });

  it('drops a reference whose label was never defined', () => {
    expect(parse('text[^missing]')).not.toContain('fnref-');
  });
});
