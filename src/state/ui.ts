import { create as createStore } from 'zustand';
import { loadPrefs, savePref, type Prefs, type Theme } from '@/lib/storage/prefs';
import type { Dir } from '@/lib/storage/workspace';

export type View = 'both' | 'editor' | 'preview';

interface UiState extends Prefs {
  reading: boolean;
  readingLocked: boolean;
  view: View;
  storage: Storage | null;
  hydrate: (store: Storage) => void;
  setTheme: (theme: Theme) => void;
  setDirFallback: (dir: Dir) => void;
  setSplit: (split: number) => void;
  setSync: (sync: boolean) => void;
  setExplorer: (explorer: boolean) => void;
  setReading: (reading: boolean) => void;
  setReadingLocked: (locked: boolean) => void;
  setView: (view: View) => void;
}

export const useUi = createStore<UiState>((set, get) => {
  const write = <K extends keyof Prefs>(key: K, value: Prefs[K]) => {
    const store = get().storage;
    if (store) savePref(store, key, value);
    return { [key]: value } as Pick<UiState, K>;
  };

  return {
    theme: 'system',
    dir: 'ltr',
    split: 50,
    sync: false,
    explorer: false,
    reading: false,
    readingLocked: false,
    view: 'both',
    storage: null,

    hydrate: (store) => set({ ...loadPrefs(store), storage: store }),
    setTheme: (theme) => set(write('theme', theme)),
    setDirFallback: (dir) => set(write('dir', dir)),
    setSplit: (split) => set(write('split', split)),
    setSync: (sync) => set(write('sync', sync)),
    setExplorer: (explorer) => set(write('explorer', explorer)),
    // Leaving reading mode always unlocks: a lock that outlived the mode would
    // silently block the next edit.
    setReading: (reading) => set({ reading, ...(reading ? {} : { readingLocked: false }) }),
    setReadingLocked: (readingLocked) => set({ readingLocked }),
    setView: (view) => set({ view }),
  };
});
