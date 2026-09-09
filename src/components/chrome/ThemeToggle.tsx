'use client';
import { useUi } from '@/state/ui';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { isDarkNow } from '@/lib/theme-state';

/* The attribute on <html> is the single source of truth for the palette — the
   same one the bootstrap script in <head> sets before first paint. */
function applyTheme(theme: 'light' | 'dark' | 'system'): void {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
}

export function ThemeToggle() {
  const theme = useUi((s) => s.theme);
  const setTheme = useUi((s) => s.setTheme);

  return (
    <Button
      label="Toggle theme"
      icon={<Icon name="theme" />}
      onClick={() => {
        // From "system", the toggle commits to the opposite of what is showing,
        // so one click always visibly changes something.
        const next = theme === 'system' ? (isDarkNow() ? 'light' : 'dark') : theme === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        setTheme(next);
      }}
    />
  );
}
