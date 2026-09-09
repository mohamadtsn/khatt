'use client';
import { useEffect, useState } from 'react';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { FindBar } from '@/components/chrome/FindBar';
import { Preview } from '@/components/preview/Preview';
import { Sidebar } from '@/components/chrome/Sidebar';
import { ExplorerToggle } from '@/components/chrome/ExplorerToggle';
import { ThemeToggle } from '@/components/chrome/ThemeToggle';
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

  const explorer = useUi((s) => s.explorer);

  if (!ready) return <main className="h-full" aria-busy="true" />;

  return (
    <main className="grid h-full grid-rows-[auto_1fr]">
      {/* Temporary chrome: the real toolbar replaces this in Task 22. */}
      <header className="material flex h-11 items-center gap-1 px-2">
        <ExplorerToggle />
        <span className="flex-1" />
        <ThemeToggle />
        <Menu trigger={<Icon name="more" />} label="More actions" align="end">
          <MenuItem onSelect={() => toast('Nothing here yet')}>Say hello</MenuItem>
        </Menu>
      </header>

      <div
        className="grid min-h-0"
        style={{ gridTemplateColumns: explorer ? '15rem 1fr' : '0 1fr' }}
      >
        <Sidebar />
        <div className="relative grid min-h-0 grid-cols-2">
          <FindBar />
          <section className="min-h-0 overflow-hidden">
            <CodeEditor />
          </section>
          <section className="min-h-0 border-s border-[var(--color-border)]">
            <Preview />
          </section>
        </div>
      </div>
    </main>
  );
}
