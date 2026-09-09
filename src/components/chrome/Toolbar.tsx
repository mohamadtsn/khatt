'use client';
import { useDocuments, useActiveDoc } from '@/state/documents';
import { useUi } from '@/state/ui';
import { Button } from '@/components/ui/Button';
import { Menu, MenuItem } from '@/components/ui/Menu';
import { Icon } from '@/components/ui/Icon';
import { ExplorerToggle } from './ExplorerToggle';
import { ThemeToggle } from './ThemeToggle';
import { getEditorView } from '@/components/editor/CodeEditor';
import { copyAs, downloadHtml, downloadMarkdown, printPdf } from '@/lib/export';
import { toast } from '@/components/ui/Toast';
import { isolateHistory } from '@codemirror/commands';

const VIEW_ORDER = ['both', 'editor', 'preview'] as const;

/* Clearing goes through the editor as one transaction rather than assigning
   content, so Ctrl+Z brings the document back. */
function clearEditor(): void {
  const view = getEditorView();
  if (!view) return;
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: '' },
    /* Without this the clear merges into the edit just before it, and one undo
       would take back both. */
    annotations: isolateHistory.of('before'),
  });
  view.focus();
}

/* The preview is the source for HTML and text export, so it is looked up rather
   than passed down: it is a single, always-present element. */
const previewRoot = (): HTMLElement | null => document.querySelector('.preview');

export function Toolbar({ onOpenFile }: { onOpenFile: () => void }) {
  const doc = useActiveDoc();
  const view = useUi((s) => s.view);
  const setView = useUi((s) => s.setView);
  const sync = useUi((s) => s.sync);
  const setSync = useUi((s) => s.setSync);
  const setReading = useUi((s) => s.setReading);
  const setDirFallback = useUi((s) => s.setDirFallback);

  /* DOM order is the narrow-screen order; the desktop layout reorders with CSS.
     That convention carries over from the legacy header — keep it. */
  return (
    <header className="material flex h-11 items-center gap-1 px-2">
      <ExplorerToggle />
      <span className="inline-flex items-center gap-1.5 px-1 text-[13px] font-semibold">
        <Icon name="brand" className="text-[var(--color-accent)]" />
        <span className="hidden sm:inline">{doc?.name ?? 'Markdown Editor'}</span>
      </span>

      <span className="flex-1" />

      <Menu trigger={<><Icon name="export" /> <span className="hidden md:inline">Export</span></>} label="Export as">
        <MenuItem onSelect={() => doc && downloadMarkdown(doc)}>Markdown</MenuItem>
        <MenuItem
          onSelect={() => {
            const root = previewRoot();
            if (doc && root) void downloadHtml(doc, root);
          }}
        >
          HTML
        </MenuItem>
        <MenuItem onSelect={printPdf}>PDF</MenuItem>
      </Menu>

      <Menu trigger={<><Icon name="copy" /> <span className="hidden md:inline">Copy</span></>} label="Copy as">
        {(
          [
            ['markdown', 'Markdown'],
            ['html', 'Rich HTML'],
            ['text', 'Plain text'],
          ] as const
        ).map(([kind, label]) => (
          <MenuItem
            key={kind}
            onSelect={() => {
              const root = previewRoot();
              if (!doc || !root) return;
              void copyAs(kind, doc, root).then(
                () => toast(`Copied as ${label.toLowerCase()}`),
                () => toast('Could not copy', 'error')
              );
            }}
          >
            {label}
          </MenuItem>
        ))}
      </Menu>

      <Button
        label="Reading mode"
        icon={<Icon name="read" />}
        onClick={() => setReading(true)}
      />
      <Button
        label="Switch pane"
        icon={<Icon name={view === 'editor' ? 'editor' : view === 'preview' ? 'preview' : 'both'} />}
        onClick={() => {
          const at = VIEW_ORDER.indexOf(view);
          setView(VIEW_ORDER[(at + 1) % VIEW_ORDER.length] ?? 'both');
        }}
      />
      <ThemeToggle />

      <Menu trigger={<Icon name="more" />} label="More actions" align="end">
        <MenuItem onSelect={clearEditor}>
          <Icon name="clear" /> Clear editor
        </MenuItem>
        <MenuItem onSelect={onOpenFile}>
          <Icon name="open" /> Open a file
        </MenuItem>
        <MenuItem onSelect={() => setSync(!sync)}>
          <Icon name="sync" /> Sync scroll{sync ? ' (on)' : ''}
        </MenuItem>
        <MenuItem
          onSelect={() => {
            if (!doc) return;
            const next = doc.dir === 'rtl' ? 'ltr' : 'rtl';
            useDocuments.getState().setDir(doc.id, next);
            // The global key is the fallback new documents inherit.
            setDirFallback(next);
          }}
        >
          <Icon name="dir" /> Text direction
        </MenuItem>
      </Menu>
    </header>
  );
}
