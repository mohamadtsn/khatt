import { describe, it, expect, beforeEach } from 'vitest';
import { loadWorkspace, saveWorkspace, uniqueName, newDoc } from '@/lib/storage/workspace';
import { MemoryStorage } from '../helpers/memory-storage';

let store: Storage;
beforeEach(() => {
  store = new MemoryStorage();
});

describe('loadWorkspace', () => {
  it('returns a single starter document on a first visit', () => {
    const { documents, activeId } = loadWorkspace(store);
    expect(documents).toHaveLength(1);
    expect(documents[0]?.name).toBe('document.md');
    expect(activeId).toBe(documents[0]?.id);
  });

  it('migrates the legacy single-document key', () => {
    store.setItem('md-editor-content', '# from the old build');
    const { documents } = loadWorkspace(store);
    expect(documents).toHaveLength(1);
    expect(documents[0]?.content).toBe('# from the old build');
  });

  it('reads documents written by the previous version verbatim', () => {
    store.setItem(
      'md-editor-files',
      JSON.stringify([
        { id: 'a', name: 'one.md', content: '1', dir: 'ltr' },
        { id: 'b', name: 'two.md', content: '2', dir: 'rtl' },
      ])
    );
    store.setItem('md-editor-active-file', 'b');
    const { documents, activeId } = loadWorkspace(store);
    expect(documents.map((d) => d.name)).toEqual(['one.md', 'two.md']);
    expect(documents[1]?.dir).toBe('rtl');
    expect(activeId).toBe('b');
  });

  it('falls back to the first document when the active id is stale', () => {
    store.setItem(
      'md-editor-files',
      JSON.stringify([{ id: 'a', name: 'x.md', content: '', dir: 'ltr' }])
    );
    store.setItem('md-editor-active-file', 'gone');
    expect(loadWorkspace(store).activeId).toBe('a');
  });

  it('repairs a corrupt files entry instead of throwing', () => {
    store.setItem('md-editor-files', 'not json');
    expect(() => loadWorkspace(store)).not.toThrow();
    expect(loadWorkspace(store).documents).toHaveLength(1);
  });

  it('fills in a missing dir from the global fallback', () => {
    store.setItem('md-editor-dir', 'rtl');
    store.setItem('md-editor-files', JSON.stringify([{ id: 'a', name: 'x.md', content: '' }]));
    expect(loadWorkspace(store).documents[0]?.dir).toBe('rtl');
  });

  it('caps a runaway workspace at the legacy limit', () => {
    const many = Array.from({ length: 150 }, (_, i) => ({
      id: `d${i}`,
      name: `${i}.md`,
      content: '',
      dir: 'ltr',
    }));
    store.setItem('md-editor-files', JSON.stringify(many));
    expect(loadWorkspace(store).documents).toHaveLength(100);
  });
});

describe('saveWorkspace', () => {
  it('writes the exact legacy keys', () => {
    const doc = newDoc('a.md', 'x', 'ltr');
    saveWorkspace(store, [doc], doc.id);
    expect(JSON.parse(store.getItem('md-editor-files') ?? 'null')).toEqual([doc]);
    expect(store.getItem('md-editor-active-file')).toBe(doc.id);
  });
});

describe('uniqueName', () => {
  it('appends a counter on collision', () => {
    const docs = [newDoc('note.md', '', 'ltr'), newDoc('note-2.md', '', 'ltr')];
    expect(uniqueName('note.md', docs)).toBe('note-3.md');
  });

  it('lets a document keep its own name', () => {
    const docs = [newDoc('note.md', '', 'ltr')];
    expect(uniqueName('note.md', docs, docs[0]?.id)).toBe('note.md');
  });
});
