import { useEffect, type RefObject } from 'react';
import { stringify } from '@/lib/markdown/stringify';
import { toggleTask } from '@/lib/markdown/task-toggle';
import { useDocuments } from '@/state/documents';
import { getEditorView } from '@/components/editor/CodeEditor';

/** Long enough that a burst of typing is one write, short enough to feel live. */
const WRITE_BACK_MS = 400;

function replaceDocument(markdown: string): void {
  const view = getEditorView();
  if (view) {
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: markdown },
      userEvent: 'input.preview',
    });
  }
  useDocuments.getState().setContent(useDocuments.getState().activeId, markdown);
}

/* Writing the preview back is a whole-document rewrite, so it is debounced and
   suppressed while the preview itself is the thing being typed into. The caret
   position survives because the render effect refuses to reset innerHTML while
   `data-editing` is set — that guard is the only thing protecting it. */
export function useReturnPath(host: RefObject<HTMLDivElement | null>): void {
  useEffect(() => {
    const root = host.current;
    if (!root) return;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const onInput = () => {
      root.dataset['editing'] = '1';
      clearTimeout(timer);
      timer = setTimeout(() => {
        replaceDocument(stringify(root.innerHTML));
        delete root.dataset['editing'];
      }, WRITE_BACK_MS);
    };

    /* A checkbox is the one mutation where a full round trip is too destructive:
       flipping one character keeps every other line byte-identical. */
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement) || target.type !== 'checkbox') return;
      const boxes = [...root.querySelectorAll('input[type=checkbox]')];
      const index = boxes.indexOf(target);
      if (index === -1) return;
      const { activeId, documents } = useDocuments.getState();
      const doc = documents.find((d) => d.id === activeId);
      if (!doc) return;
      replaceDocument(toggleTask(doc.content, index, target.checked));
    };

    root.addEventListener('input', onInput);
    root.addEventListener('click', onClick);
    return () => {
      clearTimeout(timer);
      root.removeEventListener('input', onInput);
      root.removeEventListener('click', onClick);
    };
  }, [host]);
}
