import { describe, it, expect } from 'vitest';
import { continuationFor } from '@/components/editor/extensions/smart-lists';

describe('continuationFor', () => {
  it('continues a bullet', () => {
    expect(continuationFor('- item')).toBe('- ');
    expect(continuationFor('* item')).toBe('* ');
    expect(continuationFor('+ item')).toBe('+ ');
  });

  it('preserves indentation', () => {
    expect(continuationFor('    - nested')).toBe('    - ');
  });

  it('increments an ordered item', () => {
    expect(continuationFor('1. first')).toBe('2. ');
    expect(continuationFor('  9. ninth')).toBe('  10. ');
  });

  it('keeps a ")" delimiter as written', () => {
    expect(continuationFor('1) first')).toBe('2) ');
  });

  it('continues a checkbox unticked, whatever the source was', () => {
    expect(continuationFor('- [ ] todo')).toBe('- [ ] ');
    expect(continuationFor('- [x] done')).toBe('- [ ] ');
  });

  it('ends the list on an empty item', () => {
    expect(continuationFor('- ')).toBe('');
    expect(continuationFor('1. ')).toBe('');
    expect(continuationFor('- [ ] ')).toBe('');
  });

  it('returns null for a line that is not a list item', () => {
    expect(continuationFor('plain text')).toBeNull();
    expect(continuationFor('# heading')).toBeNull();
    expect(continuationFor('')).toBeNull();
  });
});
