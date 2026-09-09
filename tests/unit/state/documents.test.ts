import { describe, it, expect, beforeEach } from 'vitest';
import { useDocuments } from '@/state/documents';
import { MemoryStorage } from '../helpers/memory-storage';

let store: Storage;
beforeEach(() => {
  store = new MemoryStorage();
  useDocuments.getState().hydrate(store);
});

describe('documents store', () => {
  it('hydrates with one starter document', () => {
    expect(useDocuments.getState().documents).toHaveLength(1);
  });

  it('creates a document with a unique name and activates it', () => {
    const { create } = useDocuments.getState();
    create('untitled.md');
    create('untitled.md');
    const { documents, activeId } = useDocuments.getState();
    expect(documents.map((d) => d.name)).toEqual(['document.md', 'untitled.md', 'untitled-2.md']);
    expect(documents.find((d) => d.id === activeId)?.name).toBe('untitled-2.md');
  });

  it('persists every mutation to the given storage', () => {
    useDocuments.getState().create('kept.md');
    const raw: unknown = JSON.parse(store.getItem('md-editor-files') ?? 'null');
    expect(Array.isArray(raw) && raw).toHaveLength(2);
  });

  it('never leaves the workspace empty when the last document is closed', () => {
    const { activeId, close } = useDocuments.getState();
    close(activeId);
    expect(useDocuments.getState().documents).toHaveLength(1);
  });

  it('activates a neighbour when the active document is closed', () => {
    useDocuments.getState().create('second.md');
    const { activeId, close } = useDocuments.getState();
    close(activeId);
    const after = useDocuments.getState();
    expect(after.documents).toHaveLength(1);
    expect(after.activeId).toBe(after.documents[0]?.id);
  });

  it('keeps direction per document', () => {
    const { activeId, create, setDir } = useDocuments.getState();
    setDir(activeId, 'rtl');
    create('other.md');
    const after = useDocuments.getState();
    expect(after.documents.find((d) => d.id === activeId)?.dir).toBe('rtl');
    // A new document inherits the direction of the one it was created from.
    expect(after.documents.find((d) => d.id === after.activeId)?.dir).toBe('rtl');
  });

  it('imports several files at once and activates the last', () => {
    useDocuments.getState().importFiles([
      { name: 'a.md', content: '1' },
      { name: 'b.md', content: '2' },
    ]);
    const after = useDocuments.getState();
    expect(after.documents).toHaveLength(3);
    expect(after.documents.find((d) => d.id === after.activeId)?.name).toBe('b.md');
  });

  it('renames without colliding with an existing name', () => {
    const { create } = useDocuments.getState();
    create('taken.md');
    const { documents, rename } = useDocuments.getState();
    const first = documents[0];
    if (!first) throw new Error('expected a starter document');
    rename(first.id, 'taken.md');
    expect(useDocuments.getState().documents[0]?.name).toBe('taken-2.md');
  });
});
