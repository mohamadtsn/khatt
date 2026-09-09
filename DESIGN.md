# Design System

The living reference for this app's interface. `docs/superpowers/specs/` records
what was decided once; this file records the system, so later work extends it
without re-deriving the rules.

## Principles

1. **The document is the interface.** Chrome recedes; the text does not compete
   with it. Anything that is not the user's words is quieter than the words.
2. **Depth, not decoration.** Surfaces are separated by material and light, not
   by borders and boxes. If a divider can be replaced by a change in elevation,
   replace it.
3. **Motion explains.** Every animation answers "where did that come from" or
   "where did that go". Motion that answers neither is removed.
4. **Restraint.** One accent colour, one shadow family, four radii. A new value
   must justify why an existing one cannot serve.

## Tokens

Defined in `src/app/globals.css` in three layers.

**Primitive** (`--gray-*`, `--blue-*`, `--red-*`, radii, durations, easing,
fonts). Raw values. Components must not reference these.

**Semantic** — the only layer components may use:

| Token | Use |
| --- | --- |
| `--color-canvas` | the page ground behind everything |
| `--color-surface` | translucent chrome (sidebar, toolbar) |
| `--color-surface-raised` | overlays that float above chrome (menus, dialogs) |
| `--color-border` | hairlines between areas |
| `--color-border-strong` | a border that must be seen, e.g. a focused input |
| `--color-text-primary` | body and headings |
| `--color-text-secondary` | labels, secondary controls |
| `--color-text-tertiary` | metadata, counts, disabled |
| `--color-accent` | the single accent; selection, active state, focus ring |
| `--color-accent-text` | text drawn on top of the accent |
| `--color-danger` | destructive confirmation only |
| `--color-selection` | text selection wash |
| `--color-highlight` | the 1px top edge that makes a material read as glass |
| `--shadow-raised` / `--shadow-overlay` | two elevations, no others |

**Component** — a component may define its own local custom properties, but only
in terms of semantic tokens, never primitives.

Every token has an unconditional definition on bare `:root`. A theme block only
*re*-defines. A colour whose only definition lives inside a media query breaks
the moment the theme changes.

## Themes

Three states: `light`, `dark`, and `system` (the default, which stamps no
attribute and follows `prefers-color-scheme`). Dark is therefore defined twice —
once under the guarded media query for `system`, once under
`[data-theme="dark"]` for the explicit choice — so the toggle wins in both
directions.

The theme is applied by a blocking inline script in `<head>` before first paint.
React never reads the stored theme during render; doing so is what causes the
hydration mismatch and the flash of the wrong palette.

## Materials

`.material` (chrome) and `.material-overlay` (menus, dialogs) are the only two
translucent surfaces. Both carry `backdrop-filter: blur() saturate(180%)` and an
`inset 0 1px 0` top highlight. The highlight is what makes a surface read as
glass lifted off the ground rather than as a flat card; do not omit it.

Never stack one translucent surface directly on another — legibility collapses.
An overlay above chrome uses `.material-overlay`, which is opaque enough to
survive it.

`backdrop-filter` is never animated — it is one of the most expensive properties
to composite. Animate the element's `opacity` or `transform` instead.

Under `prefers-reduced-transparency: reduce` both materials become opaque and
drop the blur.

## Typography

- **UI:** `--font-ui`, resolving to SF on Apple platforms, with **Vazirmatn** in
  the stack for Persian and Arabic.
- **Body measure:** 68ch in the preview. Wider is harder to read; narrower makes
  code blocks and tables cramped.
- **Leading:** 1.5 body, 1.2 headings.
- **Tracking:** `-0.02em` on headings at 28px and above, `0` in body. Tight
  tracking on small text hurts legibility; loose tracking on large text makes it
  look unresolved.
- **Optical sizing:** `font-optical-sizing: auto` on `body`.
- Spacing is in `rem`/`em` so a larger system text size scales the layout with
  the text instead of breaking it.

## Motion

| Interaction | Motion | Duration |
| --- | --- | --- |
| Menu open | pop in, `transform-origin` on the trigger | `--dur-base` (160ms) |
| Dialog open | scale 0.96 -> 1 with a fading scrim | `--dur-base` |
| Toast | spring up from the bottom edge | `--dur-slow` |
| Document switch | crossfade | 120ms |
| Checkbox tick | scale 1 -> 1.18 -> 1 | `--dur-fast` (90ms) |
| Sidebar open/close | translate, interruptible | `--dur-slow` |
| Divider drag | tracks the pointer, no easing | none |

Rules:

- **Only `transform` and `opacity` animate.** Never `width`, `height`, `filter`,
  `backdrop-filter`, or any property that triggers layout.
- **Feedback is on pointer-down, not on release.** A control that only reacts
  when the click completes reads as dead.
- **Gestures are interruptible.** Grabbing the divider or the sidebar mid-animation
  must pick up from where it is, without a jump. Discrete state changes may use
  the CSS `--ease-spring`; anything the user drags is driven from JS against the
  live pointer position, using Pointer Events with `setPointerCapture` so
  tracking survives the pointer leaving the element.
- **Enter and exit along the same path.** A panel that slides in from the left
  dismisses to the left.
- **`prefers-reduced-motion: reduce`** collapses everything to a <=100ms
  crossfade. It does not set `animation: none` — removing feedback entirely is a
  worse experience than a fast one.

## Accessibility

- 2px focus ring, 2px offset, `:focus-visible` only.
- AA contrast throughout; AAA for preview body text. Two token values are set by
  that constraint rather than by taste: `--color-accent` is dark enough that white
  text on it clears 4.5:1, and `--color-text-tertiary` is darker than the grey
  scale's mid step because it is used at 12px. Re-check both with axe before
  lightening either.
- A panel that is closed is `inert`, not merely `aria-hidden` — hidden content
  that still takes Tab focus is worse than either.
- Every menu and dialog is fully keyboard operable, traps focus while open, and
  restores focus to its trigger on close.
- Icon-only buttons always carry `aria-label`.
- The preview is `contenteditable`; generated blocks inside it are
  `contenteditable="false"` and `aria-hidden` where their rendered form conveys
  nothing to a screen reader that the source does not.

## Adding to the system

1. Try to build it from existing semantic tokens first.
2. If a new token is genuinely needed, add it at all three layers and to the
   table above, and add it to `tests/unit/design-tokens.test.ts`.
3. If a new motion pattern is needed, add a row to the motion table with its
   duration, and say what question the motion answers.
