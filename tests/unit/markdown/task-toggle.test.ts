import { describe, it, expect } from 'vitest';
import { toggleTask } from '@/lib/markdown/task-toggle';

describe('toggleTask', () => {
  const doc = '- [ ] a\n- [x] b\n  - [ ] c\n';

  it('ticks the nth box and touches nothing else', () => {
    expect(toggleTask(doc, 0, true)).toBe('- [x] a\n- [x] b\n  - [ ] c\n');
  });

  it('unticks', () => {
    expect(toggleTask(doc, 1, false)).toBe('- [ ] a\n- [ ] b\n  - [ ] c\n');
  });

  it('counts nested boxes in document order', () => {
    expect(toggleTask(doc, 2, true)).toBe('- [ ] a\n- [x] b\n  - [x] c\n');
  });

  it('ignores a checkbox written inside a code fence', () => {
    const fenced = '```\n- [ ] not a task\n```\n- [ ] real\n';
    expect(toggleTask(fenced, 0, true)).toBe('```\n- [ ] not a task\n```\n- [x] real\n');
  });

  it('returns the input unchanged when the index is out of range', () => {
    expect(toggleTask(doc, 9, true)).toBe(doc);
  });

  it('handles * and + markers', () => {
    expect(toggleTask('* [ ] a\n+ [ ] b\n', 1, true)).toBe('* [ ] a\n+ [x] b\n');
  });

  it('leaves an already-correct box byte-identical', () => {
    expect(toggleTask(doc, 1, true)).toBe(doc);
  });
});
