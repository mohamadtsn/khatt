import { describe, it, expect } from 'vitest';
import { loadPrefs, savePref } from '@/lib/storage/prefs';
import { MemoryStorage } from '../helpers/memory-storage';

describe('prefs', () => {
  it('defaults to system theme, ltr, an even split, sync off and explorer closed', () => {
    expect(loadPrefs(new MemoryStorage())).toEqual({
      theme: 'system',
      dir: 'ltr',
      split: 50,
      // Synced scrolling was opt-in in the previous build; the default stays off.
      sync: false,
      explorer: false,
    });
  });

  it('reads the legacy theme, dir and explorer values', () => {
    const store = new MemoryStorage();
    store.setItem('md-editor-theme', 'dark');
    store.setItem('md-editor-dir', 'rtl');
    store.setItem('md-editor-explorer', 'open');
    store.setItem('md-editor-sync', 'on');
    const prefs = loadPrefs(store);
    expect(prefs.theme).toBe('dark');
    expect(prefs.dir).toBe('rtl');
    expect(prefs.explorer).toBe(true);
    expect(prefs.sync).toBe(true);
  });

  it('clamps a nonsensical split', () => {
    const store = new MemoryStorage();
    store.setItem('md-editor-split', '999');
    expect(loadPrefs(store).split).toBe(80);
    store.setItem('md-editor-split', '-5');
    expect(loadPrefs(store).split).toBe(20);
  });

  it('writes explorer back in the legacy open/closed spelling', () => {
    const store = new MemoryStorage();
    savePref(store, 'explorer', true);
    expect(store.getItem('md-editor-explorer')).toBe('open');
    savePref(store, 'sync', false);
    expect(store.getItem('md-editor-sync')).toBe('off');
  });
});
