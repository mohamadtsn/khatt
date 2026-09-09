import { create as createStore } from 'zustand';
import {
  loadWorkspace,
  saveWorkspace,
  uniqueName,
  newDoc,
  type Dir,
  type Doc,
} from '@/lib/storage/workspace';

interface DocumentsState {
  documents: Doc[];
  activeId: string;
  storage: Storage | null;
  hydrate: (store: Storage) => void;
  setContent: (id: string, content: string) => void;
  create: (name?: string) => void;
  rename: (id: string, name: string) => void;
  close: (id: string) => void;
  activate: (id: string) => void;
  setDir: (id: string, dir: Dir) => void;
  importFiles: (files: { name: string; content: string }[]) => void;
}

export const useDocuments = createStore<DocumentsState>((set, get) => {
  /* Persistence is a side effect of every mutation rather than a separate call,
     so no path through the store can leave localStorage stale. The debounce
     that keeps typing cheap lives in the editor component, not here. */
  const persist = (documents: Doc[], activeId: string) => {
    const store = get().storage;
    if (store) saveWorkspace(store, documents, activeId);
    return { documents, activeId };
  };

  const dirOfActive = (documents: Doc[], activeId: string): Dir =>
    documents.find((d) => d.id === activeId)?.dir ?? 'ltr';

  return {
    documents: [],
    activeId: '',
    storage: null,

    hydrate: (store) => {
      const { documents, activeId } = loadWorkspace(store);
      set({ documents, activeId, storage: store });
    },

    setContent: (id, content) =>
      set((s) =>
        persist(
          s.documents.map((d) => (d.id === id ? { ...d, content } : d)),
          s.activeId
        )
      ),

    create: (name = 'untitled.md') =>
      set((s) => {
        const doc = newDoc(uniqueName(name, s.documents), '', dirOfActive(s.documents, s.activeId));
        return persist([...s.documents, doc], doc.id);
      }),

    rename: (id, name) =>
      set((s) =>
        persist(
          s.documents.map((d) =>
            d.id === id ? { ...d, name: uniqueName(name, s.documents, id) } : d
          ),
          s.activeId
        )
      ),

    close: (id) =>
      set((s) => {
        const index = s.documents.findIndex((d) => d.id === id);
        const closing = s.documents[index];
        if (!closing) return s;
        const rest = s.documents.filter((d) => d.id !== id);
        /* The workspace is never empty: closing the last document leaves a fresh
           one, which is what the explorer and the editor both assume. */
        const neighbour = rest[Math.min(index, rest.length - 1)];
        if (!neighbour) {
          const fresh = newDoc('document.md', '', closing.dir);
          return persist([fresh], fresh.id);
        }
        return persist(rest, s.activeId === id ? neighbour.id : s.activeId);
      }),

    activate: (id) =>
      set((s) => (s.documents.some((d) => d.id === id) ? persist(s.documents, id) : s)),

    setDir: (id, dir) =>
      set((s) =>
        persist(
          s.documents.map((d) => (d.id === id ? { ...d, dir } : d)),
          s.activeId
        )
      ),

    importFiles: (files) =>
      set((s) => {
        const dir = dirOfActive(s.documents, s.activeId);
        let documents = s.documents;
        let activeId = s.activeId;
        for (const file of files) {
          const doc = newDoc(uniqueName(file.name, documents), file.content, dir);
          documents = [...documents, doc];
          activeId = doc.id;
        }
        return persist(documents, activeId);
      }),
  };
});

export const useActiveDoc = (): Doc | undefined =>
  useDocuments((s) => s.documents.find((d) => d.id === s.activeId));
