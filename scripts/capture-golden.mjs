import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';

// Section 1 (renderer + sanitizer) is self-contained: it starts at escapeHtml and
// ends where the section 2 banner begins. Both searches start from the body, not
// the top of the file, because the table of contents repeats every banner text.
const SECTION_2_BANNER = '   2. UI helpers';

const source = readFileSync('app.js', 'utf8');
const bodyStart = source.indexOf('function escapeHtml');
if (bodyStart === -1) throw new Error('could not find escapeHtml in app.js');

const banner = source.indexOf(SECTION_2_BANNER, bodyStart);
if (banner === -1) throw new Error('could not find the section 2 banner in app.js');

// The banner text sits inside a block comment; cut at the comment opener so the
// slice is not left with an unterminated comment.
const cut = source.lastIndexOf('/* =', banner);
const section1 = source.slice(bodyStart, cut);
const dom = new JSDOM('');
const factory = new Function(
  'DOMParser',
  `${section1}\n;return { render, sanitize };`
);
const { render, sanitize } = factory(dom.window.DOMParser);

mkdirSync('tests/golden', { recursive: true });
for (const file of readdirSync('tests/fixtures').filter((f) => f.endsWith('.md'))) {
  const markdown = readFileSync(join('tests/fixtures', file), 'utf8');
  const html = sanitize(render(markdown));
  writeFileSync(join('tests/golden', file.replace(/\.md$/, '.html')), html + '\n');
  console.log('captured', file);
}
