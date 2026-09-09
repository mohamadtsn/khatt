'use client';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'ghost' | 'solid' | 'danger';
type Size = 'sm' | 'md';

const BASE =
  'inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-md)] font-medium ' +
  'select-none whitespace-nowrap transition-[transform,background-color,opacity] ' +
  'duration-[var(--dur-fast)] ease-[var(--ease-out)] active:scale-[0.97] ' +
  'disabled:pointer-events-none disabled:opacity-40';

const VARIANTS: Record<Variant, string> = {
  ghost: 'text-[var(--color-text-secondary)] hover:bg-[var(--color-highlight)] hover:text-[var(--color-text-primary)]',
  solid: 'bg-[var(--color-accent)] text-[var(--color-accent-text)] hover:opacity-90',
  danger: 'text-[var(--color-danger)] hover:bg-[color-mix(in_oklch,var(--color-danger)_12%,transparent)]',
};

const SIZES: Record<Size, string> = {
  sm: 'h-7 px-2 text-[13px]',
  md: 'h-9 px-3 text-[14px]',
};

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  /** Required for an icon-only button: it becomes the accessible name. */
  label: string;
  /** When absent the button is icon-only and `label` is its only name. */
  children?: ReactNode;
}

export function Button({
  variant = 'ghost',
  size = 'md',
  icon,
  label,
  children,
  className = '',
  ...rest
}: ButtonProps) {
  const iconOnly = children === undefined;
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${iconOnly ? 'aspect-square px-0' : ''} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
