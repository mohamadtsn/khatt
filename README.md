<div align="center">

# Khatt

**A fast, distraction-free, bidirectional Markdown editor that runs entirely in the browser.**

No backend. No tracking. Zero network requests after load. Fully offline-capable.

</div>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/screenshot-dark.png">
    <img alt="Khatt Editor Screenshot" src="assets/screenshot-light.png" width="100%">
  </picture>
</p>

---

## Overview

Khatt is a client-side writing environment built for speed, privacy, and precision. It pairs a raw Markdown source editor with a live rendered preview that is itself fully editable (`contenteditable`). Changes made in the preview serialize back to Markdown through a unified AST pipeline without degrading document formatting.

Every document is stored locally in the browser (`localStorage`). Once loaded, the application operates entirely offline without making external network calls.

---

## Key Capabilities

### Bidirectional Live Editing
- **Dual-Pane Sync**: Left pane provides raw Markdown editing powered by CodeMirror 6. Right pane displays rendered HTML.
- **Editable Preview**: Click and type directly into the rendered output. Selecting text displays an inline formatting toolbar for headings, lists, tables, links, and text styles. Changes serialize back into clean Markdown.
- **Surgical Checkbox Toggle**: Toggling interactive task lists (`- [ ]` / `- [x]`) updates the raw markdown source at the exact character offset without reformatting the surrounding document.
- **Synchronized Scrolling**: Proportional sync-scroll keeps source and preview aligned during navigation (can be toggled on/off).

### Performance & Lazy Loading
- **Zero Idle Overhead**: Heavy rendering engines (Mermaid for diagrams, KaTeX for math, and Shiki for code syntax highlighting) are split into isolated chunks. They are downloaded and executed only when a document contains matching blocks. A document with no diagrams downloads 0 bytes of Mermaid.
- **Theme-Aware Re-rendering**: Diagram and code blocks track the theme under which they were generated and re-render only when switching between light and dark modes.

### Privacy & Offline-First (PWA)
- **100% Client-Side**: No backend, no telemetry, no analytics, no external CDN dependencies at runtime.
- **Installable PWA**: Pre-caches the application shell via Serwist. Functions completely without an internet connection.
- **Multi-Document Workspace**: Built-in explorer sidebar to create, rename, switch, and delete documents. Includes drag-and-drop `.md` file import and automatic local persistence.

### Internationalization & Comfort
- **First-Class RTL**: Native right-to-left layout and typography with the Vazirmatn font stack for Persian, Arabic, and Hebrew. Direction state is preserved independently per document.
- **Reading Mode**: Distraction-free, full-width presentation mode with an optional edit lock to prevent accidental changes.
- **System-Aware Theming**: Supports light, dark, and system themes. Initialized via a blocking head script to eliminate flash-of-unstyled-theme (FOUC) and hydration mismatches.

### Export & Clipboard
- **Export**: Download as raw Markdown (`.md`), standalone self-contained HTML (`.html`), or vector-clean PDF (via the browser print engine with a dedicated print stylesheet).
- **Clipboard**: Copy content directly as formatted Markdown, rendered HTML, or plain text.

---

## Markdown Syntax Support

The parser pipeline implements GitHub Flavored Markdown (GFM), math typesetting, footnotes, and front matter:

| Syntax | Description | Example |
| :--- | :--- | :--- |
| `**bold**` / `*italic*` / `~~strike~~` | Inline text emphasis | **bold**, *italic*, ~~strike~~ |
| `` `code` `` | Inline code span | `const x = 42;` |
| `# H1` … `###### H6` | Headings (level 1 to 6) | `## Section Title` |
| `> quote` | Blockquotes | `> Quoted text block` |
| `- item` / `1. item` | Unordered and ordered lists | Indent with 2/4 spaces to nest |
| `- [ ]` / `- [x]` | Interactive task checkboxes | `- [x] Completed task` |
| `[text](url)` or `<url>` | Hyperlinks and bare URLs | `[Link](url)` |
| `[text][ref]` + `[ref]: url` | Reference-style links | Resolves against reference definition |
| `![alt](image.png)` | Embedded images | `![Logo](icon.svg)` |
| <code>\`\`\`lang</code> | Syntax-highlighted code blocks | Powered on demand by Shiki |
| <code>\`\`\`mermaid</code> | Dynamic diagrams & flowcharts | Powered on demand by Mermaid |
| `$x^2$` / `$$\int f(x)dx$$` | Inline and block LaTeX math | Powered on demand by KaTeX |
| `text[^1]` + `[^1]: note` | Footnotes | Collates into linked notes at document bottom |
| `\|:---\|:---:\|---:\|` | Tables with column alignment | Left, center, and right alignments |
| `---` | YAML front matter panel | Rendered as an inert, editable metadata block |

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl` / `Cmd` + `S` | Export / Save document as `.md` |
| `Ctrl` / `Cmd` + `F` | Open find and replace bar |
| `Ctrl` / `Cmd` + `Z` | Undo (preserves history across batch actions like Replace All) |
| `Enter` | Continue active list, numbered item, or checkbox |
| `Tab` | Indent / nest list item |
| `Shift` + `Tab` | Outdent list item |
| `Esc` | Dismiss find bar, open dialogs, or exit reading mode |

---

## Architecture

### Pure Core & Render Pipeline
The core markdown processing resides in `src/lib/` and is strictly DOM-free and unit-testable in Node.js:

```
Markdown Source
      │
      ▼
remark-parse ──► remark-gfm / remark-math / remark-frontmatter
      │
      ▼
remark-rehype ──► rehype-raw ──► rehype-sanitize
      │
      ▼
footnotes / lazy-blocks / task-list plugins
      │
      ▼
HTML string ──► preview.innerHTML
      │
      ├─► highlightIn()      (Shiki, on demand)
      ├─► renderMathIn()     (KaTeX, on demand)
      └─► renderMermaidIn()  (Mermaid, on demand)
```

### AST Round-Trip Invariant
The return pipeline (`src/lib/markdown/stringify.ts`) shares the parser's configuration (`rehype-parse` → `rehype-remark` → `remark-stringify`) ensuring that `Markdown → HTML → Markdown` reaches an idempotent fixed point after a single pass. Modifying text in the preview preserves formatting across the rest of the document.

### Isolated Editor State
CodeMirror 6 maintains an independent `EditorState` instance per open document inside a memory map. Switching documents swaps state via `view.setState()`, maintaining separate undo/redo stacks per document without custom serialization layers.

---

## Development

### Prerequisites
- Node.js 22+ (Node.js 24 recommended)
- npm

### Setup
```sh
# Clone repository
git clone <repo-url>
cd khatt

# Install dependencies
npm install
```

### Commands
```sh
# Start local development server
npm run dev

# Run unit tests (Vitest)
npm test

# Run type check (TypeScript strict)
npm run typecheck

# Run end-to-end integration tests (Playwright against static export)
npm run e2e

# Build production static export (outputs to out/)
npm run build
```

> **Note on E2E Testing**: `npm run e2e` runs against the static production export (`out/`) rather than the development server to verify that code splitting, PWA caching, and lazy bundle execution behave properly in production.

---

## License

This project is licensed under the terms of the GNU General Public License v3.0 (GPL-3.0). See the [LICENSE](LICENSE) file for details.
