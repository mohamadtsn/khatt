/* These strings are a compatibility contract with the previous build. A returning
   user's documents live under them; changing one silently loses their work. */
export const FILES_KEY = 'md-editor-files';
export const ACTIVE_FILE_KEY = 'md-editor-active-file';
export const THEME_KEY = 'md-editor-theme';
export const DIR_KEY = 'md-editor-dir';
export const SPLIT_KEY = 'md-editor-split';
export const SYNC_KEY = 'md-editor-sync';
export const EXPLORER_KEY = 'md-editor-explorer';
/** Single-document key from before the explorer existed. Read-only fallback. */
export const LEGACY_CONTENT_KEY = 'md-editor-content';
