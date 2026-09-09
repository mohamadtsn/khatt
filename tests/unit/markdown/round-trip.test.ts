import { describe, it, expect } from 'vitest';
import { parse } from '@/lib/markdown/parse';
import { stringify } from '@/lib/markdown/stringify';
import { loadFixtures } from '../helpers/fixtures';

/** Markdown -> HTML -> markdown must reach a fixed point after one pass.
    This is what stops a one-word preview edit from reformatting the file. */
describe('round trip is a fixed point', () => {
  for (const fixture of loadFixtures()) {
    it(fixture.name, () => {
      const once = stringify(parse(fixture.markdown));
      const twice = stringify(parse(once));
      expect(twice).toBe(once);
    });
  }
});
