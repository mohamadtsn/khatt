'use client';
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { getEditorView } from '@/components/editor/CodeEditor';
import { Menu, MenuItem } from '@/components/ui/Menu';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import {
  applyBlock,
  applyInline,
  applyLink,
  insertTable,
  type BlockCommand,
  type InlineCommand,
} from './commands';

interface Anchor {
  x: number;
  y: number;
  above: boolean;
}

const ACTION =
  'h-7 min-w-7 rounded-[var(--radius-sm)] px-1.5 text-[13px] text-[var(--color-text-secondary)] ' +
  'transition-transform duration-[var(--dur-fast)] hover:bg-[var(--color-highlight)] ' +
  'hover:text-[var(--color-text-primary)] active:scale-[0.97]';

const HEADINGS: BlockCommand[] = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

export function SelectionToolbar({ host }: { host: RefObject<HTMLDivElement | null> }) {
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [selected, setSelected] = useState('');
  const [linkOpen, setLinkOpen] = useState(false);
  const [tableOpen, setTableOpen] = useState(false);
  const toolbar = useRef<HTMLDivElement>(null);

  const refresh = useCallback(() => {
    const root = host.current;
    /* Opening the heading menu or a dialog moves focus out of the document and
       collapses the selection. That is not the user dismissing the toolbar, so
       the anchor is held while focus is inside the toolbar's own UI. */
    const active = document.activeElement;
    if (
      active instanceof Element &&
      (toolbar.current?.contains(active) || active.closest('[role="dialog"]') !== null)
    ) {
      return;
    }
    const selection = document.getSelection();
    if (!root || !selection || selection.isCollapsed || selection.rangeCount === 0) {
      setAnchor(null);
      return;
    }
    const range = selection.getRangeAt(0);
    if (!root.contains(range.commonAncestorContainer)) {
      setAnchor(null);
      return;
    }
    const text = selection.toString();
    if (text.trim() === '') {
      setAnchor(null);
      return;
    }
    const rect = range.getBoundingClientRect();
    // Flip below the selection when there is no room above it.
    const above = rect.top > 56;
    setSelected(text);
    setAnchor({ x: rect.left + rect.width / 2, y: above ? rect.top - 8 : rect.bottom + 8, above });
  }, [host]);

  useEffect(() => {
    const root = host.current;
    if (!root) return;
    const onUp = () => refresh();
    const onContext = (e: MouseEvent) => {
      const selection = document.getSelection();
      if (selection && !selection.isCollapsed) {
        e.preventDefault();
        refresh();
      }
    };
    root.addEventListener('mouseup', onUp);
    root.addEventListener('keyup', onUp);
    root.addEventListener('contextmenu', onContext);
    document.addEventListener('selectionchange', onUp);
    return () => {
      root.removeEventListener('mouseup', onUp);
      root.removeEventListener('keyup', onUp);
      root.removeEventListener('contextmenu', onContext);
      document.removeEventListener('selectionchange', onUp);
    };
  }, [host, refresh]);

  const run = useCallback(
    (fn: (view: ReturnType<typeof getEditorView> & object) => void) => {
      const view = getEditorView();
      if (!view) return;
      fn(view);
      setAnchor(null);
    },
    []
  );

  return (
    <>
      {anchor ? (
      <div
        ref={toolbar}
        role="toolbar"
        aria-label="Formatting"
        className="material-overlay fixed z-50 flex -translate-x-1/2 items-center gap-0.5
                   rounded-[var(--radius-lg)] p-1
                   motion-safe:animate-[toast-in_var(--dur-fast)_var(--ease-out)]"
        style={{
          insetInlineStart: anchor.x,
          top: anchor.y,
          transform: `translateX(-50%) ${anchor.above ? 'translateY(-100%)' : ''}`,
        }}
        onMouseDown={(e) => e.preventDefault()}
      >
        <button type="button" aria-label="Bold" className={`${ACTION} font-bold`}
                onClick={() => run((v) => applyInline(v, selected, 'bold' satisfies InlineCommand))}>
          B
        </button>
        <button type="button" aria-label="Italic" className={`${ACTION} italic`}
                onClick={() => run((v) => applyInline(v, selected, 'italic'))}>
          I
        </button>
        <button type="button" aria-label="Strikethrough" className={`${ACTION} line-through`}
                onClick={() => run((v) => applyInline(v, selected, 'strike'))}>
          S
        </button>
        <button type="button" aria-label="Inline code" className={`${ACTION} font-[family-name:var(--font-mono)]`}
                onClick={() => run((v) => applyInline(v, selected, 'code'))}>
          {'</>'}
        </button>

        <span className="mx-1 h-4 w-px bg-[var(--color-border)]" />

        <Menu trigger="H" label="Heading">
          {HEADINGS.map((h) => (
            <MenuItem key={h} onSelect={() => run((v) => applyBlock(v, selected, h))}>
              {h.toUpperCase()}
            </MenuItem>
          ))}
        </Menu>

        <button type="button" aria-label="Quote" className={ACTION}
                onClick={() => run((v) => applyBlock(v, selected, 'quote'))}>
          &ldquo;
        </button>
        <button type="button" aria-label="Bullet list" className={ACTION}
                onClick={() => run((v) => applyBlock(v, selected, 'bullet'))}>
          &bull;
        </button>
        <button type="button" aria-label="Numbered list" className={ACTION}
                onClick={() => run((v) => applyBlock(v, selected, 'ordered'))}>
          1.
        </button>
        <button type="button" aria-label="Checklist" className={ACTION}
                onClick={() => run((v) => applyBlock(v, selected, 'checklist'))}>
          &#9744;
        </button>

        <span className="mx-1 h-4 w-px bg-[var(--color-border)]" />

        <button type="button" aria-label="Link" className={ACTION} onClick={() => setLinkOpen(true)}>
          &#128279;
        </button>
        <button type="button" aria-label="Table" className={ACTION} onClick={() => setTableOpen(true)}>
          &#9638;
        </button>
      </div>
      ) : null}

      <LinkDialog
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        onSubmit={(href) => {
          run((v) => applyLink(v, selected, href));
          setLinkOpen(false);
        }}
      />
      <TableDialog
        open={tableOpen}
        onClose={() => setTableOpen(false)}
        onSubmit={(rows, cols) => {
          run((v) => insertTable(v, selected, rows, cols));
          setTableOpen(false);
        }}
      />
    </>
  );
}

const FIELD =
  'h-8 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-transparent px-2 ' +
  'text-[13px] outline-none focus:border-[var(--color-border-strong)]';

function LinkDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (href: string) => void;
}) {
  const [href, setHref] = useState('https://');
  return (
    <Dialog open={open} onClose={onClose} title="Add link">
      <label className="block text-[12px] text-[var(--color-text-secondary)]">
        Address
        <input aria-label="Address" className={`${FIELD} mt-1`} value={href}
               onChange={(e) => setHref(e.target.value)} />
      </label>
      <div className="mt-4 flex justify-end gap-2">
        <Button label="Cancel" onClick={onClose}>Cancel</Button>
        <Button label="Add link" variant="solid" onClick={() => onSubmit(href)}>Add link</Button>
      </div>
    </Dialog>
  );
}

function TableDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (rows: number, cols: number) => void;
}) {
  const [rows, setRows] = useState(2);
  const [cols, setCols] = useState(3);
  return (
    <Dialog open={open} onClose={onClose} title="Insert table">
      <div className="flex gap-3">
        <label className="flex-1 text-[12px] text-[var(--color-text-secondary)]">
          Rows
          <input aria-label="Rows" type="number" min={1} max={20} className={`${FIELD} mt-1`}
                 value={rows} onChange={(e) => setRows(Number(e.target.value))} />
        </label>
        <label className="flex-1 text-[12px] text-[var(--color-text-secondary)]">
          Columns
          <input aria-label="Columns" type="number" min={1} max={10} className={`${FIELD} mt-1`}
                 value={cols} onChange={(e) => setCols(Number(e.target.value))} />
        </label>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button label="Cancel" onClick={onClose}>Cancel</Button>
        <Button label="Insert table" variant="solid" onClick={() => onSubmit(rows, cols)}>
          Insert table
        </Button>
      </div>
    </Dialog>
  );
}
