import { keymap } from '@codemirror/view';
import { EditorSelection, type Extension } from '@codemirror/state';

const BULLET = /^(\s*)([-*+])\s+(\[[ xX]\]\s+)?(.*)$/;
const ORDERED = /^(\s*)(\d+)([.)])\s+(\[[ xX]\]\s+)?(.*)$/;

/** The prefix a new line should carry, `''` to end the list, `null` if not a list. */
export function continuationFor(line: string): string | null {
  const ordered = line.match(ORDERED);
  if (ordered) {
    const [, indent = '', number = '1', delimiter = '.', task, body = ''] = ordered;
    if (body.trim() === '') return '';
    const next = String(Number(number) + 1);
    return `${indent}${next}${delimiter} ${task ? '[ ] ' : ''}`;
  }
  const bullet = line.match(BULLET);
  if (bullet) {
    const [, indent = '', marker = '-', task, body = ''] = bullet;
    if (body.trim() === '') return '';
    return `${indent}${marker} ${task ? '[ ] ' : ''}`;
  }
  return null;
}

/* Enter continues the current bullet, number or checkbox; on an empty item it
   clears the item instead, which is how a list is ended without reaching for the
   mouse. */
export const smartLists: Extension = keymap.of([
  {
    key: 'Enter',
    run(view) {
      const { state } = view;
      const range = state.selection.main;
      if (!range.empty) return false;
      const line = state.doc.lineAt(range.head);
      if (range.head !== line.to) return false;
      const prefix = continuationFor(line.text);
      if (prefix === null) return false;

      if (prefix === '') {
        view.dispatch({
          changes: { from: line.from, to: line.to, insert: '' },
          selection: EditorSelection.cursor(line.from),
          userEvent: 'input',
        });
        return true;
      }
      view.dispatch({
        changes: { from: range.head, insert: `\n${prefix}` },
        selection: EditorSelection.cursor(range.head + 1 + prefix.length),
        userEvent: 'input',
      });
      return true;
    },
  },
]);
