'use client';
import { useEffect, useState } from 'react';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { FindBar } from '@/components/chrome/FindBar';
import { Menu, MenuItem } from '@/components/ui/Menu';
import { Icon } from '@/components/ui/Icon';
import { toast } from '@/components/ui/Toast';
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

  if (!ready) return <main className="h-full" aria-busy="true" />;

  return (
    <main className="grid h-full grid-rows-[auto_1fr]">
      {/* Temporary chrome: the real toolbar replaces this in Task 22. */}
      <header className="material flex h-11 items-center justify-end px-2">
        <Menu trigger={<Icon name="more" />} label="More actions">
          <MenuItem onSelect={() => toast('Nothing here yet')}>Say hello</MenuItem>
        </Menu>
      </header>
      <div className="relative grid min-h-0 grid-cols-2">
        <FindBar />
        <section className="min-h-0 overflow-hidden">
          <CodeEditor />
        </section>
        <section className="preview min-h-0 overflow-auto border-s border-[var(--color-border)] p-6" />
      </div>
    </main>
  );
}
