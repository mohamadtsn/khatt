import { describe, it, expect } from 'vitest';
import { loadFixtures } from './helpers/fixtures';

describe('golden corpus', () => {
  const fixtures = loadFixtures();

  it('captured every fixture', () => {
    expect(fixtures).toHaveLength(13);
    expect(fixtures.map((f) => f.name)).toContain('unsafe');
  });

  it('stripped every executable surface from the unsafe fixture', () => {
    const unsafe = fixtures.find((f) => f.name === 'unsafe');
    expect(unsafe).toBeDefined();
    const html = unsafe?.golden ?? '';
    // Escaped text may legitimately contain these words — what must not exist is
    // any of them inside a live tag, so every assertion is anchored to `<tag …`.
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/<[^>]*\son[a-z]+\s*=/i);
    expect(html).not.toMatch(/<[^>]*(?:href|src)\s*=\s*"(?:javascript|vbscript|data:text\/html)/i);
    expect(html).not.toMatch(/<[^>]*\sid\s*=/i);
    expect(html).toMatch(/src="data:image\/png/);
  });
});
