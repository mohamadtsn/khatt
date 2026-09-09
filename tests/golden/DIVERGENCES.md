# Intentional divergences from the legacy renderer

Every entry is a documented, deliberate difference. Format: `<fixture>: <tag>` on
its own line, followed by the reason. The parity test fails on any difference not
listed here.

`reference-links: em`
The legacy renderer ran its emphasis pass over its own generated HTML, so the
`target="_blank"` it had just written was rewritten to `target="<em>blank"` —
visible in `tests/golden/reference-links.html`. That is a bug in the old build;
the new pipeline emits a correct `target`, so the stray `<em>` is gone.

`math: span`
`math: div`
`math: code`
Pending: math is not yet recognised. Removed in Task 7.

`mermaid: div`
Pending: the diagram wrapper is not yet emitted. Removed in Task 7.
