'use client';
import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  drawSelection,
} from '@codemirror/view';
import { history, historyKeymap, defaultKeymap, indentWithTab } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import {
  syntaxHighlighting,
  defaultHighlightStyle,
  foldGutter,
  foldKeymap,
} from '@codemirror/language';
import { useDocuments } from '@/state/documents';
import type { Dir } from '@/lib/storage/workspace';
import { editorTheme } from './theme';

let sharedView: EditorView | null = null;
/** The find bar and the toolbar command the editor through this. */
export const getEditorView = (): EditorView | null => sharedView;

function extensionsFor(dir: Dir) {
  return [
    lineNumbers(),
    foldGutter(),
    drawSelection(),
    highlightActiveLine(),
    history(),
    markdown(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    keymap.of([...defaultKeymap, ...historyKeymap, ...foldKeymap, indentWithTab]),
    editorTheme,
    EditorView.lineWrapping,
    EditorView.contentAttributes.of({ dir, spellcheck: 'false' }),
    EditorView.updateListener.of((update) => {
      if (!update.docChanged) return;
      useDocuments.getState().setContent(
        useDocuments.getState().activeId,
        update.state.doc.toString()
      );
    }),
  ];
}

export function CodeEditor() {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  /* One EditorState per document. Switching calls setState rather than replacing
     the text, so each document keeps its own undo history for free — the exact
     problem the legacy build had to hand-roll a snapshot history to work around. */
  const states = useRef(new Map<string, EditorState>());

  const activeId = useDocuments((s) => s.activeId);

  useEffect(() => {
    const parent = host.current;
    if (!parent) return;
    const instance = new EditorView({ parent });
    view.current = instance;
    sharedView = instance;
    return () => {
      instance.destroy();
      view.current = null;
      sharedView = null;
    };
  }, []);

  useEffect(() => {
    const v = view.current;
    if (!v || !activeId) return;
    const doc = useDocuments.getState().documents.find((d) => d.id === activeId);
    if (!doc) return;
    const existing = states.current.get(activeId);
    const state =
      existing ?? EditorState.create({ doc: doc.content, extensions: extensionsFor(doc.dir) });
    states.current.set(activeId, state);
    v.setState(state);
    // Park the outgoing document's state, including its history, before leaving.
    return () => {
      if (view.current) states.current.set(activeId, view.current.state);
    };
  }, [activeId]);

  return <div ref={host} className="h-full overflow-auto" data-testid="editor" />;
}
