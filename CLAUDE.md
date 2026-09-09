# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Khatt: A fast client-side markdown editor. Next.js 16 App Router, React 19, Tailwind CSS 4, TypeScript strict. There is no backend and no runtime network access: everything is `localStorage`, and every third-party library is bundled and served from our own origin.

The document carrying the reasoning behind the design system:

- `DESIGN.md` — the living design system (tokens, materials, motion, accessibility). Extend it rather than re-deriving its rules.

## Commands

```sh
npm run dev        # http://localhost:3000
npm test           # Vitest, node environment — everything under src/lib/ is DOM-free
npm run e2e        # Playwright, against the real static export (not the dev server)
npm run typecheck  # tsc --noEmit
npm run build      # static export into out/
```

`npm run e2e` builds and serves `out/` on purpose. The dev server hands over every module eagerly, which would make the "a document with no diagram fetches zero diagram bytes" assertions pass without meaning anything.

The build runs through webpack (`next build --webpack`) because `@serwist/next` configures webpack, which Next 16 otherwise no longer uses.

## Architecture

**The pure core is `src/lib/`.** No DOM, no React, so it is unit-testable in Node. React components are a thin shell over it.

**The render pipeline** (`src/lib/markdown/parse.ts`) is the spine:

```
markdown → remark-parse → remark-gfm / remark-math / remark-frontmatter
         → remark-rehype → rehype-raw → rehype-sanitize
         → footnotes / lazy-blocks / task-list plugins
         → HTML string → preview.innerHTML
         → highlightIn() / renderMathIn() / renderMermaidIn()
```

Three rules hold this together:

1. **Lazy passes run after sanitization, never inside it.** Mermaid, KaTeX and Shiki inject trusted library output that the sanitizer would strip. The same applies to the footnotes plugin, which is the *only* code allowed to introduce an `id` — the schema deliberately strips every id that came from the document, so a document can never shadow one of the app's own elements.

2. **The return path shares the forward path's configuration.** `stringify.ts` (rehype-parse → rehype-remark → remark-stringify) must emit exactly the spellings `parse.ts` accepts. `tests/unit/markdown/round-trip.test.ts` enforces this: `md → HTML → md` must reach a fixed point after one pass. If it does not, editing one word in the preview reformats the whole document. Do not weaken that test to make a change pass.

3. **Where a full round trip is too destructive there are surgical paths.** `toggleTask()` flips one `[ ]`/`[x]` character rather than re-serializing. Prefer that pattern for other small preview mutations. Generated blocks (footnotes, front matter, diagrams, math) are `contenteditable="false"` so the round trip survives them, and their markdown source rides along in `data-fm` / `data-mmd` / `data-tex` / `data-fn-src`.

**Parity with the previous build is a test, not a claim.** The old hand-written renderer's output was captured as golden snapshots (`tests/golden/`) before it was deleted. `tests/unit/markdown/parity.test.ts` compares every render against them, and any difference must be justified in `tests/golden/DIVERGENCES.md` or the test fails. The old build is recoverable at tag `pre-rewrite`.

**Editing surface.** CodeMirror 6, with **one `EditorState` per document** held in a `Map` and switched with `view.setState()`. That is why undo history is per-document and needs no hand-rolled snapshot stack. Anything that should stay undoable goes through a single `view.dispatch` — one dispatch is one undo step, which is what makes "Replace all" and "Clear" reversible in one keystroke. `isolateHistory` is used where a command would otherwise merge into the edit before it.

**State.** Two zustand stores, `src/state/documents.ts` and `src/state/ui.ts`. Persistence is a side effect of every mutation, so no path through a store can leave `localStorage` stale.

**Persistence keys are a compatibility contract** with the previous build and must not change: `md-editor-files`, `md-editor-active-file`, `md-editor-theme`, `md-editor-dir`, `md-editor-split`, `md-editor-sync`, `md-editor-explorer`. `md-editor-content` is a legacy single-document key, read-only, kept as a migration fallback. Documents are `{ id, name, content, dir }`; direction is per-document with `md-editor-dir` as the fallback for new ones.

**Theming.** A blocking inline script in `<head>` (`src/app/layout.tsx`) stamps `data-theme` before first paint. React must never read the stored theme during render — that is what causes a hydration mismatch and a flash of the wrong palette. Dark is defined twice in `globals.css`, once under a guarded media query for the "system" setting and once under `[data-theme="dark"]`; both are needed for the toggle to win in both directions. The lazy renderers re-theme by recording the theme they rendered under in `data-rendered` / `data-hl`, so a flip re-renders each block exactly once.

**PWA.** Serwist precaches the shell. Mermaid, KaTeX and Shiki are deliberately *excluded* from the precache manifest — precaching them would cost every user the bytes the lazy-loading design exists to avoid. They enter the runtime cache the first time a document needs one.

## Conventions

- Comments explain *why*, usually the non-obvious constraint that forced the code. Match that register; don't add narrating comments.
- Components may only use semantic design tokens (`--color-*`, `--shadow-*`, `--radius-*`, `--dur-*`), never the primitive scale. See `DESIGN.md`.
- Animate `transform` and `opacity` only. Never `width`, `height`, `filter` or `backdrop-filter`.
- Icon-only buttons always carry a `label` prop, which becomes `aria-label`; E2E tests address controls by those accessible names, so renaming one is a breaking change to the test suite.
- New icons are a `<symbol id="i-…">` in `src/components/ui/Icon.tsx`, referenced by name through `<Icon name="…" />`.
- When adding a markdown feature, add a fixture to `tests/fixtures/`, update the "Markdown it understands" table in `README.md`, and check the round-trip test still reaches a fixed point.
