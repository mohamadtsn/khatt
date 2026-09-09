'use client';
import { useActiveDoc } from '@/state/documents';

export function StatusBar() {
  const doc = useActiveDoc();
  const content = doc?.content ?? '';
  const words = content.trim() === '' ? 0 : content.trim().split(/\s+/).length;

  return (
    <footer className="material flex h-7 items-center justify-end gap-4 px-3 text-[12px] text-[var(--color-text-tertiary)]">
      <span data-testid="stat-words">{words} words</span>
      <span data-testid="stat-chars">{content.length} chars</span>
    </footer>
  );
}
