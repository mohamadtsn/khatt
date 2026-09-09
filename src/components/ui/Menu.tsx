'use client';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useFocusTrap } from './useFocusTrap';

export function Menu({
  trigger,
  label,
  children,
  align = 'start',
}: {
  trigger: ReactNode;
  label: string;
  children: ReactNode;
  align?: 'start' | 'end';
}) {
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const id = useId();
  useFocusTrap(panel, open);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (panel.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  return (
    <span className="relative inline-flex">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        aria-label={label}
        title={label}
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[var(--radius-md)] px-3
                   text-[14px] font-medium text-[var(--color-text-secondary)]
                   transition-[transform,background-color] duration-[var(--dur-fast)]
                   ease-[var(--ease-out)] hover:bg-[var(--color-highlight)]
                   hover:text-[var(--color-text-primary)] active:scale-[0.97]"
        onClick={() => setOpen((v) => !v)}
      >
        {trigger}
      </button>
      {/* origin-top so the pop-in reads as coming out of the trigger, which is
          the whole point of the animation. */}
      <div
        id={id}
        ref={panel}
        role="menu"
        hidden={!open}
        onClick={() => setOpen(false)}
        className={`material-overlay absolute top-full z-50 mt-1 min-w-44 origin-top
                   rounded-[var(--radius-lg)] p-1
                   transition-[opacity,transform] duration-[var(--dur-base)]
                   ease-[var(--ease-spring)] data-[closed]:scale-95 data-[closed]:opacity-0
                   ${align === 'end' ? 'end-0' : 'start-0'}`}
        data-closed={open ? undefined : ''}
      >
        {children}
      </div>
    </span>
  );
}

export function MenuItem({
  onSelect,
  children,
}: {
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onSelect}
      className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2.5 py-1.5
                 text-start text-[13px] text-[var(--color-text-primary)]
                 hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-text)]"
    >
      {children}
    </button>
  );
}
