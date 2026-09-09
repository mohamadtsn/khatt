# Intentional divergences from the legacy renderer

Every entry is a documented, deliberate difference. Format: `<fixture>: <tag>` on
its own line, followed by the reason. The parity test fails on any difference not
listed here.

`reference-links: em`
The legacy renderer ran its emphasis pass over its own generated HTML, so the
`target="_blank"` it had just written was rewritten to `target="<em>blank"` —
visible in `tests/golden/reference-links.html`. That is a bug in the old build;
the new pipeline emits a correct `target`, so the stray `<em>` is gone.


## Additions the parity test does not measure

The test above compares which element types appear. These differences add
structure rather than remove it, so they cannot fail that test — they are
recorded here so a reviewer knows they were deliberate.

**Footnote definitions are wrapped in `<p>`.** remark's footnote definitions hold
block content; the legacy renderer emitted bare text. The round trip reads
`data-fn-src`, not the rendered markup, so the wrapper changes nothing about what
comes back out.

**The footnote list is preceded by a visually hidden `<h2>Footnotes</h2>`.** It
comes from remark-gfm and is a genuine improvement for screen readers, which
otherwise meet an unlabelled list of numbers.

**Mermaid blocks keep a `<pre><code>` fallback inside the wrapper.** The legacy
build did the same; it is what makes a diagram readable before the renderer loads
and if it never loads at all.
