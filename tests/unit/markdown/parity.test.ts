import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parse } from '@/lib/markdown/parse';
import { loadFixtures } from '../helpers/fixtures';
import { structureOf } from '../helpers/normalize';

const divergences = readFileSync('tests/golden/DIVERGENCES.md', 'utf8');

describe('parity with the legacy renderer', () => {
  for (const fixture of loadFixtures()) {
    it(`${fixture.name}: every element the legacy renderer produced still appears`, () => {
      const legacy = new Set(structureOf(fixture.golden));
      const next = new Set(structureOf(parse(fixture.markdown)));
      const missing = [...legacy].filter((tag) => !next.has(tag));
      const undocumented = missing.filter(
        (tag) => !divergences.includes(`${fixture.name}: ${tag}`)
      );
      expect(undocumented).toEqual([]);
    });
  }
});
