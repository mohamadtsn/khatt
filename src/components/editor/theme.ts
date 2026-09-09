import { EditorView } from '@codemirror/view';

/* Every colour comes from a semantic token so the editor re-themes with the rest
   of the app and needs no JS on a theme flip. */
export const editorTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '14px',
    backgroundColor: 'transparent',
    color: 'var(--color-text-primary)',
  },
  '.cm-content': {
    fontFamily: 'var(--font-mono)',
    lineHeight: '1.7',
    padding: '20px 24px 40vh',
    caretColor: 'var(--color-accent)',
  },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--color-text-tertiary)',
  },
  '.cm-activeLine': { backgroundColor: 'var(--color-highlight)' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent' },
  '&.cm-focused .cm-selectionBackground, ::selection': {
    backgroundColor: 'var(--color-selection)',
  },
  '.cm-cursor': { borderLeftColor: 'var(--color-accent)', borderLeftWidth: '2px' },
  '.cm-searchMatch': { backgroundColor: 'oklch(0.85 0.16 90 / 0.4)' },
  '.cm-searchMatch.cm-searchMatch-selected': { backgroundColor: 'var(--color-selection)' },
});
