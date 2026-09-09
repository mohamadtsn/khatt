/* The icon set is carried over verbatim from the legacy build's inline sprite, so
   every glyph the previous interface used is still available under the same name.
   The sprite is mounted once in the root layout; icons reference it with <use>. */
export type IconName = 'both' | 'brand' | 'clear' | 'copy' | 'dir' | 'editor' | 'explorer' | 'export' | 'lock' | 'more' | 'open' | 'preview' | 'read' | 'sync' | 'theme' | 'unlock';

export function IconSprite() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
      <defs>
<symbol id="i-brand" viewBox="0 0 32 32">
    <path d="M7.36 13.41Q7.1 13.14 7.1 12.78Q7.1 12.4 7.39 12.1L12.06 7.45Q12.39 7.12 12.79 7.12Q13.15 7.12 13.41 7.38L26.78 20.75Q27.04 21.01 27.04 21.35Q27.04 21.77 26.71 22.1L22.01 26.8Q21.71 27.06 21.33 27.06Q20.98 27.06 20.74 26.82L7.36 13.41ZM10.65 6.05L6.02 10.68Q5.67 11.03 5.26 11.03Q4.91 11.03 4.67 10.78Q4.6 10.71 4.46 10.55Q4.32 10.39 4.15 10.19Q3.99 10 3.82 9.8Q3.64 9.59 3.52 9.45Q3.26 9.15 3.13 8.7Q3 8.25 3 7.73Q3 6.9 3.34 5.99Q3.68 5.09 4.39 4.38Q5.12 3.65 5.97 3.34Q6.82 3.03 7.6 3.03Q8.15 3.03 8.63 3.16Q9.11 3.29 9.44 3.53L10.78 4.69Q10.98 4.95 10.98 5.28Q10.98 5.72 10.65 6.05ZM27.73 28.71L23.49 27.9Q23.36 27.85 23.22 27.81Q23.11 27.77 23.01 27.69Q22.83 27.52 22.83 27.29Q22.83 26.94 23.21 26.56L26.65 23.11Q26.83 22.97 27.01 22.87Q27.18 22.76 27.36 22.76Q27.5 22.76 27.71 22.91Q27.89 23.14 27.97 23.42L28.76 27.67L28.79 27.9Q28.79 28.25 28.59 28.51Q28.31 28.72 27.94 28.72Q27.81 28.72 27.73 28.71Z" fill="currentColor" stroke="none"/>
  </symbol>
  <symbol id="i-export" viewBox="0 0 24 24">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>
  </symbol>
  <symbol id="i-copy" viewBox="0 0 24 24">
    <rect x="9" y="9" width="13" height="13" rx="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </symbol>
  <symbol id="i-read" viewBox="0 0 24 24">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </symbol>
  <symbol id="i-both" viewBox="0 0 24 24">
    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18"/>
  </symbol>
  <symbol id="i-editor" viewBox="0 0 24 24">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/>
  </symbol>
  <symbol id="i-preview" viewBox="0 0 24 24">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </symbol>
  <symbol id="i-theme" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9"/><path d="M12 3v18a9 9 0 0 0 0-18z" fill="currentColor" stroke="none"/>
  </symbol>
  <symbol id="i-more" viewBox="0 0 24 24">
    <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none"/>
    <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>
    <circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none"/>
  </symbol>
  <symbol id="i-clear" viewBox="0 0 24 24">
    <path d="M3 6h18"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </symbol>
  <symbol id="i-open" viewBox="0 0 24 24">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </symbol>
  <symbol id="i-sync" viewBox="0 0 24 24">
    <path d="M7 21V3"/><path d="M3 7l4-4 4 4"/><path d="M17 3v18"/><path d="M13 17l4 4 4-4"/>
  </symbol>
  <symbol id="i-dir" viewBox="0 0 24 24">
    <path d="M3 12h18"/><path d="M7 8l-4 4 4 4"/><path d="M17 8l4 4-4 4"/>
  </symbol>
  <symbol id="i-explorer" viewBox="0 0 24 24">
    <path d="M3 4h7l2 3h9v13H3z"/><path d="M3 9h18"/>
  </symbol>
  <symbol id="i-lock" viewBox="0 0 24 24">
    <rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>
  </symbol>
  <symbol id="i-unlock" viewBox="0 0 24 24">
    <rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 7.4-2.1"/>
  </symbol>
      </defs>
    </svg>
  );
}

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    /* Icons are decoration: the accessible name lives on the button that owns them. */
    <svg
      className={className}
      aria-hidden="true"
      focusable="false"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <use href={`#i-${name}`} />
    </svg>
  );
}
