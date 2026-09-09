import { describe, it, expect } from 'vitest';
import { schema, FOOTNOTE_ANCHOR, DATA_IMAGE } from '@/lib/markdown/sanitize-schema';

describe('sanitize schema', () => {
  it('allows exactly the legacy tag set', () => {
    expect(schema.tagNames).toContain('details');
    expect(schema.tagNames).toContain('summary');
    expect(schema.tagNames).toContain('kbd');
    expect(schema.tagNames).toContain('input');
    expect(schema.tagNames).not.toContain('script');
    expect(schema.tagNames).not.toContain('style');
    expect(schema.tagNames).not.toContain('iframe');
    expect(schema.tagNames).toContain('section'); // needed by remark's footnote output
    // 54 legacy tags plus `section`.
    expect(schema.tagNames).toHaveLength(55);
  });

  it('carries the round-trip data attributes', () => {
    const global = schema.attributes?.['*'] ?? [];
    expect(global).toContain('data-mmd');
    expect(global).toContain('data-tex');
    expect(global).toContain('data-fm');
    expect(global).toContain('data-fn');
    expect(global).toContain('data-fn-src');
    expect(global).toContain('aria-label');
    expect(global).not.toContain('style');
    expect(global).not.toContain('id');
  });

  it('restricts href and src to safe schemes', () => {
    expect(schema.protocols?.href).toEqual(['http', 'https', 'mailto', 'tel']);
    // `data` is allowed at scheme level and narrowed to images by the src guard.
    expect(schema.protocols?.src).toEqual(['http', 'https', 'data']);
    expect(DATA_IMAGE.test('data:image/png;base64,iVBOR')).toBe(true);
    expect(DATA_IMAGE.test('data:text/html,<script>')).toBe(false);
  });

  it('matches only generated footnote ids', () => {
    expect(FOOTNOTE_ANCHOR.test('fn-1')).toBe(true);
    expect(FOOTNOTE_ANCHOR.test('fnref-12')).toBe(true);
    expect(FOOTNOTE_ANCHOR.test('editor')).toBe(false);
    expect(FOOTNOTE_ANCHOR.test('fn-')).toBe(false);
  });
});
