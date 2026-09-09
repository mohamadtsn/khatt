import { describe, it, expect } from 'vitest';
import { buildStandaloneHtml } from '@/lib/export/html';

const doc = { id: 'a', name: 'notes.md', content: '# Hi', dir: 'ltr' as const };

describe('buildStandaloneHtml', () => {
  it('is a complete document with the title from the filename', () => {
    const html = buildStandaloneHtml(doc, '<h1>Hi</h1>', 'body{color:red}');
    expect(html).toMatch(/^<!doctype html>/i);
    expect(html).toContain('<title>notes</title>');
    expect(html).toContain('<h1>Hi</h1>');
  });

  it('inlines the stylesheet so the file stands alone', () => {
    const html = buildStandaloneHtml(doc, '<h1>Hi</h1>', 'body{color:red}');
    expect(html).toContain('<style>body{color:red}</style>');
    expect(html).not.toContain('<link');
    expect(html).not.toContain('src="http');
  });

  it('carries the document direction', () => {
    const rtl = { ...doc, dir: 'rtl' as const };
    expect(buildStandaloneHtml(rtl, '', '')).toContain('dir="rtl"');
  });

  it('escapes a filename that contains markup', () => {
    const nasty = { ...doc, name: '<script>x</script>.md' };
    expect(buildStandaloneHtml(nasty, '', '')).not.toContain('<script>x');
  });
});
