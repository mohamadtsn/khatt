'use client';
import { useEffect, useState } from 'react';
import { useDocuments } from '@/state/documents';
import { toast } from '@/components/ui/Toast';

const ACCEPTED = /\.(md|markdown|txt)$/i;

export function DropZone() {
  const [over, setOver] = useState(false);

  useEffect(() => {
    const onDragOver = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return;
      e.preventDefault();
      setOver(true);
    };
    const onDragLeave = () => setOver(false);
    const onDrop = async (e: DragEvent) => {
      const files = [...(e.dataTransfer?.files ?? [])].filter((f) => ACCEPTED.test(f.name));
      if (files.length === 0) return;
      e.preventDefault();
      setOver(false);
      const read = await Promise.all(
        files.map(async (f) => ({ name: f.name, content: await f.text() }))
      );
      useDocuments.getState().importFiles(read);
      toast(read.length === 1 ? `Opened ${read[0]?.name}` : `Opened ${read.length} files`);
    };

    document.addEventListener('dragover', onDragOver);
    document.addEventListener('dragleave', onDragLeave);
    document.addEventListener('drop', onDrop);
    return () => {
      document.removeEventListener('dragover', onDragOver);
      document.removeEventListener('dragleave', onDragLeave);
      document.removeEventListener('drop', onDrop);
    };
  }, []);

  if (!over) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-3 z-[150] rounded-[var(--radius-xl)]
                 border-2 border-dashed border-[var(--color-accent)]
                 bg-[color-mix(in_oklch,var(--color-accent)_8%,transparent)]"
    />
  );
}
