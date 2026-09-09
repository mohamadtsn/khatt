import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const css = readFileSync('src/app/globals.css', 'utf8');

describe('design tokens', () => {
  it('defines every semantic token components are allowed to use', () => {
    for (const token of [
      '--color-canvas', '--color-surface', '--color-surface-raised', '--color-border',
      '--color-border-strong', '--color-text-primary', '--color-text-secondary',
      '--color-text-tertiary', '--color-accent', '--color-accent-text', '--color-danger',
      '--color-selection', '--shadow-raised', '--shadow-overlay',
      '--radius-sm', '--radius-md', '--radius-lg', '--radius-xl',
      '--ease-spring', '--dur-fast', '--dur-base', '--dur-slow',
    ]) {
      expect(css, `missing ${token}`).toContain(token);
    }
  });

  it('gives every semantic colour an unconditional definition on bare :root', () => {
    const base = css.slice(css.indexOf(':root {'), css.indexOf('@media (prefers-color-scheme: dark)'));
    for (const token of [
      '--color-canvas', '--color-surface', '--color-text-primary', '--color-accent',
      '--color-selection', '--shadow-raised', '--shadow-overlay',
    ]) {
      expect(base, `${token} is only defined inside a theme block`).toContain(token);
    }
  });

  it('redefines the palette for dark in both the attribute and the media query', () => {
    expect(css).toContain('[data-theme="dark"]'.replace(/"/g, "'"));
    expect(css).toContain('prefers-color-scheme: dark');
  });

  it('honours reduced motion without removing feedback entirely', () => {
    expect(css).toContain('prefers-reduced-motion: reduce');
    expect(css).not.toMatch(/prefers-reduced-motion[\s\S]{0,400}animation:\s*none/);
  });

  it('never animates a compositing-expensive property', () => {
    expect(css).not.toMatch(/transition:[^;]*backdrop-filter/);
    expect(css).not.toMatch(/transition:[^;]*\b(width|height)\b/);
  });
});
