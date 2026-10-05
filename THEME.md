# Zipline Phase UI Theme

**This file is the contract.** Any AI or human adding, changing or reviewing UI in this repo must
follow it. If a change contradicts this document, the document wins — update the document in the
same commit instead.

The goal of this theme is *purposeful efficiency*: a file-upload-grade interface with technical
precision, one accent colour, zero visual waste, and interactions that feel responsive and direct.
It should read as if a systems engineer designed it, not as if a designer second-guessed it.

---

## 1. Non-negotiables

1. **One accent colour.** `--accent` only. Never introduce a second hue. Colour that means nothing
   must be removed, not greyed.
2. **Structure is drawn with 1px lines**, never with shadows, gradients, glows, or filled blobs.
   Exception: floating layers (modals, dropdowns, drawers) use `--shadow` only.
3. **Mono for labels and UI, grotesk for headings, sans for body.** Never set a paragraph in mono.
   Never use mono larger than 13px. No serif.
4. **Small radii only** (0, 3px, 4px). No pills, no circles, no 50% radius, except 6px status dots
   and progress indicators.
5. **No page-level chrome duplication.** Header, footer, and top navigation live once in
   `app/components/shell.tsx` and are rendered by `app/layout.tsx`. Pages emit content only.
6. **No fabricated data.** Every upload count, file size, bandwidth stat, and timestamp must be
   measured from the database. Never hardcode metrics or usage numbers.
7. **Transparent copy.** Clear instructions over marketing speak. Errors show actual reasons.
   No "Let's get started", no emoji, no artificial friendliness. Short, direct sentences.
8. **Accessibility is non-negotiable:** skip link, focus rings on all interactive elements,
   `aria-*` on custom widgets, full keyboard navigation, `prefers-reduced-motion` respected,
   sufficient contrast on all text (WCAG AA minimum).

---

## 2. Colour

Two themes. **Dark is the default and the base**; light is opt-in behind a confirmation.

| Token | Dark (default) | Light | Used for |
| --- | --- | --- | --- |
| `--bg` | `#0a0a0c` | `#fafaf8` | page background |
| `--bg-2` | `#121214` | `#ffffff` | panels, inputs, elevated surfaces |
| `--bg-3` | `#1a1a1e` | `#f5f3f0` | hover states, focus indicators, code blocks |
| `--line` | `#242429` | `#e8e6e1` | 1px borders, rules, dividers |
| `--line-2` | `#363639` | `#d4d0c8` | stronger borders, focus rings, input strokes |
| `--fg` | `#f2f1ee` | `#0f0f12` | headings, primary text, labels |
| `--fg-2` | `#acacaa` | `#5a5854` | body copy, secondary text, descriptions |
| `--fg-3` | `#6f6d6a` | `#92908b` | tertiary text, hints, timestamps, metadata |
| `--accent` | `#ff6b35` | `#d94e20` | links, focus, progress, status indicators, CTAs |
| `--accent-wash` | `rgba(255,107,53,.08)` | `rgba(217,78,32,.06)` | subtle tints, hover backgrounds |
| `--status-ok` | `#34d399` | `#059669` | success states only |
| `--status-warn` | `#f59e0b` | `#d97706` | warnings, pending states only |
| `--status-err` | `#ef4444` | `#dc2626` | errors, failures only |
| `--shadow` | `0 20px 60px rgba(0,0,0,.6)` | `0 20px 60px rgba(15,15,18,.12)` | modals, popovers, floating menus |
| `--overlay` | `rgba(10,10,12,.75)` | `rgba(250,250,248,.75)` | modal backdrops |

Rules:

- **Never hardcode a hex in a component.** Use tokens. The only literal colours allowed are inside
  the token blocks at the top of `app/globals.css`.
- **Write colour rules for both themes at once.** If a state needs 50% opacity of a colour, use
  tokens: never write `rgba(250,250,248,.5)`, which silently breaks in dark mode.
- Status colours (`--status-*`) are reserved for semantic meaning only. Never use decoratively.
- Focus is always `2px solid var(--accent)` with `outline-offset: 2px`. Never remove it.
- `::selection` is `var(--accent)` background with `var(--bg)` text.

---

## 3. Typography

Two families, loaded once via `@import` at the very top of `app/globals.css` (must stay first).

| Token | Family | Role |
| --- | --- | --- |
| `--font-head` | Space Grotesk | headings, buttons, labels, UI chrome, all interface text |
| `--font-body` | Inter | body copy, prose, descriptions, instructions |
| `--font-mono` | Space Mono | code, paths, file names, API responses, technical values |

Base: `15px / 1.6` Inter on `body`. `overflow-x: clip` on body — never `hidden`.

Scale and rules:

- `.page-title` — `clamp(1.8rem, 3.5vw, 2.8rem)`, weight 700, `letter-spacing: -0.02em`. The largest
  type on the site; the page heading doubles as the masthead.
- `.section-title` — `clamp(1.2rem, 2vw, 1.5rem)`, weight 600.
- `.section-lede` — `clamp(0.95rem, 1.3vw, 1.1rem)`, `--fg-2`, max `60ch`, directly below the title.
- `.prose` — max-width `var(--measure)` (70ch), `--fg-2`, `1.6` line-height, `text-wrap: pretty`.
  Paragraphs separated by margin (`p + p`), never blank lines in JSX.
- `.label` — `12px`, weight 600, `--fg-3`, `letter-spacing: .08em`, uppercase. For field labels,
  button text, status badges.
- `.caption` — `13px`, `--fg-3`, for metadata, timestamps, hints below inputs.
- `.code-label` — `11px`, Space Mono, `letter-spacing: .12em`, uppercase, `--fg-3`. For inline keys,
  paths, and command names.
- `.method` — mono, uppercase, 11px, `background: var(--fg)`, `color: var(--bg)`, inverts to
  `--accent` on row hover.
- Headings get `text-wrap: balance`; prose gets `text-wrap: pretty`.
- Never set text in all caps as hierarchy. Capitals are for `≤12px` labels only.

---

## 4. Spacing, layout, breakpoints

- Spacing scale: `--sp-1 6px`, `--sp-2 10px`, `--sp-3 16px`, `--sp-4 24px`, `--sp-5 40px`,
  `--sp-6 64px`. Use these; do not invent new pixel values.
- `--gutter: clamp(16px, 3vw, 48px)` for page edges. `--sidebar: 256px` for navigation.
- The shell is a CSS grid: `.app { grid-template-columns: var(--sidebar) 1fr }`. The sidebar is
  `position: sticky; top: 0; height: 100vh; overflow-y: auto`.
- The main document column is `.doc` containing `.doc-head` + `.doc-main` (flex column).
- Grids use `gap: 1px` with `background: var(--line)` on the container for separated cells.

Breakpoints — mobile-first overrides:

| Width | Change |
| --- | --- |
| `1024px` | `.app` → single column, `.sidebar` becomes fixed drawer, `.topbar` appears |
| `768px` | `.grid-2` → `.grid-1`, form fields stack, `.split` becomes single column |
| `480px` | `.label` → `10px`, gutters reduce to `12px`, padding halves |

Also required: `prefers-reduced-motion: reduce` must remove all animations and transitions.

---

## 5. Component contract

Shell (`app/components/shell.tsx`, client):
`.app`, `.topbar` + `.topbar-logo` + `.topbar-menu`, `.sidebar` + `.sidebar-nav`, `.drawer`,
`.doc-main`, `.footer`.

Document furniture:
`.doc-head` / `.doc-eyebrow` / `.page-title` / `.section-lede`, `.spec` (fact table),
`.section` / `.section-label` + `.section-title` / `.section-head-row`.

Content:
`.prose`, `.callout` (`.callout-info` / `.callout-warn` / `.callout-err`), `.aside`,
`.deflist` / `.def` / `.def-title` / `.def-desc`, `.cols` / `.col` / `.col-label`,
`.api` / `.api-row` / `.method` / `.api-path`, `.table` / `.table-head` / `.table-row`,
`.controls` / `.field` / `.field-label` / `.field-help`, `.btn` / `.btn-primary` /
`.btn-secondary` / `.btn-ghost` / `.chip`, `.badge`, `.code-block`, `.tooltip`.

Upload UI specific:
`.upload-zone` / `.upload-icon` / `.upload-text`, `.file-preview` / `.file-thumb` /
`.file-name` / `.file-size`, `.progress-bar` / `.progress-label`, `.status-indicator`.

Conventions that must hold:

- **Grid cells use `gap: 1px` + `background: var(--line)`**, never per-cell borders.
- External links get `target="_blank" rel="noopener noreferrer"` and a visible `↗`.
- Buttons always have visible focus states; never remove outlines.
- Modals and dropdowns: `.modal-backdrop`, `.modal-content`, `.modal-header`, `.modal-body`,
  `.modal-footer` — all floated layers use `--shadow`.
- Form inputs: `border: 1px solid var(--line-2)`, focus is `2px solid var(--accent)` with
  `outline-offset: 2px`.
- Progress indicators: use `--accent` for fill, `--line` for track, minimum 4px height.
- Status badges: use `--status-ok`, `--status-warn`, `--status-err` only, never other colours.

---

## 6. Interaction and client components

- `'use client'` only where necessary: `shell`, `sidebar`, `upload-zone`, `file-list`, `modals`.
- Pages are server components and fetch their own data.
- File uploads use drag-and-drop with keyboard fallback via file input.
- All interactive elements are keyboard accessible: `Tab`, `Enter`, `Escape`, `Space`.
- Confirmation modals require explicit user action (no auto-dismiss).
- Real-time updates (file status, bandwidth) poll at 1-second intervals, debounced.
- Animations respect `prefers-reduced-motion`; default is no motion.

---

## 7. Adding a page — checklist

1. Create `app/<route>/page.tsx` as a **server component**. Do not render a header, footer, or
   top navigation.
2. Start with `<header className="doc-head">` containing `.doc-eyebrow`, one `.page-title`,
   one `.section-lede`, optional `.doc-cta`, optional `.spec`.
3. Add `<section className="section" id="kebab-case">` blocks, each with a `.section-label` and
   a `.section-title` inside.
4. Use `.deflist`/`.def` for records, `.api`/`.api-row` for endpoints, `.table` for tabular data,
   `.prose` for readable text.
5. Handle all data fetches and show `.label` error messages in `--accent` on failure.
6. Add the route to the nav in `app/components/shell.tsx`.

---

## 8. Upload UI specifics

- `.upload-zone` is a `min-height: 120px` bordered `--line-2` area with `border-style: dashed`.
- Drag-over state: `background: var(--accent-wash)`, `border-color: var(--accent)`.
- File preview thumbnails: `max-width: 64px`, `aspect-ratio: 1`, greyscale by default.
- Progress bars: `height: 4px`, full width, `background: var(--line)`, fill animates from 0–100%.
- File list rows: `display: grid; grid-template-columns: 1fr auto auto;` (name, size, status).
- Status indicators: use `.status-indicator` with `.status-indicator.ok` / `.warn` / `.err`.

---

## 9. What not to do

- No glassmorphism, frosted panels, neon, drop shadows on flat content, or gradients.
- No centred hero, no oversized wordmark, no pill badges, no icon tiles in coloured squares.
- No emoji, no fake stats, no marketing copy, no artificial urgency ("Act now!", "Limited time").
- No new CSS file, no CSS-in-JS, no Tailwind, no component library. One `globals.css`, hand-written.
- No `border-radius` above 4px outside floating layers; no shadows except `--shadow`.
- No inline `style` except one-off dynamic values (a CSS variable, a computed width).
- No `!important`, no `*` selectors beyond the reset, no ids for styling.
- No disabled state that removes contrast; use `opacity: 0.5` + `cursor: not-allowed`.

---

## 10. Dark mode is the north star

- **Dark is the default.** Light mode is a toggle, not a first-class experience.
- Light mode opt-in: clicking the theme button opens a `role="dialog"` with
  **"Switch to light mode?"** and `Cancel` / `Confirm` buttons.
- Switching back to dark is immediate.
- Persistence: `localStorage['zipline-theme']`. Pre-paint script in `app/layout.tsx` sets
  `data-theme="light"` before render to avoid flash.
- `<html suppressHydrationWarning>` is required.

---

## 11. Code examples

### Spacing in JSX
```jsx
<div style={{ padding: 'var(--sp-3)', marginTop: 'var(--sp-4)' }}>
  Content
</div>
```

### Form field
```jsx
<div className="field">
  <label className="field-label">File name</label>
  <input
    type="text"
    className="field-input"
    aria-describedby="help-text"
  />
  <div id="help-text" className="field-help">Max 255 characters</div>
</div>
```

### Status badge
```jsx
<span className="badge" data-status="ok">Active</span>
<span className="badge" data-status="warn">Pending</span>
<span className="badge" data-status="err">Failed</span>
```

### Callout
```jsx
<div className="callout callout-warn">
  <p>This action cannot be undone.</p>
</div>
```

### API endpoint row
```jsx
<div className="api-row">
  <span className="method">GET</span>
  <code className="api-path">/api/files/:id</code>
  <span className="api-desc">Fetch file metadata and download URL</span>
</div>
```

---

## 12. Maintenance

- Review this document quarterly or when adding a new section type.
- All UI changes must reference this contract. Link to the relevant section in the PR.
- If a design need cannot be met with existing tokens, add it here before implementing it.
- Keep the theme file in sync with `app/globals.css` — they are one system.
