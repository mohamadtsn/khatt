'use client';
import { useEffect, useRef, useState } from 'react';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { FindBar } from '@/components/chrome/FindBar';
import { Preview } from '@/components/preview/Preview';
import { Sidebar } from '@/components/chrome/Sidebar';
import { Toolbar } from '@/components/chrome/Toolbar';
import { Divider } from '@/components/chrome/Divider';
import { StatusBar } from '@/components/chrome/StatusBar';
import { ReadingControls } from '@/components/chrome/ReadingControls';
import { useSyncedScroll } from '@/components/preview/useSyncedScroll';
import { useDocuments } from '@/state/documents';
import { useUi } from '@/state/ui';

export default function Page() {
  /* The stores are hydrated in an effect, never during render: localStorage does
     not exist while the page is prerendered, and reading it in render is what
     produces a hydration mismatch. */
  const [ready, setReady] = useState(false);
  useEffect(() => {
    useDocuments.getState().hydrate(window.localStorage);
    useUi.getState().hydrate(window.localStorage);
    setReady(true);
  }, []);

  const explorer = useUi((s) => s.explorer);
  const split = useUi((s) => s.split);
  const view = useUi((s) => s.view);
  const reading = useUi((s) => s.reading);

  const panes = useRef<HTMLDivElement>(null);
  const editorScroller = useRef<HTMLElement | null>(null);
  const previewScroller = useRef<HTMLElement | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  /* CodeMirror owns its own scroller, so the two panes are found in the DOM
     rather than handed down as refs. */
  useEffect(() => {
    if (!ready) return;
    editorScroller.current = panes.current?.querySelector('.cm-scroller') ?? null;
    previewScroller.current = panes.current?.querySelector('.preview') ?? null;
  }, [ready, view]);

  useSyncedScroll(editorScroller, previewScroller);

  if (!ready) return <main className="h-full" aria-busy="true" />;

  const columns =
    view === 'editor'
      ? '1fr 0 0'
      : view === 'preview'
        ? '0 0 1fr'
        : `${split}fr 4px ${100 - split}fr`;

  return (
    <main className="grid h-full grid-rows-[auto_1fr_auto]">
      <Toolbar onOpenFile={() => fileInput.current?.click()} />

      <div className="grid min-h-0" style={{ gridTemplateColumns: explorer ? '15rem 1fr' : '0 1fr' }}>
        <Sidebar />
        <div ref={panes} className="relative grid min-h-0" style={{ gridTemplateColumns: columns }}>
          <FindBar />
          <section className="min-h-0 overflow-hidden" hidden={view === 'preview'}>
            <CodeEditor />
          </section>
          <Divider />
          <section
            className="min-h-0 border-s border-[var(--color-border)]"
            hidden={view === 'editor'}
          >
            <Preview />
          </section>
        </div>
      </div>

      <StatusBar />
      <ReadingControls />

      {/* Kept out of the toolbar so the menu can close before the picker opens. */}
      <input
        ref={fileInput}
        type="file"
        accept=".md,.markdown,.txt,text/markdown,text/plain"
        multiple
        hidden
        aria-hidden="true"
        onChange={async (e) => {
          const files = [...(e.target.files ?? [])];
          if (files.length === 0) return;
          const read = await Promise.all(
            files.map(async (f) => ({ name: f.name, content: await f.text() }))
          );
          useDocuments.getState().importFiles(read);
          e.target.value = '';
        }}
      />

      {reading ? <div className="sr-only">Reading mode</div> : null}
    </main>
  );
}
