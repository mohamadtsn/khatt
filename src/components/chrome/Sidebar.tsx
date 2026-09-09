'use client';
import { useState } from 'react';
import { useDocuments } from '@/state/documents';
import { useUi } from '@/state/ui';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Icon } from '@/components/ui/Icon';

const FIELD =
  'h-8 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-transparent px-2 ' +
  'text-[13px] outline-none focus:border-[var(--color-border-strong)]';

export function Sidebar() {
  const documents = useDocuments((s) => s.documents);
  const activeId = useDocuments((s) => s.activeId);
  const open = useUi((s) => s.explorer);

  const [renaming, setRenaming] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');

  const renameTarget = documents.find((d) => d.id === renaming);
  const closeTarget = documents.find((d) => d.id === confirming);

  return (
    <>
      {/* The panel slides on `transform` only. The layout track it occupies
          switches instantly — animating a grid track would animate layout. */}
      <aside
        aria-label="Explorer"
        aria-hidden={!open}
        className={`material z-20 flex h-full w-60 flex-col gap-1 overflow-y-auto p-2
                    transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out)]
                    ${open ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-1 pb-1">
          <span className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
            Documents
          </span>
          <Button
            label="New document"
            size="sm"
            icon={<Icon name="open" />}
            onClick={() => useDocuments.getState().create()}
          />
        </div>

        {documents.map((doc) => (
          <div key={doc.id} className="group flex items-center gap-0.5">
            <button
              type="button"
              aria-label={doc.name}
              aria-current={doc.id === activeId}
              onClick={() => useDocuments.getState().activate(doc.id)}
              className={`flex-1 truncate rounded-[var(--radius-sm)] px-2 py-1.5 text-start text-[13px]
                          transition-colors duration-[var(--dur-fast)]
                          ${
                            doc.id === activeId
                              ? 'bg-[var(--color-accent)] text-[var(--color-accent-text)]'
                              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-highlight)]'
                          }`}
            >
              {doc.name}
            </button>
            <Button
              label={`Rename ${doc.name}`}
              size="sm"
              icon={<Icon name="editor" />}
              onClick={() => {
                setDraftName(doc.name);
                setRenaming(doc.id);
              }}
            />
            <Button
              label={`Close ${doc.name}`}
              size="sm"
              icon={<Icon name="clear" />}
              onClick={() => {
                /* An empty document has nothing to lose, so closing it asks
                   nothing. A confirmation on every close trains people to
                   dismiss confirmations. */
                if (doc.content.trim() === '') useDocuments.getState().close(doc.id);
                else setConfirming(doc.id);
              }}
            />
          </div>
        ))}
      </aside>

      <Dialog open={renameTarget !== undefined} onClose={() => setRenaming(null)} title="Rename document">
        <label className="block text-[12px] text-[var(--color-text-secondary)]">
          Name
          <input
            aria-label="Name"
            className={`${FIELD} mt-1`}
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
          />
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <Button label="Cancel" onClick={() => setRenaming(null)}>
            Cancel
          </Button>
          <Button
            label="Rename"
            variant="solid"
            onClick={() => {
              if (renaming && draftName.trim() !== '') {
                useDocuments.getState().rename(renaming, draftName.trim());
              }
              setRenaming(null);
            }}
          >
            Rename
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={closeTarget !== undefined}
        onClose={() => setConfirming(null)}
        title={`Close ${closeTarget?.name ?? ''}?`}
      >
        <p className="text-[13px] text-[var(--color-text-secondary)]">
          {closeTarget?.name} has content. Closing it discards the document.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button label="Cancel" onClick={() => setConfirming(null)}>
            Cancel
          </Button>
          <Button
            label="Close document"
            variant="danger"
            onClick={() => {
              if (confirming) useDocuments.getState().close(confirming);
              setConfirming(null);
            }}
          >
            Close
          </Button>
        </div>
      </Dialog>
    </>
  );
}
