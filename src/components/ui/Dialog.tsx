'use client';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { useFocusTrap } from './useFocusTrap';

export function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useFocusTrap(panel, open);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center p-4">
      {/* A modal task dims what it interrupts; a non-blocking panel would not. */}
      <div
        className="absolute inset-0 bg-[oklch(0_0_0/0.28)] transition-opacity duration-[var(--dur-base)]"
        onClick={onClose}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="material-overlay relative w-full max-w-sm scale-100 rounded-[var(--radius-xl)] p-5
                   transition-[opacity,transform] duration-[var(--dur-base)] ease-[var(--ease-spring)]"
      >
        <h2 id={titleId} className="mb-3 text-[15px] font-semibold tracking-[-0.01em]">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
