'use client';
import { useEffect } from 'react';
import { create as createStore } from 'zustand';

export type ToastKind = 'info' | 'error';

interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

interface ToastState {
  items: ToastItem[];
  push: (message: string, kind: ToastKind) => void;
  dismiss: (id: number) => void;
}

const useToasts = createStore<ToastState>((set) => ({
  items: [],
  push: (message, kind) =>
    set((s) => {
      /* Hammering the same action must not stack copies — one of each message at
         a time, the behaviour the legacy build settled on. */
      if (s.items.some((t) => t.message === message)) return s;
      return { items: [...s.items, { id: Date.now() + Math.random(), message, kind }] };
    }),
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));

/** Callable from anywhere, including non-React code. */
export function toast(message: string, kind: ToastKind = 'info'): void {
  useToasts.getState().push(message, kind);
}

const LIFETIME_MS = 3200;

export function ToastHost() {
  const items = useToasts((s) => s.items);
  const dismiss = useToasts((s) => s.dismiss);

  useEffect(() => {
    const timers = items.map((t) => setTimeout(() => dismiss(t.id), LIFETIME_MS));
    return () => timers.forEach(clearTimeout);
  }, [items, dismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[200] flex flex-col items-center gap-2"
    >
      {items.map((t) => (
        <div
          key={t.id}
          className="material-overlay pointer-events-auto rounded-[var(--radius-lg)] px-3.5 py-2
                     text-[13px] shadow-[var(--shadow-overlay)]
                     motion-safe:animate-[toast-in_var(--dur-slow)_var(--ease-spring)]"
          style={t.kind === 'error' ? { color: 'var(--color-danger)' } : undefined}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
