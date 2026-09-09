/** Whether the dark palette is currently in effect, however it was chosen. */
export function isDarkNow(): boolean {
  const explicit = document.documentElement.getAttribute('data-theme');
  if (explicit === 'dark') return true;
  if (explicit === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}
