import type { EditorView } from '@codemirror/view';

export interface SourceRange {
  from: number;
  to: number;
  text: string;
}

/* Preview selection -> source range. Matching by text rather than by offset,
   because the rendered DOM and the source do not share coordinates (a heading's
   "#" and a link's target exist in one and not the other). Ambiguity is rare and
   resolved by taking the occurrence nearest the editor's caret, which is where
   the user last worked. */
export function findSourceRange(view: EditorView, selected: string): SourceRange | null {
  const needle = selected.trim();
  if (needle === '') return null;
  const doc = view.state.doc.toString();

  const occurrences: number[] = [];
  for (let at = doc.indexOf(needle); at !== -1; at = doc.indexOf(needle, at + 1)) {
    occurrences.push(at);
  }
  if (occurrences.length === 0) return null;

  const caret = view.state.selection.main.head;
  let best = occurrences[0] ?? 0;
  for (const at of occurrences) {
    if (Math.abs(at - caret) < Math.abs(best - caret)) best = at;
  }
  return { from: best, to: best + needle.length, text: needle };
}
