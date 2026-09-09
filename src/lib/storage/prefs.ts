import { DIR_KEY, EXPLORER_KEY, SPLIT_KEY, SYNC_KEY, THEME_KEY } from './keys';
import type { Dir } from './workspace';

export type Theme = 'light' | 'dark' | 'system';

export interface Prefs {
  theme: Theme;
  dir: Dir;
  split: number;
  sync: boolean;
  explorer: boolean;
}

export const SPLIT_MIN = 20;
export const SPLIT_MAX = 80;

const clampSplit = (n: number) => Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, n));

export function loadPrefs(store: Storage): Prefs {
  const theme = store.getItem(THEME_KEY);
  const split = Number(store.getItem(SPLIT_KEY));
  return {
    theme: theme === 'dark' || theme === 'light' ? theme : 'system',
    dir: store.getItem(DIR_KEY) === 'rtl' ? 'rtl' : 'ltr',
    split: Number.isFinite(split) && split !== 0 ? clampSplit(split) : 50,
    // Synced scrolling was opt-in in the previous build; an absent key means off.
    sync: store.getItem(SYNC_KEY) === 'on',
    explorer: store.getItem(EXPLORER_KEY) === 'open',
  };
}

/* The legacy spellings are not booleans and not numbers, so each key gets its
   own encoding rather than a generic JSON write. */
export function savePref<K extends keyof Prefs>(store: Storage, key: K, value: Prefs[K]): void {
  const write: Record<keyof Prefs, () => void> = {
    theme: () => store.setItem(THEME_KEY, String(value)),
    dir: () => store.setItem(DIR_KEY, String(value)),
    split: () => store.setItem(SPLIT_KEY, String(clampSplit(Number(value)))),
    sync: () => store.setItem(SYNC_KEY, value ? 'on' : 'off'),
    explorer: () => store.setItem(EXPLORER_KEY, value ? 'open' : 'closed'),
  };
  write[key]();
}
