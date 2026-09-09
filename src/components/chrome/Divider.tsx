'use client';
import { useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { useUi } from '@/state/ui';
import { SPLIT_MIN, SPLIT_MAX } from '@/lib/storage/prefs';

const clamp = (n: number) => Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, n));

export function Divider() {
  const split = useUi((s) => s.split);
  const setSplit = useUi((s) => s.setSplit);
  const host = useRef<HTMLDivElement>(null);

  /* Pointer capture rather than window listeners alone: the drag then survives
     the pointer leaving the element. No easing here on purpose — a dragged thing
     must track the pointer exactly, and interpolation reads as lag. */
  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const parent = host.current?.parentElement;
    if (!parent) return;
    const rtl = getComputedStyle(parent).direction === 'rtl';

    const move = (e: PointerEvent) => {
      const rect = parent.getBoundingClientRect();
      const offset = rtl ? rect.right - e.clientX : e.clientX - rect.left;
      setSplit(clamp(Math.round((offset / rect.width) * 100)));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <div
      ref={host}
      role="separator"
      tabIndex={0}
      aria-label="Resize editor and preview panes"
      aria-orientation="vertical"
      aria-valuenow={split}
      aria-valuemin={SPLIT_MIN}
      aria-valuemax={SPLIT_MAX}
      onPointerDown={onPointerDown}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') setSplit(clamp(split - 2));
        if (e.key === 'ArrowRight') setSplit(clamp(split + 2));
      }}
      className="w-1 cursor-col-resize bg-[var(--color-border)] transition-colors
                 duration-[var(--dur-fast)] hover:bg-[var(--color-accent)]
                 focus-visible:bg-[var(--color-accent)]"
    />
  );
}
