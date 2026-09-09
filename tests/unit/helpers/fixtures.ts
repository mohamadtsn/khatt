import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export interface Fixture {
  name: string;
  markdown: string;
  golden: string;
}

export function loadFixtures(): Fixture[] {
  return readdirSync('tests/fixtures')
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((f) => {
      const name = f.replace(/\.md$/, '');
      return {
        name,
        markdown: readFileSync(join('tests/fixtures', f), 'utf8'),
        golden: readFileSync(join('tests/golden', `${name}.html`), 'utf8').trimEnd(),
      };
    });
}
