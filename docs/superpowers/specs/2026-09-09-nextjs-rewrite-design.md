# Markdown Editor — Next.js + Tailwind Rewrite

**Date:** 2026-09-09
**Status:** Approved design
**Supersedes:** the vanilla `index.html` / `styles.css` / `app.js` implementation

## 1. Purpose

Rewrite `markdowneditor.ir` on Next.js 16 + Tailwind CSS 4 with an Apple/macOS-native
visual language and PWA support, at **full feature parity** with the current vanilla
build, replacing the hand-written markdown renderer with the unified/remark ecosystem.

Parity is not assumed. It is proved by a golden-snapshot corpus captured from the
*current* renderer before it is removed (§7).

## 2. Fixed constraints

These are forced by the existing deployment and are not open for redesign:

- **Static export.** `output: 'export'`; no server code, no route handlers, no
  server components doing data work. GitHub Pages serves `out/` at the domain in
  `CNAME` (`markdowneditor.ir`).
- **No backend.** All state stays in `localStorage`. No analytics, no accounts, no
  upload. The README states this as a privacy property; it is preserved.
- **Data compatibility.** The new app reads and writes the existing keys unchanged:
  `md-editor-files`, `md-editor-active-file`, `md-editor-theme`, `md-editor-dir`,
  `md-editor-split`, `md-editor-sync`, `md-editor-explorer`, with the legacy
  single-document key `md-editor-content` kept as a migration fallback.
  A returning user opens the site and finds their documents intact.
- **Document shape** stays `{ id, name, content, dir }`, direction per-document with
  `md-editor-dir` as the fallback for new documents.

Third-party libraries are now bundled from our own origin instead of jsDelivr. This
strengthens the privacy property (no cross-origin requests at all) and is required
for the app to work offline.

## 3. Stack

Versions verified against the npm registry on 2026-09-09.

| Package | Version | Role |
| --- | --- | --- |
| `next` | 16.3.4 | App Router, static export |
| `react` / `react-dom` | 19.3.0 | React Compiler enabled |
| `tailwindcss` | 4.3.3 | CSS-first `@theme`, no JS config file |
| `typescript` | 7.0.2 | `strict`, `noUncheckedIndexedAccess` |
| `unified` | 11.0.5 | pipeline |
| `remark-parse` | 11.0.0 | markdown -> mdast |
| `remark-gfm` | 4.0.1 | tables, task lists, strikethrough, autolinks, footnotes |
| `remark-math` | 6.0.0 | `$...$` / `$$...$$` |
| `remark-frontmatter` | latest 5.x | YAML front matter |
| `remark-rehype` | latest 11.x | mdast -> hast |
| `rehype-raw` | 7.0.0 | inline/raw HTML |
| `rehype-sanitize` | 6.0.0 | allowlist |
| `rehype-remark` | 10.0.1 | hast -> mdast (return path) |
| `remark-stringify` | 11.0.0 | mdast -> markdown |
| `@codemirror/*` | 6.x | editing surface |
| `katex` | 0.18.7 | math, dynamic import |
| `mermaid` | 11.17.2 | diagrams, dynamic import |
| `shiki` | 4.4.3 | code highlighting, dynamic import |
| `zustand` | 5.0.15 | application state |
| `serwist` | 9.5.12 | service worker / PWA |
| `vitest` | 5.0.0 | unit tests |
| `@playwright/test` | 1.63.0 | end-to-end tests |

## 4. Module structure

The current 2780-line IIFE becomes bounded modules. Everything under `src/lib/`
is pure and DOM-free, so it is unit-testable without jsdom; those same tests are
what make the parity claim checkable.

```
src/
  app/
    layout.tsx            # <head> theme/dir bootstrap script, fonts, manifest
    page.tsx              # 'use client' shell; export const dynamic = 'force-static'
  lib/markdown/
    parse.ts              # markdown -> hast
    stringify.ts          # hast -> markdown (mirror configuration of parse)
    sanitize-schema.ts     # allowlist derived from the current sanitize()
    plugins/
      front-matter.ts     # renders YAML block as the inert data-fm panel
      non-editable.ts     # contenteditable="false" on generated blocks
      code-blocks.ts      # marks mermaid / math / highlight targets for the lazy pass
  lib/storage/
    workspace.ts          # documents, active id, migration from legacy keys
    prefs.ts              # theme, dir, split, sync, explorer
  lib/lazy/
    mermaid.ts katex.ts shiki.ts   # one shared ensure<X>() contract
  lib/export/
    html.ts pdf.ts markdown.ts clipboard.ts
  state/
    documents.ts ui.ts    # zustand stores
  components/
    editor/               # CodeMirror view + extensions
    preview/              # contenteditable preview, return path, selection toolbar
    chrome/               # Sidebar, Toolbar, Menus, Dialogs, Toasts, StatusBar, FindBar
    ui/                   # design-system primitives
```

## 5. Render pipeline

Forward (source of truth = the CodeMirror document):

```
doc text
  -> parse.ts      remark-parse + gfm + math + frontmatter
                   -> remark-rehype (allowDangerousHtml)
                   -> rehype-raw
                   -> rehype-sanitize (sanitize-schema)
                   -> custom plugins (front matter panel, non-editable, lazy markers)
  -> React render into the preview element
  -> lazy passes: mermaid / katex / shiki
  -> debounced persist to localStorage
```

The lazy passes run **after** sanitization, deliberately: they inject trusted
library output (SVG, KaTeX markup, highlight spans) that the sanitizer would strip.
They must never be moved inside the sanitize step. This constraint carries over
verbatim from the current implementation.

Return path (preview is `contenteditable`):

```
preview DOM -> rehype-remark -> remark-stringify -> new document text
```

Replacing Turndown with `rehype-remark` + `remark-stringify` removes the single
largest source of bugs in the current design: today the renderer and the serializer
are two independent implementations that must be kept hand-tuned to agree, or
editing one word reformats the whole file. Now both directions share one AST and
one configuration:

```
bullet: '-', rule: '-', emphasis: '*', strong: '*',
listItemIndent: 'one', fences: true, resourceLink: false
```

Where a full round trip is too destructive there are still surgical paths, as
today: `toggleTaskInMarkdown()` edits the single `[ ]` / `[x]` character rather
than re-serializing the document. That pattern is preferred for any other small
preview mutation.

Generated blocks (footnote list, front matter panel, diagrams, math) are marked
`contenteditable="false"` so they survive the round trip.

## 6. Editing surface

CodeMirror 6, with one `EditorState` per open document held in a `Map`.

Switching documents calls `view.setState(states.get(id))` rather than assigning
text. This is the direct fix for the constraint documented in section 4b of the
current `app.js`: the native undo stack was unusable because assigning
`editor.value` on a document switch wiped it, which forced a hand-rolled snapshot
history. With per-document states, undo history is preserved for free by
`@codemirror/commands`.

Extensions required:

- markdown language mode with fenced-language support
- smart lists: Enter continues a bullet / number / checkbox, Tab nests
- find & replace wired to our own UI (match count, undoable replace-all)
- RTL: `direction` from the document, per document
- highlight layer for find matches
- synced scrolling hook feeding the preview

## 7. Feature parity contract

Every item below exists today and must exist after the rewrite.

**Workspace:** explorer with multiple open documents; create, rename, close, switch;
import one or more `.md` files; drag & drop onto the window; autosave; workspace
restored on next visit.

**Writing:** live preview in a resizable split; editable preview syncing back to
markdown; selection / right-click formatting toolbar (bold, italic, strike, code,
H1-H6, quote, bullet list, numbered list, checklist, link, table at any size);
find & replace with match count and undoable replacements; smart lists.

**Rendering:** nested lists; checklists as real tickable checkboxes; tables with
`:---:` alignment; syntax highlighting by fence language; mermaid diagrams; inline
and display LaTeX; footnotes collected into a linked list; autolinks; reference
links; inline raw HTML including `<details>`; YAML front matter panel.

**Output:** export Markdown, PDF via the browser print engine (text stays
selectable), and a self-contained HTML file; copy as Markdown, HTML or plain text.

**Comfort:** reading mode, editable by default, with a lock button for a fully
read-only view; dark and light themes remembered between visits; full RTL support
remembered per document; toggleable sync scroll; word and character counts.

**Shortcuts:** `Ctrl/Cmd+S` save, `Ctrl/Cmd+F` find, `Ctrl/Cmd+Z` undo including
Clear and Replace-all, `Enter` continue list, `Tab` indent, `Esc` close find bar /
dialog / reading mode.

**Additions in this rewrite:** PWA (installable, fully functional offline), a
`system` theme option alongside light and dark, and complete keyboard access with
focus trapping in menus and dialogs.

## 8. Design system

Documented as a living reference in `DESIGN.md` at the repository root, separate
from this spec: this file records the decision, `DESIGN.md` records the system so
later work can extend it without re-deriving the rules.

Tokens are declared with Tailwind v4 `@theme` in three layers: primitive raw values,
semantic roles (`--color-surface-raised`, `--color-text-secondary`), then component
tokens.

**Materials and depth.** Sidebar and toolbar use `backdrop-filter: blur(30px)
saturate(180%)` over a translucent ground - Finder vibrancy. Every raised surface
carries a 1px top highlight (`inset 0 1px 0 rgb(255 255 255 / .08)`); this is what
reads as glass rather than a flat card. Shadows are multi-layer and low-contrast,
never a single dark `box-shadow`.

**Typography.** System font stack (`-apple-system` -> SF Pro) with **Vazirmatn** as
the Persian/RTL fallback. `font-optical-sizing: auto`. Negative tracking on
headings (`-0.02em` at 28px and above, zero in body). Leading 1.5 body, 1.2
headings. Preview body measures 68ch on a 4px vertical rhythm.

**Color.** Complete light and dark palettes plus a `system` mode following
`prefers-color-scheme`, with no flash on load (§4 bootstrap script). Accent color is
not user-configurable.

**Focus and accessibility.** 2px focus ring with offset, `:focus-visible` only.
AA contrast throughout, AAA for preview body text. Menus and dialogs are fully
keyboard operable with focus trapping and correct `aria-*` - the current build
implements this only partially.

**Motion.** Springs, not linear easing. UI transitions approximate
`spring(stiffness 300, damping 30)`; gesture-driven motion (divider drag, sidebar
open/close) is genuinely interruptible and tracks the pointer without a jump when
grabbed mid-animation. Only `transform` and `opacity` animate - never `width`,
`height` or `filter`. Menus pop in over 160ms with transform-origin on their
trigger; toasts spring up from the bottom; document switch crossfades over 120ms;
ticking a checkbox scales briefly over 90ms. `prefers-reduced-motion: reduce`
reduces everything to a crossfade of 100ms or less rather than removing feedback
entirely.

## 9. PWA

`serwist` 9.5.12. The static shell is precached, so offline means the app is fully
functional rather than showing a fallback page. The dynamic imports (mermaid,
katex, shiki) are deliberately **not** precached - that would break the "a document
with no diagram costs zero bytes" property - and instead go in a runtime cache,
entering it the first time a document actually uses one.

Manifest with maskable icons, `display: standalone`, and the File Handling API so
`.md` files can be opened from the OS where the browser supports it.

## 10. Testing

The claim "no bugs" is only meaningful if it is checkable. Five layers:

1. **Golden parity corpus.** Markdown fixtures covering every row of the README
   syntax table plus the edge cases the current renderer handles explicitly: code
   spans containing backticks, deeply nested lists, tables with empty cells,
   footnotes referenced twice, raw HTML inside a list item, a lone `$` that must not
   become math, unsafe schemes in links and images. A one-off Node script captures
   the **current** renderer's output as the golden snapshot before `app.js` is
   deleted. Every divergence is then either fixed or recorded explicitly as an
   intentional improvement.
2. **Fixed-point round trip.** For each fixture, `md -> hast -> md` must equal the
   normalized input. This is what guarantees that typing one word in the preview
   does not reformat the file.
3. **Sanitizer security tests.** XSS vectors including the ones the current code
   handles by hand: `on*` attributes, `javascript:` and `vbscript:` hrefs,
   `data:text/html`, SVG carrying script. All must be neutralized.
4. **End-to-end (Playwright)** over real user paths: create / rename / close a
   document, undo after Clear, find & replace with count, theme flip re-theming
   mermaid, PDF and HTML export, drag & drop import, per-document RTL, and
   workspace restoration after reload.
5. **TDD.** Each unit's test is written before its implementation.

## 11. Deployment

GitHub Actions builds the static export and publishes `out/` to GitHub Pages.
`CNAME` is untouched.

## 12. Removal of the old build

`index.html`, `styles.css` and `app.js` stay in the tree until the end. They are the
behavioral reference and the source of the golden snapshots. They are deleted only
in the final step, once parity tests pass.
