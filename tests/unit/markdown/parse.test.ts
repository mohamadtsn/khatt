import { describe, it, expect } from 'vitest';
import { parse } from '@/lib/markdown/parse';

describe('parse', () => {
  it('renders emphasis, strong and strikethrough', () => {
    expect(parse('**b** *i* ~~s~~')).toContain('<strong>b</strong>');
    expect(parse('**b** *i* ~~s~~')).toContain('<em>i</em>');
    expect(parse('**b** *i* ~~s~~')).toContain('<del>s</del>');
  });

  it('renders a table with column alignment', () => {
    const html = parse('| a | b |\n| :--- | ---: |\n| 1 | 2 |');
    expect(html).toContain('<table>');
    expect(html).toContain('align="left"');
    expect(html).toContain('align="right"');
  });

  /* The boxes stay interactive: ticking one in the preview is how a task is
     completed, and the legacy renderer emitted them the same way. */
  it('renders task list items as labelled, interactive checkboxes', () => {
    const html = parse('- [ ] todo\n- [x] done');
    expect(html).toContain('type="checkbox"');
    expect(html).not.toContain('disabled');
    expect(html).toContain('checked');
    expect(html).toContain('aria-label="todo"');
    expect(html).toMatch(/<ul class="[^"]*\btask-list\b/);
    expect(html).toContain('task-item');
  });

  it('autolinks a bare URL', () => {
    expect(parse('see https://example.com now')).toContain('href="https://example.com"');
  });

  it('resolves a reference link case-insensitively', () => {
    const html = parse('[t][DOCS]\n\n[docs]: https://example.com');
    expect(html).toContain('href="https://example.com"');
  });

  it('keeps allowed raw HTML and drops the rest', () => {
    expect(parse('<kbd>Ctrl</kbd>')).toContain('<kbd>Ctrl</kbd>');
    expect(parse('<script>alert(1)</script>')).not.toContain('alert(1)');
    expect(parse('<img src="x" onerror="alert(1)">')).not.toContain('onerror');
  });

  it('neutralizes unsafe schemes but keeps inline images', () => {
    expect(parse('[c](javascript:alert(1))')).not.toContain('javascript:');
    expect(parse('![i](data:image/png;base64,iVBORw0KGgo=)')).toContain('data:image/png');
    expect(parse('![x](data:text/html,<script>alert(1)</script>)')).not.toContain('data:text/html');
  });

  it('opens outward links in a new tab but leaves fragment links alone', () => {
    const html = parse('[x](https://example.com) and [y](#fn-1)');
    expect(html).toContain('href="https://example.com" target="_blank" rel="noopener noreferrer"');
    expect(html).toContain('<a href="#fn-1">y</a>');
  });

  it('never emits an id from document content', () => {
    expect(parse('<div id="editor">x</div>')).not.toContain('id="editor"');
  });
});
