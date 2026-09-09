# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A zero-dependency, client-side markdown editor served as a static site at `markdowneditor.ir` (GitHub Pages via `CNAME`). Four files matter: `index.html`, `styles.css`, `app.js`, and `README.md`.

## Commands

There is no build, no package manager, no test suite, no linter. The site *is* the source.

```sh
python3 -m http.server 8000      # then open http://localhost:8000
```

`file://` also works — `app.js` is a plain IIFE, deliberately not `type="module"`, so the app opens without a server. Verification is manual: open the page and exercise the feature.

## Architecture

`app.js` is a single ~2700-line IIFE split into numbered sections (`/* === N. Title === */`), listed in a table of contents at the top of the file. Section numbers are referenced from comments in `styles.css` (e.g. "rendered by app.js §3b"), so keep numbering stable and update both sides when sections move.

**The render pipeline** (`update()`, §4) is the spine:

```
editor.value → render()  (§1, hand-written markdown → HTML)
             → sanitize() (allowlist of tags/attrs, kills on* handlers and unsafe schemes)
             → preview.innerHTML
             → scheduleMermaidRender() / scheduleMathRender() / scheduleHighlight()
             → persist() (debounced localStorage write)
```

Lazy renderers run *after* sanitize on purpose: they inject trusted library output (Mermaid SVG, KaTeX, highlight.js) that the sanitizer would strip. Never move them inside the sanitize step.

**Bidirectional editing.** The preview is `contenteditable`. Typing there runs `syncPreviewToMarkdown()` (§5), which serializes the preview through Turndown back into `editor.value` — a full-document rewrite. Because of that, the Turndown rules in `getTurndown()` are tuned to emit exactly the spellings `render()` accepts (`~~strike~~`, `- ` bullets with 2-space nesting, `---` rules), otherwise editing one word reformats the entire file. Any change to the renderer's accepted syntax needs a matching Turndown rule.

Where a full round trip is too destructive there are surgical paths instead — e.g. `toggleTaskInMarkdown()` edits the single `[ ]`/`[x]` character rather than re-serializing. Prefer that pattern for other small preview mutations.

Generated blocks (footnotes, front matter, diagrams, math) are marked `contenteditable="false"` so the round trip survives.

**Lazy third-party loading.** Nothing external is on the critical path. Mermaid (ESM import), KaTeX, highlight.js and Turndown are fetched from jsDelivr, pinned by version, only the first time a document actually needs them (`ensureMermaid`, `ensureKatex`, `ensureHljs`, `ensureTurndown`). A document with no diagram costs zero bytes. Preserve this — it's a stated privacy property in the README.

**Undo** (§4b) does not use the textarea's native stack, because assigning `editor.value` on document switch wipes it. Each document gets its own snapshot history in a `Map`, never persisted. Editor mutations that should stay undoable go through `typeText()`/`deleteRange()` (`document.execCommand`), not direct `.value` assignment.

**Persistence.** All state is `localStorage`, keys defined together in §3 (`md-editor-files`, `md-editor-active-file`, `md-editor-theme`, `md-editor-dir`, `md-editor-split`, `md-editor-sync`, `md-editor-explorer`). `md-editor-content` is a legacy single-document key kept only as a migration fallback in `loadWorkspace()`. Documents are an array of `{id, name, content, dir}`; direction is per-document, with `DIR_KEY` as the fallback for new ones.

**Theming** is CSS custom properties under `[data-theme]` in `styles.css`. Three JS-side rethemers must be called when the theme flips: `rethemeMermaid()`, `rethemeHljs()` (swaps the stylesheet href), and the KaTeX path which inherits CSS.

## Conventions

- Comments explain *why*, often the non-obvious constraint that forced the code (see the undo, Turndown and checkbox-attribute comments). Match that register; don't add narrating comments.
- Terse style: compact one-line functions, `;`-terminated, minimal whitespace around operators.
- Everything stays inside the IIFE — nothing may leak to `window`, since this file defines names like `render`, `update`, `save` and `main` that would collide with CDN globals.
- New icons are `<symbol id="i-…">` in the inline SVG sprite at the top of `index.html`, referenced by `<use href="#i-…">`.
- The header's DOM order is the narrow-screen order; desktop layout reorders with CSS.
- When adding a markdown feature, update the "Markdown it understands" or "Features" table in `README.md`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
