import { ACTIVE_FILE_KEY, DIR_KEY, FILES_KEY, LEGACY_CONTENT_KEY } from './keys';

export type Dir = 'ltr' | 'rtl';

export interface Doc {
  id: string;
  name: string;
  content: string;
  dir: Dir;
}

const STARTER = '# Welcome\n\nStart writing.\n';

/** The legacy build capped the workspace here; a runaway entry cannot grow past it. */
const MAX_DOCUMENTS = 100;

function makeId(): string {
  return crypto.randomUUID();
}

export function newDoc(name: string, content: string, dir: Dir): Doc {
  return { id: makeId(), name, content, dir };
}

function coerce(raw: unknown, fallbackName: string, fallbackDir: Dir): Doc | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Partial<Doc>;
  if (typeof r.content !== 'string') return null;
  return {
    id: typeof r.id === 'string' && r.id ? r.id : makeId(),
    name: typeof r.name === 'string' && r.name ? r.name : fallbackName,
    content: r.content,
    dir: r.dir === 'rtl' ? 'rtl' : r.dir === 'ltr' ? 'ltr' : fallbackDir,
  };
}

export function loadWorkspace(store: Storage): { documents: Doc[]; activeId: string } {
  const fallbackDir: Dir = store.getItem(DIR_KEY) === 'rtl' ? 'rtl' : 'ltr';
  let documents: Doc[] = [];

  try {
    const raw: unknown = JSON.parse(store.getItem(FILES_KEY) ?? 'null');
    if (Array.isArray(raw)) {
      documents = raw
        .slice(0, MAX_DOCUMENTS)
        .map((r, i) => coerce(r, `Document-${i + 1}.md`, fallbackDir))
        .filter((d): d is Doc => d !== null);
    }
  } catch {
    /* A corrupt entry must not brick the app; fall through to the starter doc. */
  }

  if (documents.length === 0) {
    // Migration path: preserve the single document used by every earlier release.
    const legacy = store.getItem(LEGACY_CONTENT_KEY);
    documents = [newDoc('document.md', legacy ?? STARTER, fallbackDir)];
  }

  const stored = store.getItem(ACTIVE_FILE_KEY);
  const first = documents[0];
  if (!first) throw new Error('unreachable: the workspace always holds one document');
  const activeId = stored !== null && documents.some((d) => d.id === stored) ? stored : first.id;
  return { documents, activeId };
}

export function saveWorkspace(store: Storage, documents: Doc[], activeId: string): void {
  try {
    store.setItem(FILES_KEY, JSON.stringify(documents));
    store.setItem(ACTIVE_FILE_KEY, activeId);
  } catch {
    /* Quota exceeded. The in-memory workspace is still correct; the caller
       surfaces this to the user as a toast rather than losing the edit. */
    throw new Error('storage-full');
  }
}

/* Duplicate names get a "-N" suffix before the extension, the spelling the
   previous build used, so a workspace carried over keeps its names stable. */
export function uniqueName(base: string, documents: Doc[], excludeId?: string): string {
  const taken = new Set(
    documents.filter((d) => d.id !== excludeId).map((d) => d.name.toLowerCase())
  );
  if (!taken.has(base.toLowerCase())) return base;
  const dot = base.lastIndexOf('.');
  const stem = dot > 0 ? base.slice(0, dot) : base;
  const ext = dot > 0 ? base.slice(dot) : '';
  for (let n = 2; ; n++) {
    const candidate = `${stem}-${n}${ext}`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }
}
