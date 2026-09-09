import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

describe('scaffold', () => {
  it('configures a static export', () => {
    const config = readFileSync('next.config.ts', 'utf8');
    expect(config).toContain("output: 'export'");
  });

  it('keeps the captured legacy baseline as the parity record', () => {
    // app.js is gone; what it produced is not. These files are the contract the
    // parity test still checks every render against.
    expect(() => readFileSync('tests/golden/basic.html', 'utf8')).not.toThrow();
    expect(() => readFileSync('tests/golden/DIVERGENCES.md', 'utf8')).not.toThrow();
  });
});
