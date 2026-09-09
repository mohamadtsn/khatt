'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  SearchQuery,
  setSearchQuery,
  findNext,
  findPrevious,
  replaceNext,
  replaceAll,
} from '@codemirror/search';
import { getEditorView } from '@/components/editor/CodeEditor';

const FIELD =
  'h-7 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-transparent px-2 ' +
  'text-[13px] text-[var(--color-text-primary)] outline-none ' +
  'focus:border-[var(--color-border-strong)]';

const ACTION =
  'h-7 rounded-[var(--radius-sm)] px-2 text-[13px] text-[var(--color-text-secondary)] ' +
  'transition-transform duration-[var(--dur-fast)] hover:bg-[var(--color-highlight)] ' +
  'hover:text-[var(--color-text-primary)] active:scale-[0.97]';

export function FindBar() {
  const [open, setOpen] = useState(false);
  const [find, setFind] = useState('');
  const [replace, setReplace] = useState('');
  const [index, setIndex] = useState(0);
  /* The view is created by an effect in CodeEditor, so it is not available on
     the first render; opening the bar re-reads it. */
  const [view, setView] = useState(getEditorView());

  const matches = useMemo(() => {
    if (!view || !find) return 0;
    const text = view.state.doc.toString();
    let count = 0;
    let at = text.indexOf(find);
    while (at !== -1) {
      count++;
      at = text.indexOf(find, at + find.length);
    }
    return count;
  }, [view, find]);

  const close = useCallback(() => {
    setOpen(false);
    getEditorView()?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setView(getEditorView());
        setOpen(true);
      }
      if (e.key === 'Escape' && open) close();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, close]);

  useEffect(() => {
    if (!view || !open) return;
    view.dispatch({
      effects: setSearchQuery.of(new SearchQuery({ search: find, replace, caseSensitive: false })),
    });
    setIndex(find && matches > 0 ? 1 : 0);
  }, [view, find, replace, matches, open]);

  const step = useCallback(
    (forward: boolean) => {
      const v = getEditorView();
      if (!v || matches === 0) return;
      (forward ? findNext : findPrevious)(v);
      setIndex((i) => (forward ? (i % matches) + 1 : ((i - 2 + matches) % matches) + 1));
    },
    [matches]
  );

  if (!open) return null;

  return (
    <div className="material-overlay absolute end-4 top-3 z-40 flex items-center gap-1 rounded-[var(--radius-lg)] p-1.5">
      <input
        aria-label="Find"
        value={find}
        autoFocus
        autoComplete="off"
        className={FIELD}
        onChange={(e) => setFind(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            step(!e.shiftKey);
          }
        }}
      />
      <input
        aria-label="Replace with"
        value={replace}
        autoComplete="off"
        className={FIELD}
        onChange={(e) => setReplace(e.target.value)}
      />
      <span data-testid="find-count" className="px-2 text-[12px] text-[var(--color-text-tertiary)]">
        {find === '' ? '' : matches === 0 ? 'No results' : `${index} of ${matches}`}
      </span>
      <button type="button" aria-label="Previous" className={ACTION} onClick={() => step(false)}>
        ↑
      </button>
      <button type="button" aria-label="Next" className={ACTION} onClick={() => step(true)}>
        ↓
      </button>
      <button
        type="button"
        aria-label="Replace"
        className={ACTION}
        onClick={() => {
          const v = getEditorView();
          if (v) replaceNext(v);
        }}
      >
        Replace
      </button>
      {/* replaceAll dispatches one transaction, so Ctrl+Z reverses the whole
          operation rather than one match at a time. */}
      <button
        type="button"
        aria-label="Replace all"
        className={ACTION}
        onClick={() => {
          const v = getEditorView();
          if (v) replaceAll(v);
        }}
      >
        Replace all
      </button>
      <button type="button" aria-label="Close" className={ACTION} onClick={close}>
        ✕
      </button>
    </div>
  );
}
