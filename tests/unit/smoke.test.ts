import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

describe('scaffold', () => {
  it('configures a static export', () => {
    const config = readFileSync('next.config.ts', 'utf8');
    expect(config).toContain("output: 'export'");
  });

  it('keeps the legacy build in place as the parity reference', () => {
    expect(() => readFileSync('app.js', 'utf8')).not.toThrow();
  });
});
