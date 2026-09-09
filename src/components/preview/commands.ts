import type { EditorView } from '@codemirror/view';
import { findSourceRange } from './source-range';

export type InlineCommand = 'bold' | 'italic' | 'strike' | 'code';
export type BlockCommand =
  | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  | 'quote' | 'bullet' | 'ordered' | 'checklist';

/* The spellings the parser round-trips. They match stringify.ts on purpose: a
   command that emitted a different spelling would be rewritten on the next
   preview edit. */
const WRAPPERS: Record<InlineCommand, string> = {
  bold: '**',
  italic: '*',
  strike: '~~',
  code: '`',
};

const LINE_PREFIX: Record<BlockCommand, (index: number) => string> = {
  h1: () => '# ',
  h2: () => '## ',
  h3: () => '### ',
  h4: () => '#### ',
  h5: () => '##### ',
  h6: () => '###### ',
  quote: () => '> ',
  bullet: () => '- ',
  ordered: (i) => `${i + 1}. `,
  checklist: () => '- [ ] ',
};

/** Everything a line can already start with, so a command replaces rather than stacks. */
const EXISTING_PREFIX = /^\s*(?:#{1,6}\s+|>\s+|[-*+]\s+(?:\[[ xX]\]\s+)?|\d+[.)]\s+)?/;

/** Each command is one dispatch, so the undo history records it as one step. */
export function applyInline(view: EditorView, selected: string, command: InlineCommand): boolean {
  const range = findSourceRange(view, selected);
  if (!range) return false;
  const mark = WRAPPERS[command];
  const already =
    view.state.doc.sliceString(Math.max(0, range.from - mark.length), range.from) === mark &&
    view.state.doc.sliceString(range.to, range.to + mark.length) === mark;

  view.dispatch(
    already
      ? {
          changes: [
            { from: range.from - mark.length, to: range.from, insert: '' },
            { from: range.to, to: range.to + mark.length, insert: '' },
          ],
        }
      : { changes: { from: range.from, to: range.to, insert: `${mark}${range.text}${mark}` } }
  );
  return true;
}

export function applyBlock(view: EditorView, selected: string, command: BlockCommand): boolean {
  const range = findSourceRange(view, selected);
  if (!range) return false;
  const first = view.state.doc.lineAt(range.from);
  const last = view.state.doc.lineAt(range.to);

  const changes = [];
  let index = 0;
  for (let n = first.number; n <= last.number; n++) {
    const line = view.state.doc.line(n);
    if (line.text.trim() === '') continue;
    const stripped = line.text.replace(EXISTING_PREFIX, '');
    changes.push({
      from: line.from,
      to: line.to,
      insert: `${LINE_PREFIX[command](index++)}${stripped}`,
    });
  }
  if (changes.length === 0) return false;
  view.dispatch({ changes });
  return true;
}

export function applyLink(view: EditorView, selected: string, href: string): boolean {
  const range = findSourceRange(view, selected);
  if (!range) return false;
  view.dispatch({
    changes: { from: range.from, to: range.to, insert: `[${range.text}](${href})` },
  });
  return true;
}

/** A GFM table of the requested size, inserted on its own lines after the selection. */
export function insertTable(view: EditorView, selected: string, rows: number, cols: number): boolean {
  const range = findSourceRange(view, selected);
  const at = range ? view.state.doc.lineAt(range.to).to : view.state.selection.main.head;
  const header = `| ${Array.from({ length: cols }, (_, c) => `Column ${c + 1}`).join(' | ')} |`;
  const rule = `| ${Array.from({ length: cols }, () => '---').join(' | ')} |`;
  const body = Array.from(
    { length: rows },
    () => `| ${Array.from({ length: cols }, () => '   ').join(' | ')} |`
  );
  view.dispatch({
    changes: { from: at, insert: `\n\n${[header, rule, ...body].join('\n')}\n` },
  });
  return true;
}
