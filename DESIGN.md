---
version: alpha
name: Machinon
description: Clean, card-based Domoticz home automation theme. Dual light/dark color scheme driven by CSS custom properties, responsive grid layout, Inter typography, single teal-blue accent color against neutral surfaces. Optional feature modules for compact dashboard, toggle switches, navbar icons, sidemenu, and more.

colors:
  # Light theme
  light-bg: "#f1f1f1"
  light-primary: "#097fae"
  light-navbar: "#ffffff"
  light-surface: "#ffffff"
  light-text: "#1a1a1a"
  light-text-secondary: "#6d6e6d"
  light-border: "#d3d3d3"
  light-disabled: "#d3d3d3"
  light-error: "#c43b3b"
  light-success: "#3b863b"
  light-warning: "#b36200"

  # Dark theme
  dark-bg: "#333639"
  dark-primary: "#0b9eda"
  dark-navbar: "#232324"
  dark-surface: "#515558"
  dark-text: "#ffffff"
  dark-text-secondary: "#cccccc"
  dark-border: "#6d6e6d"
  dark-disabled: "#808080"
  dark-error: "#e05555"
  dark-success: "#4aa84a"
  dark-warning: "#df7b00"

  # Fixed (both themes)
  on-primary: "#ffffff"
  sun-icon: "#ff8c00"
  label-important: "#b94a48"
  gradient-start: "#0bcdc7"
  gradient-dark-start: "#103c68"

typography:
  body:
    fontFamily: Inter (--dz-font-family, weight 400)
    fontWeight: 400
  semibold:
    fontFamily: Inter (--dz-font-family, weight 600)
    fontWeight: 600
  mono:
    fontFamily: JetBrains Mono (--dz-font-mono, weight 400)
    fontWeight: 400
  monoBold:
    fontFamily: JetBrains Mono (--dz-font-mono, weight 700)
    fontWeight: 700
  micro:
    fontSize: 11px
  xs:
    fontSize: 12px
  sm:
    fontSize: 14px
  md:
    fontSize: 16px
  lg:
    fontSize: 22px
  display:
    fontSize: 26px

rounded:
  xs: 2px
  sm: 3px
  interactive: 5px
  button: 10px
  container: 6px
  circle: 50%

spacing:
  # Current clusters (legacy)
  xxs: 4px
  xs: 8px
  sm: 10px
  md: 15px
  lg: 20px
  # Target 4px grid (migration)
  # sm: 10px -> 12px
  # md: 15px -> 16px
  # xl: 24px (future)
  # xxl: 32px (future)

elevation:
  # Level 3 (button) is not restated here: it is owned by --dz-btn-shadow in the
  # Buttons section's Token Table, referenced from the Elevation table, never duplicated.
  # Light-scheme values; dark.css deepens the alpha per level, see Dark Underlay below.
  card: "0 1px 4px rgba(0,0,0,0.25)"
  popup: "0 2px 6px rgba(0,0,0,0.28)"
  overlay: "0 3px 10px rgba(0,0,0,0.30)"
  drag: "0 6px 14px rgba(0,0,0,0.35)"

components:
  # Buttons: soft-elevated redesign (2026-07-17). Every filled/ghost/toggle/
  # icon variant shares one radius ({rounded.button}) and one elevation
  # language (see the "## Buttons" section for the full token table, size
  # tiers, and states).
  button-filled-primary:
    backgroundColor: "{colors.light-primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.xs}"
    rounded: "{rounded.button}"
    padding: "6px 14px"
  button-filled-semantic-success:
    backgroundColor: "{colors.light-success}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.button}"
    # No dedicated size-tier padding/font is declared for .btn-success itself
    # (unlike primary/danger/warning/info); declared-only, no live consumer.
  button-filled-semantic-warning:
    backgroundColor: "{colors.light-warning}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.button}"
    padding: "6px 14px"
    # Declared-only: no live instance in the current button-contract crawl.
  button-filled-semantic-danger:
    backgroundColor: "{colors.light-error}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.button}"
    padding: "6px 14px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.light-text}"
    border: "1px solid {colors.light-primary}"
    rounded: "{rounded.button}"
    padding: "4px 12px"
    hoverBg: "rgba({colors.light-primary}, 0.1)"
    # Renamed from "button-outlined" (pre-redesign): resting state is
    # transparent + bordered; the accent tint above only appears on hover.
  button-icon-quiet:
    backgroundColor: "transparent"
    textColor: "inherit"
    border: "none"
    rounded: "{rounded.button}"
    padding: "4px 8px"
    hitBox: "28px min-width/min-height"
    # Icon-only controls (Devices row actions, scheme-picker icons): no
    # resting border or shadow; hover is a tonal glyph filter, not a
    # background wash. The Devices panel splitter moved off this tier
    # (2026-07-18): see Core-Region Takeover below.
  button-toggle-selected:
    backgroundColor: "{colors.light-primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.button}"
    boxShadow: "inset 0 1px 2px rgba(0,0,0,.12)"
    # One pressed language for both selected-state code paths: the theme's
    # own .btn-selected class and Bootstrap's native .active toggle groups.
  button-disabled:
    backgroundColor: "{colors.light-disabled}"
    textColor: "{colors.light-text-secondary}"
    rounded: "{rounded.button}"
    cursor: "not-allowed"
    # Contrast: 3.42:1 light, 2.46:1 dark (below AA 4.5:1, but WCAG exempts disabled controls)
  device-card:
    backgroundColor: "{colors.light-surface}"
    border: "1.5px solid transparent"
    rounded: "{rounded.container}"
    elevation: "--dz-elev-card"
    gap: "{spacing.sm}"
  device-card-hover:
    boxShadow: "--dz-ring-hover"
    # On the Dynamic Dashboard the card is full-bleed in a clipped cell, so the ring is
    # drawn inset: "--dz-ring-hover-inset"
  text-input:
    backgroundColor: "transparent"
    textColor: "{colors.light-text-secondary}"
    border: "0 0 1px {colors.light-primary}"
    maxWidth: "250px"
  checkbox:
    # Only styled on the login page (css/login.css)
    size: "14px"
    border: "1px solid {colors.light-primary}"
    rounded: "{rounded.xs}"
    checkSize: "8px"
    checkColor: "{colors.light-primary}"
  toggle-switch:
    trackWidth: "40px"
    trackHeight: "15px"
    handleSize: "20px"
    offTrack: "rgba({colors.light-primary}, 0.2)"
    offHandle: "{colors.light-text-secondary}"
    onTrack: "rgba({colors.light-primary}, 0.5)"
    onHandle: "{colors.light-primary}"
  slider-dimmer:
    trackHeight: "5px"
    trackColor: "rgba(0,0,0,0.26)"
    trackRadius: "3px"
    rangeColor: "rgba({colors.light-primary}, 0.5)"
    handleSize: "15px"
    handleColor: "{colors.light-primary}"
  data-table:
    rounded: "{rounded.container}"
    elevation: "--dz-elev-card"
    headerHeight: "35px (declared; renders 52px content-box with the Tables section's header-pad token, measured live)"
    headerBg: "{colors.light-surface}"
    oddRowBg: "derived: color-mix(in srgb, {colors.light-surface} 92%, {colors.light-text})"
    evenRowBg: "{colors.light-surface}"
    rowBorder: "1px solid {colors.light-border}"
    totalBg: "derived: color-mix(in srgb, {colors.light-primary} 15%, {colors.light-surface})"
    totalText: "{colors.light-text}"
    cellPad: "6px 10px"
    headerPad: "8px 10px"
  navbar:
    backgroundColor: "{colors.light-navbar}"
    elevation: "--dz-elev-popup"
    linkFont: "{typography.semibold}"
    linkSize: "{typography.sm}"
    activeBg: "rgba({colors.light-primary}, 0.4)"
    activeBorder: "1px solid {colors.light-primary}"
  dropdown-menu:
    backgroundColor: "{colors.light-navbar}"
    rounded: "{rounded.container}"
    elevation: "--dz-elev-popup"
    hoverBg: "rgba({colors.light-primary}, 0.15)"
  dialog:
    backgroundColor: "{colors.light-bg}"
    maxWidth: "calc(100vw - 20px)"
    maxHeight: "calc(100vh - 20px)"
    buttonGap: "5px"
---

# Machinon Design System

## Overview

Machinon is a clean, card-based theme for the Domoticz home automation dashboard. It replaces Domoticz's default Bootstrap 2.x UI with a modern CSS grid layout, CSS custom properties for theming, and a dual light/dark color scheme. The design centers on a single teal-blue accent color against neutral surfaces, with device cards displayed in a responsive grid. The theme supports optional feature modules (compact dashboard, toggle switches, navbar icons, sidemenu, and more), all toggled via a settings UI stored in `theme.json`.

**Key characteristics:**
- Single accent color (`{colors.light-primary}` / `{colors.dark-primary}`) used for all interactive elements
- Card-based device layout with CSS grid, not Bootstrap's float grid
- Two font weights only: Inter Regular (body) and Inter SemiBold (headings/emphasis)
- Dual theme support via CSS custom properties, selected by a `data-dz-scheme` attribute
- Feature modules that layer additional CSS/JS without altering the base theme

## How to read this document

This document is the **target**, not a description of the current CSS. It states what Machinon
should be, so that a difference between the code and this document is a defect in one of them,
never a precedent to copy.

Three kinds of statement appear, and they are not interchangeable:

- **Intent.** A design decision we chose and can revisit. Values in the tables are intent, and the
  CSS is expected to match them. If it does not, either fix the CSS or change this document
  deliberately.
- **Constraint.** Something Domoticz core imposes on us. Not a choice, and not fixable here. These
  cite the core file that forces them, so a reader can tell an external limit from a preference.
- **Gap.** A place where the code does not yet meet the intent above. Listed under Gaps, with what
  it would take to close it. A gap is a debt marker, not an excuse.

Values here were verified against the CSS. When you change a value in the code, change it here in
the same edit, or record the difference as a gap.

## Colors

> Colors live in CSS, not JavaScript. `dz-tokens.css` defines the light scheme on `:root`;
> `dark.css` overrides it under `html[data-dz-scheme="dark"]`. `setColorScheme()` in
> `src/js/scheme.js` sets that attribute, and `getSchemeDefaults()` reads the resulting computed
> values back so the settings UI can show them. Users can override individual colors via the
> theme settings UI when `custom_color_scheme` is enabled; overrides are applied with
> `setProperty()`, never by composing a stylesheet from strings.
>
> Built-in schemes (`schemes/*.json`, picker in the theme hub's Colors group rendered by `src/js/schemes.js`)
> are presets for that same applier: a scheme carries a `colors` object with the applier's
> keys plus a `base` ("light"/"dark") that picks the token underlay beneath the overrides via
> `theme.scheme_base` (dark schemes keep `dark.css` active for every token they do not set).
> Every shipped scheme must hold body text vs body background at WCAG AA 4.5:1 or better,
> and text-on-accent (`--dz-accent-text`, the token every "text on an accent surface" rule
> consumes; scheme key `accent_text`) at 3:1 or better (both gated by `dz-scheme-picker.js`).
> Adding a scheme = one JSON file + an `index.json` entry.
>
> Deliberately NOT tokenized: text on the semantic colours (red/success/warning buttons stay
> white), the login page and the offline splash (fixed brand surfaces), Blockly's canvas, and
> the legacy dark_theme.css gradient. Everything else colour-bearing flows through tokens;
> the device status glows use the `--dz-status-*-values` r,g,b triplets, and the
> sunrise/sunset sun is `--dz-sun-color` (#ff8c00 in every base scheme; scheme colors key
> `sun` overrides it like the other semantic colours).
>
> **Token definitions must DERIVE, never copy.** A token whose definition is a literal copy of
> another token's value stops tracking schemes and rots silently (found this way: the zebra
> stripe #808080, panel-bg, the dd grid-line with the accent baked into an rgba, primary
> button text, the danger-red rgba triplet). Write `var(--dz-widget-bg)` /
> `rgba(var(--dz-accent-values), a)` / `color-mix(...)`, or document WHY a value is fixed.
> Derived-by-mix examples: table odd stripe (8% body-text into widget-bg), dd skeleton.
> Selected table rows sit on the accent and use `--dz-accent-text`.
>
> Scheme picks persist to the Domoticz user variables immediately (persistSchemeChoice);
> user presets and hand-picked customs are contrast-checked at save time
> (schemeContrastFailures: body/secondary 4.5, on-accent 3.0) with a warning, never silently.
>
> **Settings persistence** runs through a transport seam (`src/js/settings-transport.js`),
> layered on Domoticz core's native `ThemeSettings` API where the core reports
> `ThemeSettingsAPI: 1`: a shared instance (house) layer and a per-user layer, merged onto the
> theme object on load and split by a `"user"`/`"house"` scope carried on every settings-manifest
> entry (`src/js/theme-manifest.js`). A core without the native API falls back to the original
> three theme user variables (`theme-<folder>-features`, `theme-<folder>-custom`,
> `theme-<folder>-colors`, isolated from core preferences, read/written through
> `dzThemeSettingsLoad`/`dzThemeSettingsSave`), and a one-time migration seeds the native
> instance layer from them the first time a capable core boots. Card min/max widths persist
> appended to the legacy custom array at positions 10 and 11; before the transport seam they
> were cache-only and reset to the token default (320px) on a cold reload. The legacy
> transport's own load still resolves through `dzMergeSettingsLayers(defaults, stored, null)`
> (`schemaVersion` 1, `perUser` always null there; real per-user differentiation lives in the
> native transport's two layers instead). See [Settings storage](#theme-hub) under Theme Hub
> for the full two-layer model, the scope rule, and the reachability/UI contract.
>
> Machinon publishes the `--dz-*` token names that Domoticz core's globally-linked stylesheets
> (`css/dashboard.css`, `css/style.css`) consume. It deliberately does not import core's
> `legacy.css`, so any token core reads must be defined here.

### CSS Custom Property Mapping

| Token | Light | Dark | Role |
|-------|-------|------|------|
| `--dz-body-bg` | `{colors.light-bg}` | `{colors.dark-bg}` | Page background |
| `--dz-accent-color` | `{colors.light-primary}` | `{colors.dark-primary}` | Accent/primary; CTAs, active states, links, sliders |
| `--dz-nav-bg` | `{colors.light-navbar}` | `{colors.dark-navbar}` | Top navigation bar; also feeds `--dz-menu-bg` (all floating menus) |
| `--dz-widget-bg` | `{colors.light-surface}` | `{colors.dark-surface}` | Card/panel surfaces |
| `--dz-menu-bg` | `{colors.light-navbar}` (alias) | `{colors.dark-navbar}` (alias) | Menu surface family: aliases `--dz-nav-bg`, so the top menu bar and every floating menu (navbar dropdown, card 3-dot flyout) share the scheme's "Menu" color (stored key: `navbar`) without adding a palette color |
| `--dz-body-text` | `{colors.light-text}` | `{colors.dark-text}` | Primary text |
| `--secondary-text-color` | `{colors.light-text-secondary}` | `{colors.dark-text-secondary}` | Captions, timestamps, labels |
| `--dz-input-border` | `{colors.light-border}` | `{colors.dark-border}` | Table/row/input borders |
| `--dz-status-disabled` | `{colors.light-disabled}` | `{colors.dark-disabled}` | Disabled controls |
| `--dz-accent-red` | `{colors.light-error}` | `{colors.dark-error}` | Destructive actions, timeout status |
| `--dz-btn-success-bg` | `{colors.light-success}` | `{colors.dark-success}` | Success state buttons |
| `--dz-btn-warning-bg` | `{colors.light-warning}` | `{colors.dark-warning}` | Warning state buttons |
| `--dz-accent-values` | `9,127,174` | `11,158,218` | Raw RGB for `rgba()` usage |
| `--dz-accent-red-values` | `196,59,59` | `224,85,85` | Raw RGB for `rgba()` usage |
| `--dz-status-danger` | alias of `--dz-accent-red` | (follows) | Status fills: danger tier (battery empty bar) |
| `--dz-status-warn` | alias of `--dz-btn-warning-bg` | (follows) | Status fills: warning tier (battery half bar) |
| `--dz-status-ok` | alias of `--dz-btn-success-bg` | (follows) | Status fills: healthy tier (battery base/full bar) |

Derived tokens (`--dz-panel-bg`, `--dz-border-color`, `--dz-table-*`, `--dz-btn-*`, `--dz-input-*`,
`--dz-modal-*`) reference the rows above rather than restating colors. `--dz-widget-accent` and
`--dz-accent-red` are additionally set in an `html:root` block, whose `(0,1,1)` specificity beats
core's later-loaded `:root`.

### Fixed Colors (theme-independent)

- **On primary** (`{colors.on-primary}`): white text on filled buttons and accent backgrounds
- **Sun icon** (`{colors.sun-icon}`): `#ff8c00` orange for sunrise/sunset icon
- **Label important** (`{colors.label-important}`): `#b94a48` for critical badges
- **Header gradient**: `{colors.gradient-start}` to `{colors.light-primary}` (light), `{colors.gradient-dark-start}` to `#0073a7` (dark)

### Status Glow Colors (hardcoded, not yet mapped to custom properties)

| Status | Glow color | Card opacity |
|--------|-----------|-------------|
| Timeout | `rgb(199,67,67)` | 0.5 |
| Protected | `rgb(0,0,139)` | 1.0 |
| Low Battery | `rgb(255,255,0)` | 1.0 |
| Off (fade) | default card shadow | 0.5 |

## Typography

### Font Families

| Token | Family | Weights | Source | Usage |
|-------|--------|---------|--------|-------|
| `--dz-font-family` | Inter | 400 (regular), 600 (semibold) | Self-hosted woff2, v4.1, no `local()` fallback (`fonts/Inter-Regular.woff2`, `fonts/Inter-SemiBold.woff2`) | Body text, headings, nav links, device names/values, form labels, all UI chrome |
| `--dz-font-mono` | JetBrains Mono | 400 (regular), 700 (bold) | Self-hosted woff2, v2.304, no `local()` fallback | ACE editor (Events/Blockly code panes), code-style inputs (`.aw-code-input`, `.aw-code-review`), log console |
| `--dz-font-icons` | Ionicons | n/a (icon glyphs) | Vendored (`css/ionicons.min.css`) | Icon glyphs painted on `::before`; never collides with text, so it is exempt from the family-takeover rules below |

Fallback stacks apply only while the self-hosted face loads (`font-display: swap`):
- `--dz-font-family`: `'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`
- `--dz-font-mono`: `'JetBrains Mono', ui-monospace, Consolas, Menlo, monospace`

### Weights

| Token | Value | Used by |
|-------|-------|---------|
| `--dz-weight-regular` | 400 | Body text and most UI chrome |
| `--dz-weight-semibold` | 600 | Headings, nav links, device names/values, emphasis |
| `--dz-weight-mono-bold` | 700 | Reserves 700 weight for JetBrains Mono Bold face; ACE applies it via its own CSS (no theme CSS consumer yet) |

No other font weight is used anywhere in the theme.

### Size Scale

| Token | Size | Usage |
|-------|------|-------|
| `{typography.micro}` | 11px | `.btn-mini`/`.btn-xs`, chart zoom buttons, compact-card last update, description tooltips, sunrise/sunset times, Dynamic Dashboard library descriptions, log search counter, icon pack chip/description |
| `{typography.xs}` | 12px | Standard buttons, chart menu items, device-card last update, badges, Dynamic Dashboard library labels |
| `{typography.sm}` | 14px | **Body base**, nav links, menus, tables, ACE editor, options menu |
| `{typography.md}` | 16px | Settings panels, dropdown panes, mobile page-title h1 |
| `{typography.lg}` | 22px | Device values (`#bigtext`), section headings |
| `{typography.display}` | 26px | Page-title h1 (desktop), login heading |
| clock (`--dz-text-clock`) | 80px (60px at <=979px) | Standby clock |
| clock-sub (`--dz-text-clock-sub`) | 60px (40px at <=979px) | Standby date |
| icon sm (`--dz-icon-size-sm`) | 16px | Inline/tab Ionicons |
| icon md (`--dz-icon-size-md`) | 24px | Header buttons, card options |
| icon lg (`--dz-icon-size-lg`) | 30px | Search icon, dialog close glyphs |

### The Token Contract

Every `font-family`, `font-size`, and `font-weight` declared anywhere in the theme's own CSS
(`custom.css`, `css/*.css`) must resolve through one of the `var(--dz-*)` tokens above, or be
`font-size: 0` (used to visually hide a text node without removing it). `scripts/check-typography.sh`
enforces this line by line, including the shorthand `font:` property (no token-legal form exists for
it, so any use is a violation) and a repo-wide scan for the retired `main-font` family name, and it
gates `makerelease.sh`: a release cannot ship with a raw font declaration in theme CSS.

Body text is theme-owned at `--dz-text-sm` (14px), replacing core's `10pt` (13.33px) default. Page
titles (`.page-header-small h1`) are theme-owned at `--dz-text-display` (26px) on desktop, stepping
down to `--dz-text-md` (16px) under 768px so long device names hold one or two lines on a phone.

Core and vendor CSS that sets its own family or size directly on a descendant element is retargeted
in `css/typography.css`: form controls, headings (including `.brand h1`/`.brand h2`, the always-visible
navbar wordmark), the navbar links and dropdown, jQuery UI widgets (including dialog buttons),
DataTables chrome, Dynamic Dashboard edit chrome, the topbar clock/sun-times and toasts, and the
report/energy/floorplan/chart SVG text. An inherited value never wins the cascade against a rule that
targets the element directly, so each of those needs its own `var(--dz-*)` rule; it cannot rely on
inheriting Inter from `body`.

Value-bearing contexts (`#bigtext`, last-update timestamps, the log console, the topbar clock,
DataTables cells, device data tooltips) use `font-variant-numeric: tabular-nums` so digits line up in
columns.

### Device Card Typography

Card text sizes are fixed `--dz-text-*` tokens, not the relative (`em`/`%`) sizes the original theme
used. Name and status are explicit `--dz-text-sm` (14px; `.item-name, .item #name, .item #status` in
`css/typography.css`, not left to inheritance). The value (`#bigtext`) is `--dz-text-lg` (22px,
regular weight); last update is `--dz-text-xs` (12px). Compact-dashboard cards (`.span3`) reuse the
same tokens: bigtext is `--dz-text-lg` at `--dz-weight-semibold`, last update steps down to
`--dz-text-micro` (11px). There is no separate relative-size table: every card variant, standard or
compact, reads its size from the scale above.

## Spacing

### Current Clusters (legacy)

| Token | Value | Usage |
|-------|-------|-------|
| `{spacing.xxs}` | 4px | Button group gaps, timer mode margins, checkbox `margin-right` |
| `{spacing.xs}` | 8px | Popup padding, control padding, button internal padding, dialog button gap |
| `{spacing.sm}` | 10px | Container padding, card name padding, card grid gap (as 15px) |
| `{spacing.md}` | 15px | Card grid gap, form list margins, settings list item margins |
| `{spacing.lg}` | 20px | Section spacing, large button padding, settings panel padding |

Table cell/header padding is NOT one of the scalars above; it is its own dedicated token pair
(`--dz-table-cell-pad` 6px 10px, `--dz-table-header-pad` 8px 10px, see [Tables](#tables) >
Padding Rhythm), because a table row needs independent vertical/horizontal control that a single
scalar can't express. Both land at or near this cluster (the 10px horizontal component matches
`{spacing.sm}` exactly; 6px and 8px sit between `{spacing.xxs}` and `{spacing.xs}`) rather than
introducing values outside it, so the two systems agree in spirit even though tables don't
literally reference the spacing tokens.

### Target Scale (4px grid migration)

| Token | Current | Target | Status |
|-------|---------|--------|--------|
| `xxs` | 4px | 4px | Aligned |
| `xs` | 8px | 8px | Aligned |
| `sm` | 10px | 12px | Needs migration |
| `md` | 15px | 16px | Needs migration |
| `lg` | 20px | 20px | Aligned |
| `xl` | - | 24px | Future |
| `xxl` | - | 32px | Future |

When adding new spacing, use the current cluster values (4/8/10/15/20px) for consistency. Do not introduce values outside these clusters until the 4px grid migration.

## Layout

### Responsive Grid

Device cards use CSS grid with `repeat(auto-fill, minmax(min(var(--dz-card-min-width), 100%), 1fr))`:
the column count derives from the container width and the card-min-width token, not from viewport
breakpoints. Cards are capped at `var(--dz-card-max-width)` and centered in their tracks
(`justify-self: center`).

| Token | Default | Role |
|-------|---------|------|
| `--dz-card-min-width` | 320px | Density: a column exists for every 320px of container |
| `--dz-card-max-width` | 500px | Cap on card growth when tracks are wider |

Both are user-configurable (the theme hub's Device cards group > Card Min/Max Width, clamped
200-800 / 250-1200 by `applyCardWidths()`). The 320px default reproduces the former viewport-breakpoint
ladder (1/2/3/4/5 columns at 720/1060/1500/1900px) at common widths, measured against container
widths 675/1251/1333/1750; ultrawide screens now gain columns instead of stopping at 5.

Constraint: `auto-fill` counts tracks by the max sizing function when definite (CSS Grid
7.2.3.2), so the user's max must be a card `max-width`, never the track max; putting it in
`minmax()` makes the min knob dead and drops columns.

Grid gap: `{spacing.md}` (15px). Applied to dashboard (`.bannercontent .row`), switches, temperature (`#tempwidgets`), and weather (`#weatherwidgets`) tabs.

### Compact Dashboard Grid

- `grid-template-columns: repeat(auto-fill, 180px)`
- `row-gap: 20px`
- `justify-content: space-evenly`
- Cards are fixed 180px tiles with condensed internal layout

### Page Content Container

Settings pages, timer/log forms, and detail views use `.page-content-container`: card surface background, `1px solid blue` border, `{rounded.interactive}` radius, card-tier shadow, `10px` padding top/bottom, `10px` top margin.

### Settings Tile Grid

The Setup menu is replaced by a tile grid (`settings_page.js`, `.machinon_ul`): fixed `250px` columns, `space-evenly`, `20px` column gap; tiles (`.rectangle-8`) are card-surfaced rows, `min-height: 75px`, icon left and `{typography.md}` label. Tile icons render in a fixed `36x36` box (`object-fit: contain`); new art for `images/settings/` ships as square `72x72` PNGs (2x for high-DPI; legacy sources are ~35px and non-square, which the fixed box normalizes). On mobile the tiles shrink to `100px` centered blocks (see Mobile Adaptations).

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `{rounded.xs}` | 2px | Checkboxes, `.label`, `.badge`, textarea |
| `{rounded.sm}` | 3px | Slider track, timer mode blocks, log toggle count |
| `{rounded.interactive}` | 5px | Top navbar links, the "you are here" nav-active pair (top navbar tab + Setup dropdown active item), input select borders. Flat-underline sub-tabs (Setup tab strip, icon-pack Blue UI/Color/Fun tabs) are a separate idiom, not this token: radius 0, no corner to round. |
| `{rounded.button}` | 10px | Every button and button-styled control (see [Buttons](#buttons)): filled/ghost/toggle-selected/icon-quiet/label-as-button. Deliberately larger than the card radius; see Radius Rationale below |
| `{rounded.container}` | 6px | Device cards, DataTables, dropdown menus, popups, dialogs, log console, settings panels |
| `{rounded.circle}` | 50% | Radio buttons, slider handle, user avatars |

`{rounded.interactive}` and `{rounded.button}` are deliberately different values (5px vs 10px), not a
rounding inconsistency: nav chrome (tabs, the active-route tint, dropdown borders) is a thinner,
denser visual language than the buttons floating on top of it. See Buttons > Radius Rationale.

## Elevation

All tokens live in `dz-tokens.css`. Values below are the light-scheme definitions; `dark.css`
now overrides each one to a deepened alpha (see Dark Underlay below), owner-tuned 2026-08-07.

| Level | Name | Token | Value | Usage |
|-------|------|-------|-------|-------|
| 0 | flat | none | `none` | Default state, transparent backgrounds |
| 1 | card | `--dz-elev-card` | `0 1px 4px rgba(0,0,0,0.25)` | Device cards, DataTables, log console, page-content containers |
| 2 | popup | `--dz-elev-popup` | `0 2px 6px rgba(0,0,0,0.28)` | Navbar inner and dropdown menus (nav, sidemenu, settings), Highcharts export menu, card tooltips, mobile item cards, mobile search input |
| 3 | button | `--dz-btn-shadow` | see [Buttons](#buttons) Token Table | Resting shadow for every filled button; the value lives in the Buttons section's token table, referenced here rather than duplicated, along with the hover/pressed/focus-ring variants |
| 4 | overlay | `--dz-elev-overlay` | `0 3px 10px rgba(0,0,0,0.30)` | Card options flyout, setpoint popup, search message toast |
| 5 | drag | `--dz-elev-drag` | `0 6px 14px rgba(0,0,0,0.35)` | Drag ghost during card reorder |

The values above are owner-tuned as of 2026-08-07 (shadow-value-tuning pass): crisp tight
direction, picked from rendered strips against the alternatives (current/soft-modern/crisp-tight,
each shown on representative surfaces in both underlays). They replace the values the 2026-08-07
shadow-consistency pass had frozen at the measured de facto majority across the theme's
`box-shadow` declarations (`docs/superpowers/2026-08-07-shadow-audit.md`); that majority-value
history is the provenance for how the token set was first established, not the current value. Per
the token-derivation policy that already governs Colors (see above): a token's definition must
either derive from another token or document why its value is fixed. The elevation, glow, and ring
values below are fixed by design (shadow geometry and alpha, not a color that a scheme overrides),
so they are literal `rgba()`/`px` values rather than `var()` references.

### Status Glows

Semantic light, not depth: these ring the card in a status color instead of a resting drop shadow.
Consumed by `css/device-status.css` (timeout/protected/low-battery card states).

| Token | Value | Usage |
|-------|-------|-------|
| `--dz-glow-timeout` | `0px 0px 10px 2px rgba(var(--dz-status-timeout-values), 0.5)` | Timeout status glow |
| `--dz-glow-protected` | `0px 0px 10px 2px rgba(var(--dz-status-protected-values), 0.4)` | Protected status glow |
| `--dz-glow-battery` | `0px 0px 10px 2px rgba(var(--dz-status-lowbat-values), 0.4)` | Low-battery status glow |

Each derives its color from the matching `--dz-status-*-values` RGB triplet (see
[CSS Custom Property Mapping](#css-custom-property-mapping)); only the alpha and geometry are
fixed here.

### Accent Rings

| Token | Value | Usage |
|-------|-------|-------|
| `--dz-ring-accent` | `0px 0px 0px 2px var(--dz-accent-color)` | Bare 2px accent ring primitive, for selectors with no resting card shadow of their own (icon list hover, scheme-card selection border) |
| `--dz-ring-hover` | `var(--dz-elev-card), var(--dz-ring-accent)` | Card hover: composes the resting card shadow with the accent ring |
| `--dz-ring-hover-inset` | `inset 0px 0px 0px 2px var(--dz-accent-color)` | Card hover on the Dynamic Dashboard (see below) |

### Interactive States

- **Card hover**: `--dz-ring-hover`, which is *composed* from `var(--dz-elev-card),
  var(--dz-ring-accent)` rather than restated as a fresh literal. `box-shadow` is a single
  property, so historically a hover rule that listed only the ring deleted the resting card
  shadow; composing the token from the card token itself makes that trap structurally
  impossible; a rule that applies `--dz-ring-hover` can never drop the card layer, because the
  card layer is part of the token's own definition, not something the call site has to remember
  to restate.
- **Card hover (Dynamic Dashboard)**: `--dz-ring-hover-inset`. The card is full-bleed inside a
  cell that core wraps in five nested `overflow: hidden` ancestors (`dd-dz-inner`,
  `dd-dz-device`, `dd-widget-body`, `dd-widget`, `dd-widget-cell`), confirmed by a live 2026-08-07
  probe on beta build 18200 across 6 sampled `.dd-widget--dz-device` cards: the ancestor count
  was verified by explicit node-by-node enumeration, not name-matching. Measured clearance
  between the ring target and the nearest clip boundary was 4px left/right but 0px top/bottom on
  every sampled card; an outer ring is invisible top and bottom on any card whose content
  reaches minimum grid height, so the outer form is not just undesirable there, it is clipped.
  Using the inset token is the only option that renders correctly; a screenshot test injection
  confirmed the un-clipped left/right edges and the flush-cut top/bottom edges (details in the
  audit's Task 2 section).
- **Update pulse**: keyframe animation (`css/device-status.css`) that flashes the accent ring
  outward to a 3px peak over 0.8s. The 50% keyframe carries a `dz-shadow-exception` marker: it is
  an animated intermediate value, intentionally wider than the static `--dz-ring-accent` (2px),
  and collapsing it to the token would flatten the pulse's peak.
- **Drag target (active)**: `2px dashed rgba(blue, 0.3)` outline, `3px` offset
- **Drag target (hover)**: `2px solid blue` outline, `3px` offset, `rgba(blue, 0.08)` background tint, `0.15s ease` transition

### Dark Underlay

`dark.css` redefines `--dz-elev-*` to a deepened alpha per level, owner-picked at the 2026-08-07
shadow-value-tuning gate: crisp tight direction, dark underlay deepened so the same geometry still
reads against a dark surface. `--dz-elev-drag`'s alpha is capped at 0.6 rather than continuing the
linear scale from its light-scheme value; the cap was disclosed to the owner before the pick.
`--dz-glow-*` and `--dz-ring-*` are unchanged between schemes: glow derives its color from the
matching `--dz-status-*-values` token so it already adapts per scheme, and `--dz-ring-hover`
composes `var(--dz-elev-card)` so it follows the elevation change automatically without a
dark.css override of its own.

| Level | Token | Light value | Dark value |
|-------|-------|--------------|------------|
| 1 | `--dz-elev-card` | `0 1px 4px rgba(0,0,0,0.25)` | `0 1px 4px rgba(0,0,0,0.50)` |
| 2 | `--dz-elev-popup` | `0 2px 6px rgba(0,0,0,0.28)` | `0 2px 6px rgba(0,0,0,0.56)` |
| 4 | `--dz-elev-overlay` | `0 3px 10px rgba(0,0,0,0.30)` | `0 3px 10px rgba(0,0,0,0.60)` |
| 5 | `--dz-elev-drag` | `0 6px 14px rgba(0,0,0,0.35)` | `0 6px 14px rgba(0,0,0,0.60)` (capped) |

### Exceptions

Three declarations in the theme carry a `dz-shadow-exception` marker comment at their
declaration site, documenting why each is intentionally not a named elevation/glow/ring token.
The marker is documentation, not a functional skip: the two CSS exceptions below already pass
`scripts/check-shadows.sh` on their own merit, since each layer pairs literal geometry with a
token-driven color, which the checker accepts per the per-layer rule described below. The JS
exception sits outside the checker's `*.css` scope entirely, so it is never scanned regardless
of the marker.

- **`css/device-status.css`**, the `updatePulse` keyframe's 50% peak (see Update pulse above):
  an animated intermediate value, not a resting or hover state.
- **`custom.css`**, the About page `.version-badge` glow: a blur-only halo with no spread,
  matching none of the three families' geometry (elevation shadows all carry a spread value,
  status glows use the `--dz-status-*-values` triads, ring tokens are spread-only with no blur).
- **`src/js/theme-hub-previews.js`**, the Theme Hub's `dzPreviewDialogCenter()` mini-mockup
  dialog swatch: a decorative miniature preview element illustrating the "center popups"
  setting, deliberately subdued at its small scale rather than carrying a full-strength overlay
  token.

### The Shadow Contract (enforcement)

`scripts/check-shadows.sh` checks every `box-shadow` declaration in theme CSS (excluding
`dz-tokens.css`, `dark.css`, and vendor CSS), one comma-separated layer at a time: a layer passes
when it contains a `var(--dz-*)` reference anywhere in it, so literal geometry paired with a
token-driven color (`0px 0px 0px 2px rgb(var(--dz-status-timeout-values))`, the live shape of
device-status.css's status rings) passes by design. A layer with no token reference fails unless
the whole declaration is a `none` reset or its line carries a `dz-shadow-exception` marker. It
gates `makerelease.sh` alongside `check-typography.sh` and `check-buttons.sh`.

## Buttons

Every button-like control in the theme (`.btn*` classes, label-as-button chips, icon-only hit-boxes,
and several core-rendered regions that ship no `.btn` class at all) shares one **soft-elevated**
language: one radius, one resting/hover/pressed shadow triple, one focus ring, one disabled
treatment (spec 2026-07-17, `css/buttons.css`). Before this redesign the same visual intents were
spread across 5 different padding/radius combinations that had never been named; the token table and
size tiers below are what replaced them.

### Token Table

All tokens live in `dz-tokens.css`. Colors/text below are the light-scheme values; dark.css overrides
the ones that need to differ.

| Token | Value | Notes |
|-------|-------|-------|
| `--dz-btn-primary-bg` | `var(--dz-accent-color)` | Filled primary/info background |
| `--dz-btn-primary-text` | `var(--dz-accent-text)` | Text on any filled or toggle-selected surface |
| `--dz-btn-info-bg` | `var(--dz-accent-color)` | Alias: Bootstrap's `.btn-info` reuses the primary look |
| `--dz-btn-danger-bg` | `var(--dz-accent-red)` | Filled danger background |
| `--dz-btn-danger-bg-alpha` | `rgba(var(--dz-accent-red-values), 0.85)` | Declared; no current CSS consumer (flagged for cleanup, not fixed here) |
| `--dz-btn-success-bg` / `--dz-btn-warning-bg` | `#3b863b` / `#b36200` | Defined in the mapped-token block, not the `--dz-btn-*` block; consumed by `.btn-success`/`.btn-warning` (both declared-only, no live instance in the current contract crawl) |
| `--dz-btn-bg` / `--dz-btn-text` / `--dz-btn-border` | `var(--dz-widget-bg)` / `var(--dz-body-text)` / `var(--dz-input-border)` | Bootbox `.modal-footer .btn` only; radius/shadow come from the shared base rule (`--dz-btn-radius`/`--dz-btn-shadow`), not from this token group |
| `--dz-btn-hover-bg` | `rgba(var(--dz-accent-values), 0.1)` | Ghost/icon-quiet hover tint |
| `--dz-btn-shadow` | `0 1px 3px rgba(0,0,0,.18), 0 1px 2px rgba(0,0,0,.10)` | Resting elevation for every filled button |
| `--dz-btn-shadow-hover` | `0 2px 6px rgba(0,0,0,.22), 0 1px 3px rgba(0,0,0,.12)` | Hover: shadow grows, it does not change color |
| `--dz-btn-shadow-pressed` | `inset 0 1px 2px rgba(0,0,0,.12)` | `:active` and the toggle-selected family |
| `--dz-btn-focus-ring` | `0 0 0 2px rgba(var(--dz-accent-values), .35)` | `:focus-visible`; stacks on top of the resting or pressed shadow (comma-joined, never replaces it) |
| `--dz-btn-radius` | `10px` | Every button's corner radius; see Radius Rationale |
| `--dz-btn-pad-xs` / `-sm` / `-md` / `-lg` | `4px 8px` / `4px 12px` / `6px 14px` / `10px 20px` | Size-tier padding only; font size stays on the typography token contract, not here |
| `--dz-btn-ghost-border` / `-text` | `1px solid var(--dz-accent-color)` / `var(--dz-body-text)` | Ghost family (bordered, transparent at rest) |
| `--dz-btn-toggle-selected-bg` / `-text` | `var(--dz-accent-color)` / `var(--dz-accent-text)` | One pressed/selected fill for every toggle mechanism (theme's own `.btn-selected` and Bootstrap's native `.active`) |
| `--dz-btn-icon-box` | `28px` | Min-width/min-height square hit-box for icon-only buttons |
| `--dz-btn-line-height` | `20px` | Forced line-height so same-tier block buttons measure an identical height everywhere |
| `--dz-btn-text-shadow` | `none` | Declared; no current CSS consumer (`text-shadow: none` is applied as a literal in the base rule instead) |
| `--dz-btn-disabled-bg` / `-text` | `var(--dz-status-disabled)` / `var(--secondary-text-color)` | Shared by every family; see the existing WCAG AA gap below |
| `--dz-menu-bg` | `var(--dz-nav-bg)` | Shared "Menu" surface; see Menu Surface below |
| `--dz-nav-active-bg` / `-text` | `rgba(var(--dz-accent-values), 0.4)` / `var(--dz-body-text)` | "You are here" tint; see Radius Rationale (this pair stays at 5px, not the button radius) |

### Size Tiers

| Tier | Padding token | Value | Paired font | Example consumers |
|------|--------------|-------|-------------|--------------------|
| `xs` | `--dz-btn-pad-xs` | `4px 8px` | `--dz-text-micro` (11px), explicit on `.btn-mini`/`.btn-xs`/`.btn-small` | Chart zoom buttons, HVAC/Scene segmented pills, Events A-/A+, label-as-button chips |
| `sm` | `--dz-btn-pad-sm` | `4px 12px` | Inherits the ambient `--dz-text-sm` (14px); no tier-level override | Back/Forecast nav links, `.btnsmall`/`.btnsmall-sel` ghost buttons, grid-view `.btnstyle3` |
| `md` | `--dz-btn-pad-md` | `6px 14px` | Split: `.btn-primary`/`.btn-info`/`.btn-warning`/`.btn-danger` pin `--dz-text-xs` (12px) explicitly; `.btnstyle3`/`.btnstyle3-sel` inherit the ambient `--dz-text-sm` (14px) instead | Save/Delete toolbars, Hardware/Users "Add", sub-device editor buttons, Setup "Apply Settings" |
| `lg` | `--dz-btn-pad-lg` | `10px 20px` | `--dz-text-sm` (14px), explicit on `.btn-modern`/`.btn-modern-warning` | Login/Verify/Passkey (`.btn-modern`). (The `.resetbtn`/`.savebtn` classes that also sat at this tier were the legacy Theme tab's Reset/Save buttons; the tab was deleted in Task 8 and the now-consumerless selectors were removed from `css/buttons.css` in the same change.) |

Three more names appear in the button contract's tier field, but they are not padding-driven sizes,
so they sit outside the table above:

- **`compact`** - the flex-centered `.btnstyle3` family. It hugs its own text content height instead
  of the forced line-height the block family uses, so it lands on a constant rendered height
  regardless of which pad token happens to apply; the contract gives it its own name so a real
  height regression is never masked by "well, it's still md padding."
- **`icon-box`** - `.btn-icon` and friends: the `--dz-btn-icon-box` (28px) square hit-box family.
- **`icon`** - bare glyph close buttons (Tips modal `x`, Automation Wizard `x`, Dynamic Dashboard
  panel `x`). These render at `border-radius: 0`, sized by their own font-size/line-height alone; they
  are core-native text glyphs, deliberately outside the button token system, not an oversight.

### Family Roles

| Family | Look | Classes | Notes |
|--------|------|---------|-------|
| **Filled primary/info** | Accent fill, `--dz-accent-text` text | `.btn-primary`, `.btn-info`, `.btnstyle3`, `.btn-modern` | Primary actions, save, login (the legacy Theme tab's `.savebtn` left this family when Task 8 deleted the tab and its now-dead selector) |
| **Filled danger** | `--dz-accent-red` fill | `.btn-danger`, `.btn-modern-warning` | Destructive actions (the legacy Theme tab's `.resetbtn` left this family when Task 8 deleted the tab and its now-dead selector) |
| **Filled success/warning** | Semantic fill | `.btn-success`, `.btn-warning` | Declared and token-correct; **no live instance** in the current button-contract crawl (same as the original 2026-07-16 inventory) |
| **Ghost** | Transparent, `1px solid` accent border, tint only on hover | `.btn-default`, `.btnsmall`, `.btn-small` | Secondary/filter/toolbar actions; no resting elevation |
| **Toggle-selected** | Accent fill + pressed inset shadow | `.btn-selected`, `.btn-group .btn.active`, `.btn.active`, `.zoom-button-active` | One pressed language for both the theme's own selected class and Bootstrap's native `.active`, replacing two divergent inset shadows the original inventory flagged (finding F2) |
| **Icon-quiet** | Fully transparent, no border, no resting shadow | `.btn-icon` | Hit-box only (`--dz-btn-icon-box`); hover is a tonal glyph filter (`saturate`/`brightness`), never a background wash, so device/card icon glyphs don't start looking like buttons. (The legacy Theme tab's `.resetschemebtn`/`.saveschemebtn` anchors left this family when the injected tab was deleted, Task 8.) |
| **Accent-pill** | Accent-tinted wash at rest, `--dz-accent-color` glyph, strengthens to `--dz-btn-hover-bg` on hover | `.page-devices > .splitter` | The one icon-quiet-adjacent control that needs to read as an affordance *before* the pointer arrives (it collapses/expands the whole filter column); moved off icon-quiet 2026-07-18 for exactly that reason - see Core-Region Takeover |
| **Label-as-button** | Accent fill, xs padding | `.label-info[href]`, `.badge-info[href]`, `.label.lcursor`, `.badge.lcursor` | Core renders several clickable actions as `<span>`/`<a>` labels, not `<button>`; only the clickable ones (`[href]`/`.lcursor`) join the button system - static `.label`/`.badge` chips stay flat informational chips |
| **Disabled** | Flat grey, no shadow | `[disabled]`, `.disabled`, `.btnstyle3-dis`, `.btnsmall-dis` | Same `--dz-btn-disabled-bg`/`-text` pair across every family; `cursor: default`/`not-allowed`, `pointer-events: none` in most paths |

### States

- **Rest**: `--dz-btn-shadow` (filled/toggle-selected only; ghost and icon-quiet render flat)
- **Hover (filled)**: the shadow grows to `--dz-btn-shadow-hover` and the fill darkens via
  `color-mix(in srgb, <bg> 90%, black)` - not a `filter`. The `.btn-group` filled variants
  (`.btn-group .btn-primary`/`.btn-danger`/`.btn-info`, the connected Save/Delete/Enabled pills) are
  the one place still on the pre-redesign `filter: brightness(0.85)` mechanism; left alone because
  those groups were out of this redesign's touched scope, not because two hover languages are
  intended
- **Hover (ghost/icon-quiet)**: `--dz-btn-hover-bg` tint (ghost) or a tonal glyph `filter` (icon-quiet); no shadow change
- **Pressed / toggle-selected**: `--dz-btn-shadow-pressed` (inset), replacing Bootstrap 2's own
  divergent light/dark inset shadows (finding F2)
- **Focus-visible**: `--dz-btn-focus-ring`, stacked with a comma onto whatever shadow the element
  already carries at rest. Two later rules (the ghost family's `box-shadow: none` and the
  toggle-selected pressed inset) tie the base rule's ring at equal specificity and win by source
  order, so the ring is re-asserted a second time on each of those selectors' own `:focus-visible`
  state (documented in `css/buttons.css`'s "Focus ring, state-proof" block)
- **Disabled**: flat - `--dz-btn-disabled-bg`/`-text`, `box-shadow: none`, no hover/focus reaction
- **Transition**: `background-color .12s ease, box-shadow .12s ease` on the shared base rule (plus a
  slower `0.15s ease` background/color/border-color/filter transition kept on the older Bootstrap-class
  selectors for the brightness-hover holdouts above)

**Label centering.** Every button in the base rule is `display: inline-flex; align-items: center;
justify-content: center` rather than centered by arithmetic (padding + forced line-height happening to
sum to the box). Two live cases needed this: core fixes some heights the theme doesn't own (e.g.
`.btnsmall { height: 1.6em }` in `style.css`, versus this theme's own 20px line-height), and
flex/stretch parents can grow a box past the padding+line-height sum (Events A-/A+ compute 31px in
their own toolbar). Flex centering makes the label track the box that actually renders, in every such
case, instead of the box the padding math assumed.

### Radius Rationale

Buttons are `10px` (`--dz-btn-radius`), device cards are `6px` (`{rounded.container}`) - a deliberate
split, not a rounding inconsistency: buttons are a small, dense control that reads better with a
softer, roomier corner than a large card surface would want. The one documented exception is the
"you are here" pair - the top navbar's active-tab tint and the Setup dropdown's active-item tint
(`--dz-nav-active-bg`/`-text`, `css/nav.css`) - which stays at `5px` (`{rounded.interactive}`) to
match the navbar tab it sits beside, not the button system it visually resembles. `css/buttons.css`'s
own contract check would reject a raw `5px` there, which is why that rule lives in `css/nav.css`
instead: it is nav/dropdown chrome, not a button.

### Menu Surface

`--dz-menu-bg` aliases `--dz-nav-bg` (owner decision 2026-07-17): the top menu bar and every floating
menu (navbar dropdown, card 3-dot flyout) share ONE color concept, the scheme's "navbar" color, which
the settings UI labels "Menu". Floating menus consume `--dz-menu-bg`, never `--dz-nav-bg` directly, so
the mapping stays a single-line decision if a future scheme ever wants the two surfaces to diverge. The
scheme JSON key itself stays `navbar` (not renamed to `menu`), since renaming it would be a scheme
file-format break for no behavioral gain.

### The Button Contract (enforcement)

Two independent gates, at different layers:

- **`scripts/check-buttons.sh`** (static, scoped to `css/buttons.css` only) checks that every
  `border-radius`, `box-shadow`, and `padding` declaration in that one file resolves through a
  `var(--dz-btn-*)` token (or is `0`/`none`); a line tagged `dz-btn-exempt` with its own justification
  comment is skipped. It gates `makerelease.sh` alongside `check-typography.sh`: a release cannot ship
  with a raw radius/shadow/padding value in that file.
- **`dz-button-contract.js`** (live, Playwright, run against the Docker test instance) censuses every
  button-ish element across 13 hash routes plus the theme hub, the Events editor + Automation
  Wizard dialog, the DeviceEdit page, and the core Tips & Tricks modal, then runs 4 checks against the
  committed baseline (`scripts/baselines/button-contract.json`):
  1. **No new/drifted signatures** - every live cluster must match its baseline signature exactly.
  2. **No silent loss** - every baseline entry marked `required` must still be observed live.
  3. **Height uniformity per size tier** - baseline entries sharing a hand-curated `tier` must compute
     the same element height everywhere (entries marked `layoutException` are excluded, with a reason
     recorded in the baseline).
  4. **Sibling coherence** - buttons inside one container (`.btn-group`, `.btn-toolbar`,
     `.ui-dialog-buttonset`, or `[class*="toolbar"]`) must share one height, unless the container is
     annotated `intentionalHierarchy` (none are, currently).

  The current baseline (post-redesign) carries **147 clusters across 51 distinct style signatures**,
  up from the pre-redesign v0 baseline's 131 clusters / 48 signatures - both counts genuinely larger
  than before, because `tier`/`layoutException` annotations and the 2026-07-17 nav-active-token work
  folded in clusters the original inventory never separately tracked (dropdown-toggle variants). Task
  9's verification gate measured the actual per-property collapse: distinct raw `border-radius` values
  went from 9 (pre-redesign) to 6 (post; `10px` now dominates at 62 entries, corner-squared variants
  and the deliberate `5px` nav-active exception account for the rest - it was never going to be 1,
  since one token still renders several distinct corner-radius strings), `box-shadow` settled on
  exactly the 3 token values (rest/pressed/none - hover is only ever observed on `:hover`, not in a
  resting-state census), and padding went from 14 distinct raw pairs to 10, 4 of which are the exact
  `--dz-btn-pad-*` token values and together cover 112 of the 147 clusters. Rebaselining
  (`--rebaseline`) is a deliberate act, never automatic: it prints an adds/removes summary against the
  previous file, and `tier`/`layoutException` are hand-curated annotations preserved by clusterId
  across the regenerate, so a routine rebaseline never silently re-arms checks 3-4 back into their
  dormant (pre-redesign) no-op state.

### Bootstrap 2 Constraint

Bootstrap 2 (`css/bootstrap.css`, loaded globally, not removable per-theme) styles `.btn-*` with
gradients, and its own **state** rules (`:hover`/`:active`/`[disabled]`) carry higher specificity
(`0,2,0`) than this theme's base rules (`0,1,0`). Without `!important`, a hover would flip a button to
Bootstrap's own blue and disabled/active would show Bootstrap's gradients. Every `!important` in
`css/buttons.css` on `background`/`border`/`box-shadow`/`color` exists to beat this one constraint,
not as a style preference; see the "Universal button reset" comment block in that file for the full
specificity accounting, and the Don'ts entry on `!important` below.

### Core-Region Takeover

Regions core styles itself (its own stylesheet loads after the theme and re-asserts raw values, or
ships bare/unclassed buttons the `.btn` system never reaches) needed their own rules, one per region,
each citing the exact core selector/specificity that forced it:

- **`dd-topbar`** (Dynamic Dashboard compact view-mode bar) - icon-quiet tier (`css/buttons.css`)
- **Events editor chrome + Automation Wizard** - toolbar buttons, the open-file tab close-`x`, and the
  Wizard footer (filled tier, including Back/Cancel which the ghost convention would otherwise give)
  (`css/buttons.css`)
- **Charts zoom/range segmented group** - `.zoom-button`/`.zoom-reset` ghost tier, plus the connected
  1H/3H/day range group using the same corner-squaring technique as `.btn-group` (`css/charts.css`)
- **DataTables pager** - `.fg-button` ghost tier; lives in `css/tables.css`, not `css/buttons.css`,
  because its markup nests inside that file's own table-header reset and needs to load after it
- **Devices panel splitter** - accent-pill tier (`css/buttons.css`); started icon-quiet, but an
  owner pass (2026-07-18) found the fully-transparent-until-hover look read as near-invisible next
  to the table it controls, so it now carries a resting accent wash (`rgba(var(--dz-accent-values),
  0.08)`) and an accent-colored chevron, strengthening to the shared `--dz-btn-hover-bg` wash on
  hover like every other ghost/icon-quiet control - see Family Roles
- **Dropdown active item** - the Setup dropdown's "you are here" marker; lives in `css/nav.css` (see
  Radius Rationale: it needs the raw 5px nav radius, which `check-buttons.sh` would reject)
- **About page** - `.btn-modern` is used directly for Website/Forum/Wiki/Source Code and the Tips
  trigger; no override needed here, listed for completeness since it is the one region above that
  needed nothing extra

### Button Groups

**In device cards** (`css/cards.css`, `.item .btn-group`): SelectorStyle-0's sole emitter inside a
card (HVAC Mode, Scene Selector, any multi-level Selector switch). Since the 2026-08-08
selector-segmented pass, level buttons no longer render as separate pills at a diverged radius: they
join into one connected-toolbar run at the family radius (`--dz-btn-radius`) itself, reusing the exact
mechanism described in the paragraph below rather than diverging from it. Full mechanism, wrap
behavior, and evidence trail: [Selector Levels](#selector-levels).

**In toolbars/dialogs** (`css/buttons.css`, `.btn-group`): connected segments, all at `--dz-btn-radius`
(10px). First child: outer corners rounded, inner corners squared. Last child: mirrored. Middle
children: fully squared. A `.btn-group` wrapping a single button (`:only-child`, e.g. the Dynamic
Dashboard's dashboard-switcher) gets the full radius back, since there is no sibling to square against.
`1px solid` accent border, `-1px` left margin to collapse borders. The same corner-squaring technique
is reused verbatim for the chart zoom/range group (see Core-Region Takeover).

## Tables

Every table-bearing surface in the theme (core's DataTables pages and its report tables) follows
one **alignment policy** keyed to column content type, one shared padding rhythm, and one totals-row
treatment, landed by the tables-holistic project (2026-07-18, `css/tables.css`, `dz-tokens.css`).
Before this project, alignment was accidental: core's own CSS either left every column at the
browser default (left) or, on report tables, blanket right-aligned every cell regardless of type, so
headers and data frequently disagreed and numbers were never actually right-aligned anywhere in the
theme.

### Alignment Policy

| Column type | Alignment | Detection (live census) |
|-------------|-----------|--------------------------|
| Text | Left | Default; anything that isn't numeric/datetime/icon |
| Numeric | Right | >=80% of sampled non-empty cells match a number/unit pattern (`kWh`, `W`, `C`, `%`, `m3`, `L`, `hPa`, `mm`, currency) |
| Datetime | Right | >=80% match an ISO date or `H:MM` time pattern; checked before numeric, since a numeric pattern alone also matches datetime strings |
| Icon | Center | Every non-empty cell contains only `img`/`i`/`button`/`svg`, no text of its own |

A column's header must carry the same alignment as its own data, both ways: a numeric column with a
correctly right-aligned header but left-aligned data is still a defect, and so is the reverse (the
header would be lying about the column). `css/tables.css` layers per-column `nth-child` (or class,
where core assigns one) rules on top of one shared default (`text-align: left` on every header/cell),
covering the DataTables pages (Devices, Hardware, Cam, Mobile, Device Timers) and the report tables
(Counter/Temperature/Rain/Wind/Energy) alike; see Core-Region Takeover below for the full surface
list.

**The month-view weekday column's fingerprint.** Every report type titles its month-view weekday
column `''` (an empty string) in core's own `columns` array (`CounterReport.js`,
`TemperatureReport.js`, `RainReport.js`), so it carries no id, class, or visible header text to select
on. DataTables' bundled aria template renders a header's `aria-label` as `"<title>: activate to sort
column ..."`, so an empty title collapses to an aria-label that starts with a bare `:` -
`css/tables.css` selects on `thead th[aria-label^=":"]`. This is locale-safe today: Domoticz's
`$.DataTableLanguage` (`js/domoticz.js`) never sets an `aria` key, so DataTables always falls back to
its English-only bundled default regardless of the active UI language. **Risk:** if core ever starts
localizing DataTables' own aria strings, this column would silently lose its fingerprint and fall
back to the report table's right-aligned default (wrong for a text column); the live census (see The
Table Contract below) would catch the regression the next time it runs, but nothing would flag it
before that. The same breakage can arrive from the other direction, independent of core: a future
DataTables library version bump changing the bundled aria template's own wording (e.g. dropping the
leading `": "` or the `"activate to sort..."` phrasing) would lose the fingerprint identically, and
would be caught the same way (the next census run), not before.

### Token Table (Tables)

All twelve `--dz-table-*` tokens live in `dz-tokens.css`; only `css/tables.css` consumes them. The
first eight predate this project (Phase 4 pilot); the last four (`total-bg`, `total-text`,
`cell-pad`, `header-pad`) landed with it.

| Token | Value | Notes |
|-------|-------|-------|
| `--dz-table-header-bg` | `var(--dz-widget-bg)` | Header row background |
| `--dz-table-header-text` | `var(--dz-body-text)` | Header row text |
| `--dz-table-row-even-bg` | `var(--dz-widget-bg)` | Even (unstriped) row background |
| `--dz-table-row-odd-bg` | `color-mix(in srgb, var(--dz-widget-bg) 92%, var(--dz-body-text))` | Odd-row stripe; DERIVED (8% body text mixed into the widget background) so striping stays readable under every scheme - the old fixed greys failed WCAG under some schemes' text colors |
| `--dz-table-row-text` | `var(--dz-body-text)` | Row text |
| `--dz-table-border` | `var(--dz-input-border)` | Row border |
| `--dz-table-row-selected-bg` | `var(--dz-accent-color)` | Selected-row background (75% opacity, text swaps to `--dz-accent-text`) |
| `--dz-table-control-text` | `var(--secondary-text-color)` | DataTables length/filter/info chrome text |
| `--dz-table-total-bg` | `color-mix(in srgb, var(--dz-accent-color) 15%, var(--dz-widget-bg))` | Totals/summary row background; DERIVED so schemes track (see Totals Rows below) |
| `--dz-table-total-text` | `var(--dz-body-text)` | Totals/summary row text |
| `--dz-table-cell-pad` | `6px 10px` | Body-cell padding rhythm (see Padding Rhythm below) |
| `--dz-table-header-pad` | `8px 10px` | Header-cell padding rhythm |

### Totals Rows

Core appends the report tables' totals `<tfoot>` after the DataTable draws
(`CounterReport.js`/`RainReport.js`; `TemperatureReport` has none, no natural sum), with an **inline**
style pairing the theme's accent background with the theme's body-text token
(`style="background:var(--dz-accent-color,#337ab7); color:var(--dz-body-text,#fff)"`) - a bold
accent-colored band that measured **2.65:1** against the live Blue UI scheme's accent, well under the
4.5:1 WCAG AA floor for normal text. `--dz-table-total-bg`/`-text` replace it with a quiet
accent-tinted band (15% accent mixed into the widget surface) instead of the accent color at full
strength, paired with the ordinary body-text token; `css/tables.css` overrides the row (not each cell)
with `!important`, since inline styles otherwise beat any external selector regardless of
specificity, and `background-color` doesn't inherit but `color` does, so every cell in the row picks
up the readable pairing without its own rule.

Measured contrast, both base and Blue UI (the schemes named in this project's brief), light and dark:

| Scheme | Light | Dark |
|--------|-------|------|
| Base | 14.30:1 | 6.67:1 |
| Blue UI | 11.79:1 | 9.21:1 |

All four clear AA (4.5:1) by a wide margin. The live table-census contract (base scheme active during
that harness run) independently re-measured the rendered report totals rows at 14.45:1 - consistent
with the manual probe above; the small numeric difference is measurement method (the manual check
resolved `color-mix()` via a temporary DOM probe element, the census reads `getComputedStyle()`
straight off the live totals row), not a regression.

### Padding Rhythm

`--dz-table-cell-pad` (6px 10px) and `--dz-table-header-pad` (8px 10px) replace DataTables' vendor
default (`3px 10px`, `demo_table_jui.css`) on every DataTables page and the report tables' `thead`/
`tbody`/`tfoot` cells alike, so header height and row rhythm match across every table-bearing surface
in the theme. These are an owner-approved **design choice** near the de facto 4/8/10 spacing cluster
(see [Spacing](#spacing)), not derived from the spacing scale directly - a table row needs independent
vertical/horizontal control a single spacing scalar can't express, so they get their own token pair
rather than reusing `{spacing.xs}`/`{spacing.sm}` in place.

**Accepted mobile cost.** Growing every DataTables row by a few pixels tipped two mobile (360x780)
surfaces from fitting to a small vertical overflow: Users[mobile] (+5px) and Cam[mobile] (+29px). Both
are recorded as annotated exceptions in the table-census baseline, explicitly flagged
"pending owner verdict," and were accepted as-is at this project's verification gate (no code change)
rather than reverting the rhythm or carving out per-surface padding - a small, page-length-only cost
judged worth the alignment/contrast/rhythm consistency gained everywhere else.

### Viewport Fit

Two chrome-sizing bugs, unrelated to alignment/padding, surfaced in the same census and were fixed as
part of this project because they blocked a clean "no page overflow" reading on tables-bearing pages:

- **`#/Log` desktop (145px chrome constant).** Core's `.log-console-container` sizes itself as
  `calc(100vh - 110px)`, core's guess at the chrome above/below it. Machinon's actual chrome measures
  145px (63px `#holder > .container-fluid` padding (43px top + 20px bottom) + 80px `.bannercontent`
  padding/margin, a `css/nav.css` override of core's own smaller padding + 2px of this container's
  own border), so the console overflowed the viewport by a flat 35px regardless of viewport height. Fixed in
  `css/logpage.css` by overriding the constant to `calc(100vh - 145px)`, scoped to
  `@media (min-width: 980px)` (the desktop widths where that 145px total actually holds - `sidemenu.css`
  zeroes the same padding below that breakpoint). The derivation and its arithmetic live in
  `css/logpage.css`'s own comment above the override.
- **Mobile app-shell (60px).** At <=979px `css/sidemenu.css` forces the navbar out of
  `position: fixed` into normal document flow (so it can slide out as the mobile side menu), which
  puts 60px of navbar (40px min-height + 20px margin-bottom) into the document that isn't there on
  desktop. Core's `#holder { min-height: 100% }` resolves against the full viewport height with no
  awareness that a sibling above it just claimed 60px of it, so any page shorter than a full viewport
  overflowed by exactly that 60px. Fixed in `css/sidemenu.css` (the same file that flips the navbar to
  static) with `#holder { min-height: calc(100% - 60px) }`. Because this is an app-shell bug, not a
  Log-page bug, the one fix also cleared the identical overflow on Users, Mobile, and Cam at
  360x780 for free.
- **`#/Devices` (owner request, 2026-07-18).** Unlike the pages above, Devices' vertical overflow was
  never a chrome-sizing bug - the page has 230+ rows, genuinely more content than any viewport - so it
  was carried as an accepted census exception (see [The Table Contract](#the-table-contract-enforcement)
  below) rather than "fixed" outright. The owner asked for the `#/Log` treatment instead: the page
  fits the viewport and the table panel scrolls internally. `.page-devices-wrapper` (the Devices
  analogue of `.log-console-container`) gets the same `calc(100vh - Npx)` treatment, measured live the
  same way as the 145px above: 143px at desktop (`>=980px`; 63px `container-fluid` + 80px
  `.bannercontent`, matching Log's own two components exactly - Devices carries no extra border of its
  own, so no "+2px" term), 70px at mobile (`<=979px`; sidemenu.css's zeroed `.bannercontent` plus the
  in-flow navbar leave only 50px above `#main-view` + 20px `container-fluid` bottom padding). Tested at
  both (per the owner's standing directive); it holds cleanly at mobile too. `.page-devices` itself
  stacks into a column at the same `<=979px` boundary (mobile-polish task 6, see
  [Mobile Layout](#mobile-layout)), filters above table with the splitter turned into a horizontal
  expander bar, so the 70px mobile budget above is shared by a capped filters panel
  (`max-height: 50vh`) and the table panel rather than a fixed three-column row.

  What scrolls: core's `dataTableDefaultSettings` (`app/app.constants.js`) never sets `scrollY`, so
  the Devices DataTable renders no `.dataTables_scrollBody` - its `dom` option
  (`<"H"lfrC>t<"F"ip>`, `bJQueryUI: true`) gives a plain `.dataTables_wrapper` with two `.fg-toolbar`
  divs (length/search above, info/pagination below) flanking the bare `<table>`, no extra wrapping
  div DataTables' own scroller feature would normally use. That shape still supports real
  row-area-only scrolling with CSS alone: the two `.fg-toolbar` rows stay `flex: none` (always
  visible), and the `<table>` itself becomes the scrolling box (`flex: 1`, `overflow` both axes) with
  its `<thead>` pinned via `position: sticky; top: 0`. Verified live that the header stays pinned
  through a vertical scroll and shifts exactly in sync with a horizontal one, with no `display: block`
  hack and therefore no risk of the header/body column-width desync that naive sticky-table-header
  implementations hit. Scoped to `.page-devices .dataTables_wrapper` specifically (`css/tables.css`),
  not `.dataTables_wrapper` generally - every other DataTable (Hardware/Users/Cam/Mobile/reports)
  shares the same `.fg-toolbar` markup via the same shared `dataTableDefaultSettings` and none of them
  get the height constraint that would make this scrolling behavior meaningful. Full derivation and
  the live measurements live in `css/tables.css`'s own comment above the rules.

  **Census consequence:** this makes Devices' three overflow exceptions (1440x900, 1024x768, and
  360x780 mobile) obsolete - the page now genuinely fits at all three, confirmed by a clean census
  run with those exceptions removed from `scripts/baselines/table-contract.json` (docker-test).

### The Table Contract (enforcement)

Unlike the [Button Contract](#the-button-contract-enforcement), tables have **no static grep-style
checker** (no `scripts/check-tables.sh` alongside `check-typography.sh`/`check-buttons.sh`) - by
design, not an oversight. `check-buttons.sh` works because it asks a lexical question a regex can
answer: does this CSS declaration's value resolve through a `var(--dz-btn-*)` token? Table correctness
isn't a lexical property of any one CSS rule: whether a column is text, numeric, datetime, or icon
depends on what data actually renders in it (a live-DOM fact core itself sometimes contradicts, e.g.
`.myrighttable td` blankly right-aligning every cell regardless of type), and totals-row contrast
depends on resolving real computed colors through inheritance and cascade, including values core
injects as inline styles at runtime. None of that is answerable by grepping source text, so the
entire contract is the live, rendered census below.

**`dz-table-census.js`** (Playwright, run against the Docker test instance) runs three viewport
passes per full run:

1. **1440x900** - full census: column alignment + totals-row contrast + page overflow.
2. **1024x768** - overflow only (a second, narrower desktop viewport; the "#/Log class" of bug is a
   page that fits horizontally but overflows vertically at exactly this width).
3. **360x780 (Galaxy S24 emulation)** - full census again, against whatever mobile markup actually
   renders (some routes swap card layouts for `table.mobileitem` at this width). This pass runs the
   complete set of checks, not a subset: per-route navigation and settle waits dominate the harness's
   runtime and are paid regardless, so sampling "on a subset to save time" would save nothing
   measurable.

Four checks per pass:

1. **Header/data alignment per policy** (see Alignment Policy above).
2. **Totals-row contrast >= 4.5:1** (WCAG AA, normal text; see Totals Rows above).
3. **Page overflow** - `scrollWidth` AND `scrollHeight` must not exceed the viewport.
4. **Padding conformity to the two pad tokens** - still a report-only placeholder in the harness's
   output; not implemented even now that the tokens exist (a gap in the harness, not in the theme's
   CSS, carried forward from the harness's original TB1 shipment).

Every violation is checked against a committed, annotated-exception baseline
(`scripts/baselines/table-contract.json`, docker-test): 178 entries, one per censused
column/totals-row/overflow-viewport combination, snapshotting the live census whether it passes or
fails. 22 are hand-annotated `policy: "exception"` with a `reason` string (down from 25 once the
Devices viewport fit above removed its 3 overflow exceptions - see Viewport Fit) - all overflow, none
alignment or contrast (both of those categories are 0 FAILs, clean): 19 are pages that genuinely have
more content than fits the viewport at that width (Hardware, the report pages, Setup,
Timers - scrolling by design, not a layout bug), 1 is Users@1024x768's always-visible Add/Edit User
form tipping from a small pre-existing margin into overflow once the padding rhythm landed, and 2 are
the accepted mobile padding-rhythm cost noted above. A plain run PASSes (exit 0) unless a violation's
key has no matching exception entry.

**Deliberate rebaseline.** `--rebaseline` regenerates the baseline from a fresh census but preserves
every existing `policy: "exception"` entry by key (the same pattern `dz-button-contract.js` uses for
its `tier`/`layoutException` annotations), so a routine rebaseline can never silently re-arm a
previously-accepted exception into a failing gate. A `staleExceptions` check flags (informationally,
never failing) any baseline exception whose key matched nothing live in that run, so a future fix that
actually resolves a violation doesn't leave a dead, misleading annotation behind unnoticed.

### Core-Region Takeover (Tables)

Regions core renders and styles itself, each needing the theme's own alignment/padding/totals rules
layered on top:

- **Devices** (`#devices`, 14 columns) - state-icon and actions columns centered, Idx/ID/Unit/
  SignalLevel/BatteryLevel/Last Seen right-aligned, the rest left (text); Last Seen also gets a
  positional `nowrap` rule so Inter (wider than the original theme's Open Sans) doesn't wrap it onto
  two lines.
- **Hardware** (`#hardwaretable`, 7 columns) - only the Idx column needs a rule; core's own
  `align="center"` HTML attribute on Port/Data Timeout never mattered (an HTML alignment hint is always
  beaten by the base header rule, and both columns' live data classifies as text, not numeric).
- **Cam** (`#cameratable`, 10 columns, plus `#activetable`, 3 columns for the active-devices sub-table)
  - Idx/Port right, Preview/capture-snapshot/stream-video icons centered.
- **Mobile** (`#mobiletable`, 6 columns) - Idx right, Last Seen right (datetime + an inline "Test"
  icon; classified datetime because the date text dominates the cell).
- **Device Timers** (`.js-device-timers` container; DataTables assigns this table no static id) - only
  the Time column needs a rule.
- **Report tables** (`#reporttable.myrighttable`, every report type: Counter, Temperature, Rain, Wind,
  Energy) - base right-align (most columns are numeric quantities), the year-view leading label column
  and month-view weekday column left (see the aria-fingerprint note above), the trailing trend column
  centered (a single trend icon), and the totals band override (see Totals Rows above). Core's own
  `.myrighttable td` blanket right-aligns every cell regardless of type; these rules also fix the
  header side of that mismatch.
- **DataTables pager** (`.fg-button`) - ghost-tier styling; documented under
  [Buttons > Core-Region Takeover](#core-region-takeover), since it's a button family, not a table
  concern, even though the rule lives in `css/tables.css` for cascade-ordering reasons.

## Mobile Layout

The mobile-polish project (2026-07-19, `css/floorplan.css`, `css/dashboard_mobile.css`,
`css/cards.css`, `css/dynamic-dashboard.css`, `css/tables.css`, `src/js/floorplan-stage.js`)
closed the theme's mobile layout defects: controls squashing into each other, the navbar
scrolling out of reach, and content clipped past its container. It landed one boundary
(979px), one form pattern (wrap with a gap), a set of viewport-fit pages, four Dash2 density
rules, and a live contract that keeps all of it from regressing.

### The 979px Boundary

Below 979px, `custom.css`'s one media-conditioned `@import` (`@import url("css/sidemenu.css")
(max-width: 979px)`) loads `css/sidemenu.css`, which forces the navbar out of
`position: fixed` into normal document flow (`.navbar-fixed-top { position: static
!important }`) so its `.navbar-inner` can slide out as the mobile side menu. That single
change reframes every page below the boundary: the navbar is no longer chrome floating above
the content, it is 60px of in-flow content (40px `.navbar-inner` min-height + 20px
margin-bottom) sitting above whatever the route renders. Above 979px a page can let content
scroll under the fixed navbar or spill past the viewport bottom with no consequence to menu
access; below it, a page that overflows pushes the whole app-shell (and the menu-access
hamburger with it) along with it, so pages need to genuinely fit rather than pin their own
chrome over a scrolling document.

Core's own `#holder { min-height: 100% }` (`style.css`) has no awareness that the navbar just
claimed 60px of that 100%, so `css/sidemenu.css` compensates with `#holder { min-height:
calc(100% - 60px) }` - the fix that clears the identical 60px overflow on every short mobile
page at once (Users, Mobile, Cam; see [Viewport Fit](#viewport-fit) above). Every mobile-polish
media query in this project keys off the same pair of numbers, `@media (max-width: 979px)`
paired with `@media (min-width: 980px)` for the matching desktop-only rule, so a page's mobile
and desktop treatment never straddle a gap or an overlap at the boundary.

### Viewport-Fit Pages

Three pages needed their own fit treatment; two are a vertical `calc(100vh - Npx)` chrome
budget (the `#/Log` technique, see [Viewport Fit](#viewport-fit) under Tables), one is a
horizontal containment problem with no vertical calc at all:

| Page | Desktop | Mobile | Derivation comment |
|------|---------|--------|---------------------|
| `#/Log` | `calc(100vh - 145px)`, `>=980px` | No page-specific override: `sidemenu.css` zeroes the same padding this 145px accounts for below 979px, so core's own `calc(100vh - 110px)` applies unmodified there, and the app-shell `#holder` fix above is what closes its mobile gap | `css/logpage.css`, above `.log-console-container`'s `@media (min-width: 980px)` block |
| `#/Devices` | `calc(100vh - 143px)`, `>=980px` | `calc(100vh - 70px)`, `<=979px` (its own explicit mobile budget, not the app-shell fallback) | `css/tables.css`, above `.page-devices-wrapper`'s two `@media` blocks |
| `#/Floorplans` | Core's own layout; navbar stays fixed, nothing to contain | Stage containment, gated on `body.machinon-fp-stage`, `<=979px` | `css/floorplan.css` (the `@media (max-width: 979px)` block) + `src/js/floorplan-stage.js` (the module header comment) |

**Floorplans: stage containment.** Unlike Log and Devices, Floorplans' mobile problem is
horizontal, not vertical: core lays every floor plan side by side in the DOCUMENT (one
full-viewport-wide `.imageparent` per plan, `FloorplanController.js`) and switches between
plans by scrolling the document horizontally (`ScrollFloorplans`, `window.scrollTo`). Below
979px, with the navbar in flow (see the boundary above), that document-level scroll drags the
whole navbar off-screen the moment a user swipes to another plan, the menu becomes unreachable
mid-navigation (owner defect 1). `css/floorplan.css` turns `#floorplancontent` itself into the
horizontal scroll box (`overflow-x: hidden`) under the `body.machinon-fp-stage` gate, and
`src/js/floorplan-stage.js` redirects every one of core's plan-switch entry points (swipe, nav
arrows, keyboard, bullet clicks, resize realign) to the stage's own `scrollLeft` instead of the
document's; `window.scrollTo` cannot be retargeted from CSS alone, and clipping the overflow
without the JS redirect would leave every plan switch a silent no-op.

The gate is fail-closed in both directions: the CSS containment only activates once the JS
module has added the `machinon-fp-stage` class, which it does only after verifying it could
wrap core's `ScrollFloorplans` hook and confirming the stage DOM (`#floorplancontent` with
`.imageparent` children) exists; if core's markup or wiring ever drifts, the class never
appears, the containment CSS stays inert, and the page falls back to core's stock (broken on
mobile) behavior rather than a half-applied state. The wrapper itself also fails closed: it only
redirects when the containment is actually live (checked by computed `overflow-x` at call time,
never by duplicating the 979px number), so on desktop it no-ops and core scrolls the document
exactly as before. A stray 1x1 `<svg>` core leaves at the top of the stage
(`views/floorplans.html`) is hidden in the same media block, since it opened a spurious first line box
that pushed the contained plan out of the viewport.

### The Wrap-With-Gap Form Pattern

Several of core's forms render as rigid multi-cell tables or fixed-width flex rows with zero
inter-control gap: fine at desktop width, but the row has nowhere to go at 360px, so buttons
collide or wrap with a sub-2px seam between them (a "squash", the census's own term - see the
Mobile Layout Contract below). The fix is the same recipe everywhere it appears: `display: flex;
flex-wrap: wrap; gap: 8px` on the row, plus `display: contents` on whatever rigid wrapper core
puts between the row and its buttons (a `<td>` in a table, an `ng-repeat`'s `<span>`), so that
wrapper stops taking part in layout and its children become direct flex items sharing the gap.

The exemplar is `#updelclr` (the Timers Update/Delete/Clear row, `css/dashboard_mobile.css`,
census key `squash::Timers::#updelclr`):

```css
@media (max-width: 979px) {
    #updelclr, #updelclr tbody, #updelclr tr {
        display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
    }
    #updelclr td { display: contents; }
}
```

The same flex-wrap-plus-gap-plus-`display: contents` recipe is reused, unchanged in shape, at
three more collision sites: the Events file-header form and its `.pull-right` button group
(`css/dashboard_mobile.css`), and the HVAC/Scene selector row (`td#status`, using
`:has(> span > .btn-mini)` to target only the nested selector-button host so no other row type
is touched, with the ng-repeat's `<span>` wrapper flattened via `display: contents` the same way
`#updelclr`'s `<td>` is). Five further sites in the same project reuse the plain `gap: 8px` or
`margin-bottom: 8px` half of the pattern, without a rigid wrapper to flatten, because their
layout is a simple stack rather than a collision: the Events file-tree's bottom margin, the
Devices filters/splitter stacking margins (`css/tables.css`), the Quick Stats compact list's
item gap (`css/dynamic-dashboard.css`), and the blinds slider's icon-clearance offset
(`css/cards.css`). Every one of the nine sites lands on the existing `{spacing.xs}` cluster value
(8px), not a new number, and every one is commented `future --dz-gap token site (spacing
project)`: they are the first candidates to move onto a `--dz-gap` custom property once the
spacing-token migration in [Spacing](#spacing) lands.

### Dash2 Card Density

Four density rules fit the Machinon device card, and its widgets, into the Dynamic Dashboard's
fixed-height GridStack cell:

1. **Stretch to the cell.** `.dd-widget--dz-device .dd-dz-inner { align-items: stretch }`, plus
   `height: 100%` / `min-height: 0` down the card's own table/row/cell chain, lets the card's
   grid rows compress into the cell's definite height instead of rendering at natural height and
   being clipped by the cell's `overflow: hidden`. Scoped to `.dd-widget--dz-device` only: scene
   widgets and the `dz-favorites` widget's scrolling re-render of the same card markup both keep
   their natural, uncompressed height.
2. **The h:2 floor.** Core's GridStack config (`ddDzDevice.widget.js`) sets `minH: 2` (120px at
   `rowHeight: 60`), the size the compressed card must fit into at minimum. A two-line name clamp
   (`-webkit-line-clamp: 2` on `.dd-widget--dz-device .item.itemBlock td#name`) keeps a long
   device name from growing the card past that floor; the full name stays reachable via the
   existing hover tooltip and `title` attribute.
3. **The h:3+ scroll-cap release.** A multi-level selector (HVAC mode, Scene) scrolls inside its
   own `#status` cell at h:2 (`overflow-y: auto`, a ~60px window); a `container-type: size` query
   on the widget body releases that cap (`max-height: none`) from `@container (min-height:
   150px)` up, i.e. h:3 and taller, so resizing the widget is what reveals the rest of the
   selector. This is the accepted `HVAC 5-level selector cutoff at h:2` baseline exception (see
   the Contract below): every alternative layout was measured and rejected at h:2 (a 1-column
   button stack needs 150px against 120px available; a 2-column grid's min-content forces a
   40x17px collision with the device icon; the real 30px buttons need 96px of vertical room
   against a ~66px status row).
4. **Width-aware slider placement.** The blinds slider's multi-icon track defaults to a bottom
   strip (the safe fallback compact tiles use, and what an unsupported browser degrades to), and
   a `@container (min-width: 200px)` / `(min-width: 220px)` pair on the same size-contained
   widget body moves it beside the icons once the tile is wide enough to give the track a usable
   width there (200px for the double-icon variant, 220px for triple).

The same project also gave the Quick Stats widget a compact single-column row list
(`@container (max-width: 340px)` on its own `inline-size`-contained body, replacing core's
multi-column icon/label/value grid once a tile is too narrow to keep all entries inside the
cell) and squared away a stray Bootstrap 2 caret-margin rule that was dropping the Dash2
edit-toolbar and view-mode-topbar dropdown carets ~4.5px below their labels
(`css/dynamic-dashboard.css`, `.dd-topbar .caret, .dd-toolbar .caret`).

### The Mobile Layout Contract (enforcement)

**`dz-mobile-layout-census.js`** (Playwright, run against the Docker test instance, foreground
only, same as the button and table censuses) censuses 16 routes (17 surfaces, the Setup route's
Theme-tab sub-census counting as its own censused surface) at a single Galaxy S24 (360x780)
emulation profile and runs five geometry checks per route, plus a sixth fail-closed guard class:

1. **Control overlap + squash.** Any two visible interactive elements whose bounding boxes
   intersect more than 4px in both axes fail as overlap (ancestor/descendant pairs, an icon
   inside its own button, are excluded); column-aligned controls in the same cluster with less
   than 2px of vertical gap fail as squash, the `#updelclr` class of bug the wrap-with-gap
   pattern above fixes.
2. **Chrome occlusion + menu-scroll-away.** A fixed/absolute element covering more than 30% of
   the navbar's box fails as occlusion. A route fails as menu-scroll-away when its navbar is not
   fixed/sticky (the mobile in-flow navbar, see the 979px boundary above) AND the page overflows
   horizontally AND scrolling to the horizontal extreme actually removes the navbar from the
   viewport - the class of bug Floorplans had before its fix, kept in the contract to catch a
   regression.
3. **Viewport.** Document `scrollWidth` over 360px (+4px tolerance) fails; any visible element
   whose clip-aware edge draws outside the `[-10, 370]` band fails as drawn-outside (the
   off-canvas side menu is excluded, since it is clipped, not stray).
4. **Dash2 card cutoff** (the forced-desktop Dynamic Dashboard route only). Any icon, toggle, or
   button exceeding its `.dd-widget`'s clip rect by more than 2px fails, as does text overflowing
   without an ellipsis - the Quick Stats overflow class the density rules above address.
5. **Touch targets.** Interactive elements under 24x24 CSS px are recorded, report-only, never a
   FAIL. The `--json` output persists this dataset alongside every measured inter-control gap
   (clustered and unclustered) as seed data for a future spacing-scale project.
6. **Fail-closed guards**, three violation kinds with no baseline exception ever defined for
   them, by design: `themecensus::<route>::theme-tab-not-active` when the Setup route's
   Theme-tab sub-census (the 17th censused surface) never became the active, visible pane;
   `routeerror::<route>` when a route's navigation or measurement threw, or produced no
   geometry, so it would otherwise be silently dropped instead of censused; and
   `dash2render::Dashboard-dash2` when the forced-desktop Dynamic Dashboard did not actually
   render, or its `MobileCensus` layout failed to seed, so check 4 above would otherwise pass
   vacuously against zero widgets. Each closes a fail-OPEN path where an unmeasured surface
   could exit the gate green.

Every violation is checked against a committed baseline
(`scripts/baselines/mobile-layout-contract.json`, docker-test), one entry per censused violation, snapshotting the
live census whether it passes or fails, but only an entry carrying `policy: "exception"`
exempts its key from failing the gate; a plain snapshot entry (no `policy` field) does not, by
design, so a routine `--rebaseline` can never quietly turn a red gate green by re-snapshotting a
live violation. A plain run PASSes (exit 0) unless a violation's key has no matching
`policy: "exception"` entry. Two entries currently carry that policy with a mandatory `reason`
string:

- `cutoff::Dashboard-dash2::dz-device::button.btn.btn-small` - the HVAC 5-level selector cutoff
  at h:2 (see Dash2 Card Density above).
- `overlap::Setup::a.btn-danger.sub-tabs-apply|input#enableautobackup` - the Setup mobile CTA bar
  (`css/settings.css`, a `position: fixed` Apply/Save bar) transiently overlapping in-flow
  settings content; not a rigid-table squash, so flex/gap cannot resolve it, and the fixed-CTA
  positioning strategy itself is a parked owner decision tied to the menus-redesign track.

**Rebaseline workflow.** `--rebaseline` regenerates the baseline from a fresh census and
preserves every existing `policy: "exception"` entry by key UNCONDITIONALLY - even one whose key
does not fire as a live violation on the rebaseline run itself (a stale one is kept and flagged
informational in the run log, not dropped), the same pattern `dz-table-census.js` and
`dz-button-contract.js` use. That is what makes it true that a routine rebaseline can never
silently re-arm a previously accepted exception: an exception is a human decision, not a live
measurement, so it survives a rebaseline regardless of what that one run happened to reproduce.
Like those two contracts, rebaselining is a deliberate act taken only after a reviewed layout
change, never run reflexively to turn a red gate green: run it, inspect the printed summary
against the previous file, and commit the updated baseline on its own, separate from the change
that caused it.

## Components

### Device Cards

Cards render across **three markup contexts sharing one visual language**: classic dashboard
rows (`#holder .row`), the Dynamic Dashboard (`.dd-widget-body`, core's own name for the
GridStack board - never call it "Dash2" in code or docs, see `css/cards.css`'s header comment),
and the mobile dashboard (`table.mobileitem`, `body.dashMobile`). All three consume one **66-token**
`--dz-card-*` / `--dz-mobile-card-*` family in `dz-tokens.css`: a 7-step spacing scale, 4 radius
properties across 3 conceptual tiers, and ~55 per-site structural values. Landed by the
2026-08-07/08 cards-polish pass (audit: `docs/superpowers/2026-08-07-cards-anatomy-audit.md`,
local-only) as a zero-visual-change tokenization followed by three owner-gated refinements: text
hierarchy, the Log/Timer icon accent, and the Dynamic Dashboard hover ring. Card surface: `var(--dz-widget-bg)`
background, `1.5px solid transparent` border (`--dz-card-border-width`), `{rounded.container}`
radius (`--dz-card-radius`, 6px), `--dz-elev-card` shadow - see [Border Radius](#border-radius) and
[Elevation](#elevation).

#### Anatomy

Cards are `<table>` rows styled as CSS grid containers: `.item table[id^="item"] > tbody > tr` is
the visible card box (background, border, radius, shadow), not the wrapping `.item` element.
Classic and Dynamic Dashboard share **one dual-selector rule** for nearly every card-box and
grid-anatomy declaration, e.g.

```
#holder .row .item table[id^="item"] > tbody > tr,
.dd-widget-body .item table[id^="item"] > tbody > tr { ... }
```

This is settled architecture, not incidental duplication: both contexts render the exact same
widget-template markup (`.item table[id^="item"]`), differing only in their wrapping chrome
(Bootstrap `.span4` cell vs. GridStack tile) and clip ancestors. One rule serving both means a
future anatomy change (a new grid track, a new region) lands in both contexts automatically by
construction, instead of needing to be remembered twice. Where the two contexts must genuinely
diverge - the hover ring, the Dynamic Dashboard's height-compression grid - a second, narrowly
scoped rule follows immediately after the shared one, always with a comment naming which core
constraint forces the split (see Traps below).

**Standard card (classic `.span4` / Dynamic Dashboard):**
```
grid-template-areas:
  'name    name    name    bigtext bigtext options'
  'img     img2    status  status  status  status'
  'favorite lastupdate ... lastupdate tools tools'

Rows:    auto | minmax(--dz-card-row-status-min, 1fr) | minmax(0, --dz-card-row-lastupdate-h)
                 (58px)                                                (20px)
Columns: --dz-card-col-icon  --dz-card-col-icon2  minmax(0,1fr)  minmax(0,auto)  minmax(0,auto)  --dz-card-col-trailing
                (48px)              (18px)                                                              (15px)
Gap: 10px (literal, not tokenized - see Traps)
```

**Dashboard card** (the standard/`#dashcontent` view): hides the third row
(`grid-template-rows: var(--dz-card-row-name-h-dash) minmax(var(--dz-card-row-status-min),1fr) 0`,
i.e. `40px minmax(58px,1fr) 0`, `overflow: hidden`).

**Compact card (`.span3`):**
```
grid-template-areas:
  'name       name    name'
  'img        img2    bigtext'
  'lastupdate lastupdate lastupdate'

Rows:    --dz-card-compact-row-heights  (28px 50px 12px)
Columns: --dz-card-compact-col-widths   (58px 5px 1fr)
Gap: --dz-card-space-2xs (2px)
Fixed tile width: --dz-card-compact-width (180px)
```

**Double/triple icon variants**: the double variant overrides `grid-template-columns` to
`var(--dz-card-col-icon) var(--dz-card-col-icon)` (48px 48px, both columns reuse the same token -
a verified duplicate, not two independent 48px values); the triple variant keeps the base columns
and adds an `img3` area inside the existing `1fr` column instead.

**Card icon boxes are pinned**: `#img img` and `#img1 img` (the scene widget's active icon) render
in a fixed `--dz-card-img-size` (40px) box with `object-fit: contain`, so 96px masters (2x art)
stay crisp and never resize the row. An unpinned `#img1` used to render scene icons at intrinsic
size (caught by the icon facts engine's slot-mismatch check).

**Bar-ranges gauge**: core renders its `<dz-bar>` threshold gauge inside the last-update cell;
the theme repositions it as a `--dz-card-bar-height` (4px) full-bleed status edge along the card
top (top corners follow the card radius). Core's inline placement would overflow the 20px bottom
row. Track color comes from `--dz-bar-track-bg` (0.2 neutral grey, both schemes). Applies to
classic pages and the standard dashboard; on the Dynamic Dashboard the gauge stays hidden with its
host cell.

**Dynamic Dashboard card** (Constraint): the same card, mounted in a GridStack cell. Core sets
`defaultH: 2` and `minH: 2` (`ddDzDevice.widget.js`) against a `rowHeight` of 60
(`ddGrid.directive.js`), so the cell is always at least 120px and there is no theme hook for
either. Measured natural card heights are 116px (switch), 118px (dimmer, blinds) and 120px
(selector), so the tallest card needs the whole cell. Consequences:

- The row gap is tightened to `4px` (`.dd-widget--dz-device` scope, literal not tokenized - see
  Traps) from the classic `10px`; at the classic gap the card clips.
- The card keeps its natural height. Forcing `height: 100%` compresses its grid rows (measured
  30/60/20 -> 28/58/20px) and squeezes the switch pill and icons.
- No padding may be reserved around the card, which is why the hover ring is inset - see States.
- Core clips every cell of the card (`dashboard.css`: `.dd-dz-inner table[id^="itemtable"] td
  { overflow: hidden }`), so an icon that overhangs its `td` is shaved here though it is visible on
  the classic dashboard. Not fixable from the theme.

**Mobile card (`table.mobileitem`, the third context).** Confirmed live, not merely assumed: this
is a genuinely different widget template, not a scaled-down `.item` card. It carries no `.item`
class, no `#bigtext`, and no separate `#type`/`#lastupdate` cells - the whole status/value string
lives in one `<td id="status">`. Its rows are `display: flex` inside an outer element that stays
`display: table` (`css/dashboard_mobile.css:40-45,68-85`), which is exactly why it gets its own
`--dz-mobile-card-*` token namespace rather than folding into `--dz-card-*`: the values genuinely
differ site-by-site (e.g. `14px` name line-height here vs. `18px` on desktop), and the two contexts
don't even share a layout algorithm. Two mobile-specific behaviors, both landed 2026-08-08 (Task
5d, fixing pre-existing defects the cards-polish pass did not introduce, confirmed by bisecting
against the pre-pass tree):

- **Arrow-badge scoping.** The round name badge (`--dz-mobile-card-name-badge-size`, 18px) and its
  `::after` arrow glyph (`\2794`) were written for exactly one target: the row-level "view log"
  badge on Temperature/Weather/Utility rows (`td#name a`/`td.name a`). The shared selector list
  also matched `th a` - the section banner's own plain icon link - so the arrow spilled a second
  line below the 18px-tall banner icon into the first data row. Fix: the `::after` arm is now
  scoped to `td#name a:after, td.name a:after` only (`th a:after` dropped); the base badge-circle
  rule is deliberately left unscoped, since it's invisible on the banner anyway (the badge's accent
  background matches the `<th>`'s own accent background) and narrowing it wasn't needed to fix the
  defect. Scenes/Switches rows have no `<a>` inside `td#name` at all (core's template renders plain
  text there), so they were never in scope either way.
- **Nowrap mitigation.** Core sets an inline `style="white-space: nowrap"` on the Temperature
  section's status cell only (`dashboard_mobile.html:469`, core commit `ae507c7aae`, 2026-03-30;
  Weather/Utility carry no equivalent). Because the outer `<table>` still runs the CSS2.1
  auto-table-layout min-content algorithm despite its flexed rows/cells, that one unbreakable cell
  forces the whole table wider than its container, and core's own
  `SECTION.dashCategory{overflow:hidden}` (`style.css:2268`) then silently amputates the overflow
  17px inside the true viewport edge - a hard clip, not a visible scrollbar. The theme mitigates
  with `white-space: normal !important` (required to beat the inline style) plus
  `overflow-wrap: anywhere` as a defensive belt against any future long, naturally-unbreakable
  status string, not just today's nowrap instance. Tracked in `todo.md`'s MITIGATIONS list with the
  theme's standard removal-trigger convention: drop the override once core fixes or removes the
  inline nowrap, not before.

#### Tokens

All values below are byte-equal to what the theme rendered before the cards-polish pass (a pure
tokenization; refine work landed separately, on top). Live in `dz-tokens.css`; none are mirrored in
`dark.css` - every card structural token is geometry (padding/margin/gap/size/radius), never color,
so dark mode already inherits the correct value from `:root` with no override needed (the one
exception, `--dz-card-icon-accent`, is a color and *is* overridden - see Log/Timer Icon Accent).

**Spacing scale** (7 steps, padding/margin/gap only - shares the page-level 8/10/15/20 cluster
values and adds the finer 2/3/5px card-internal steps; see [Spacing](#spacing) > Current Clusters):

| Token | Value |
|-------|-------|
| `--dz-card-space-2xs` | 2px |
| `--dz-card-space-xs` | 3px |
| `--dz-card-space-sm` | 5px |
| `--dz-card-space-md` | 8px |
| `--dz-card-space-lg` | 10px |
| `--dz-card-space-xl` | 15px |
| `--dz-card-space-2xl` | 20px |

**Radius tiers** (4 properties across 3 conceptual tiers - frame, chrome, fine):

| Token | Value | Tier | Usage |
|-------|-------|------|-------|
| `--dz-card-radius` | 6px | Frame | The card box itself; the bar-gauge's top corners reuse it via composition (`var(--dz-card-radius) var(--dz-card-radius) 0 0`), not a separate alias token |
| `--dz-card-radius-chrome` | 5px | Chrome | Options flyout, scrollbar thumb/track, in-card buttons |
| `--dz-card-tooltip-radius` | 4px | Fine | Name-description tooltip |
| `--dz-card-slider-radius` | 3px | Fine | Dimmer/blinds slider track (also `table.mobileitem`'s dimslider, a verified duplicate) |

Tooltip (4px) and slider (3px) don't share a value, so the "fine" tier stays two named properties
under one grouping comment rather than being forced onto one shared property - collapsing them
would silently change one of the two, breaking the pass's zero-visual-change contract. `--dz-card-radius`
closes a gap `--dz-btn-radius`'s own comment ("cards stay 6px: dense card corners, deliberate
split") had anticipated since before this token existed.

**Grid / container** (14 tokens, classic + Dynamic Dashboard shared):

| Token | Value | Notes |
|-------|-------|-------|
| `--dz-card-fill-width` | 99% | `.item` wrapper fill width (classic); the anti-clip judgment call - kept verbatim, see Traps |
| `--dz-card-border-width` | 1.5px | Card `tr` border width |
| `--dz-card-drop-outline-width` | 2px | Drag-drop feedback outline |
| `--dz-card-drop-outline-offset` | 3px | Drag-drop outline offset |
| `--dz-card-drop-hover-bg-alpha` | 0.08 | Drop-hover tint, `rgba(accent, N)` |
| `--dz-card-row-status-min` | 58px | Status row floor |
| `--dz-card-row-lastupdate-h` | 20px | Last-update row height |
| `--dz-card-col-icon` | 48px | Primary icon column |
| `--dz-card-col-icon2` | 18px | Secondary icon column |
| `--dz-card-col-trailing` | 15px | Trailing (options) column |
| `--dz-card-row-name-h-dash` | 40px | `#dashcontent` (standard dashboard) name row |
| `--dz-card-dash2-slider-bottom` | 10px | Dynamic Dashboard blinds slider, compact placement |
| `--dz-card-dash2-slider-left-double` | 121px | Dynamic Dashboard blinds slider, wide placement (2-icon) |
| `--dz-card-dash2-slider-left-triple` | 139px | Dynamic Dashboard blinds slider, wide placement (3-icon) |

**Name / bigtext / bar gauge / value region** (9 tokens):

| Token | Value | Notes |
|-------|-------|-------|
| `--dz-card-name-line-height` | 18px | `#name` line-height |
| `--dz-card-tooltip-gap` | 4px | Name-description tooltip offset (`margin-top`) |
| `--dz-card-tooltip-pad` | 6px 10px | Tooltip padding |
| `--dz-card-value-line-height` | 20px | `#bigtext` line-height |
| `--dz-card-bar-height` | 4px | Bar-ranges gauge height |
| `--dz-card-lastupdate-pad-right` | 50px | `#lastupdate` right padding (wider than the 20px family below - verified, not a typo) |
| `--dz-card-meta-line-height` | 14px | `#type`/`#lastupdate` line-height; N2 verdict, see Text Hierarchy |
| `--dz-card-status-max-height` | 60px | `#status` scroll cap |
| `--dz-card-scrollbar-size` | 4px | `#status` scrollbar width/height |

**Options flyout / favorite / Log-Timer icon** (5 tokens):

| Token | Value | Notes |
|-------|-------|-------|
| `--dz-card-options-offset` | 5px | 3-dot flyout right offset |
| `--dz-card-options-top` | 8px | 3-dot flyout top offset |
| `--dz-card-options-min-width` | 120px | 3-dot flyout min width |
| `--dz-card-favorite-line-height` | 16px | Favorite star and Log/Timer icon line-height (shared value) |
| `--dz-card-icon-accent` | `var(--dz-accent-color)` light / `rgb(77, 184, 228)` dark | Log/Timer icon color; see Log/Timer Icon Accent |

**Images / sliders** (9 tokens):

| Token | Value | Notes |
|-------|-------|-------|
| `--dz-card-img-size` | 40px | Device image box (`#img`/`#img1`/`#img2`-double/`#img3`) |
| `--dz-card-slider-track-bg` | `rgba(0, 0, 0, 0.26)` | Dimmer/blinds slider track; leftover raw color, no accent tie |
| `--dz-card-slider-height` | 5px | Slider track height |
| `--dz-card-slider-right` | 20px | Slider right inset |
| `--dz-card-slider-inset` | 100px | Slider width: `calc(100% - N)` |
| `--dz-card-blinds-slider-left` | 14px | Blinds slider left anchor (classic) |
| `--dz-card-slider-handle-size` | 15px | Slider handle box |
| `--dz-card-slider-handle-offset` | -5px | Slider handle top offset (desktop; mobile is -6px - see Traps) |
| `--dz-card-slider-width-wide` | 55% | Slider width at >=1200px |

**Compact mode** (`.span3`, 9 tokens):

| Token | Value | Notes |
|-------|-------|-------|
| `--dz-card-compact-width` | 180px | Fixed tile width |
| `--dz-card-compact-name-line-height` | 14px | `#name` line-height |
| `--dz-card-compact-input-inset` | 10px | `td.input` width: `calc(100% - N)` |
| `--dz-card-compact-input-max-width` | 100px | `td.input` max-width |
| `--dz-card-compact-input-inset-icon` | 60px | `td.input` width inset, icon-column variant |
| `--dz-card-compact-btngroup-height` | 50px | Scroll-column `btn-group` height |
| `--dz-card-compact-row-heights` | 28px 50px 12px | `grid-template-rows` |
| `--dz-card-compact-col-widths` | 58px 5px 1fr | `grid-template-columns` |
| `--dz-card-compact-col-widths-triple` | 58px 45px 58px | `grid-template-columns`, triple-icon variant |

**Mobile card** (`--dz-mobile-card-*`, `table.mobileitem`, 9 tokens):

| Token | Value | Notes |
|-------|-------|-------|
| `--dz-mobile-card-value-min-height` | 25px | Value cell min-height |
| `--dz-mobile-card-name-badge-size` | 18px | Name/log-link round badge size |
| `--dz-mobile-card-status-max-width` | 60% | Status cell max-width |
| `--dz-mobile-card-status-inner-gap` | 7px | Status inner span `margin-right` |
| `--dz-mobile-card-btn-radius` | 5px | In-row button radius |
| `--dz-mobile-card-btnmini-border-width` | 1px | `.btn-mini` border width (color stays `--dz-accent-color`) |
| `--dz-mobile-card-btnmini-min-width` | 40px | `.btn-mini` min-width |
| `--dz-mobile-card-slider-handle-offset` | -6px | Dimslider handle top offset (desktop is -5px - see Traps) |
| `--dz-mobile-card-selectorlevels-margin` | -30px | Selector-levels negative-margin hack (kept as measured - see Traps) |

#### Text Hierarchy

**Verdict (owner, 2026-08-07): N2 "quiet status."** A dense card used to carry three simultaneous
full-emphasis anchors, not one: `#name` and `#status` shared a single rule
(`.item #status, .item #name { font-weight: var(--dz-weight-semibold) !important; }`, the old
`custom.css:117-120`), so every card carried two full-weight, full-contrast text blocks before
`#bigtext` - the largest element on the card, 22px, accent-colored - added a third. Meanwhile
`#type`/`#lastupdate` were already exactly quiet (secondary color, regular weight); the elements
that actually made a card feel heavy were `#name`, `#status`, and `#bigtext`, and the first two
shared one rule. N2 splits that rule:

```css
/* custom.css */
.item #name {                     /* stays in the existing semibold heading/emphasis list */
    font-weight: var(--dz-weight-semibold) !important;
}
.item #status {                   /* new rule, dropped alone */
    font-weight: var(--dz-weight-regular) !important;
}
```

paired with the metadata line-height tighten (`--dz-card-meta-line-height`, 14px, one step below
the browser's unset `normal`) on `.item #type`/`.item #lastupdate` in `css/cards.css`. `#name`
remains the card's one anchor by repetition and full contrast; `#bigtext` is untouched (still 22px,
accent-colored, `font-weight` still computed `400` by absence, not an explicit declaration - a
future pass could make that explicit and token-driven, that was the N3 candidate, not picked).
`#status` keeps its color (`var(--dz-body-text)`, unaffected); only its weight changed.

Two other candidates were rendered and rejected at the gate: N1 ("one anchor," dropping `#name`
too) and N3 (N2 plus an explicit `#bigtext: regular`). Both stayed within the existing weight scale
(`--dz-weight-regular`/`--dz-weight-semibold`, no new weight introduced). The gate strips required
a switch-card control (no `#bigtext`, no `#status` text - the toggle pill replaces it) precisely
because that card isolates what each candidate changes when the other two anchors aren't in play;
N2/N3 render pixel-identical to CONTROL there, only N1's `#name` change is visible.

**Mobile is structurally unaffected**, not merely unchanged by choice for half the story: N2's
selectors (`.item #status`, `.item #name`) cannot match `table.mobileitem`'s markup at all - it has
no `.item` class and no `#bigtext`. Mobile bolds its status text via a completely separate,
single-purpose rule (`table.mobileitem td:last-child { font-weight: semibold }`,
`css/dashboard_mobile.css`), and confirmed live testing found `#name` there is *already* regular by
default - there is no dual-anchor rule to split on mobile in the first place. The owner's verdict
text named the desktop rule specifically, so mobile's status text was left bold; this is a
deliberate scope decision, not an oversight, and stands as a one-line follow-up if the owner later
wants mobile brought in line.

#### States

- **Card hover (classic)**: `--dz-ring-hover`, composing the resting `--dz-elev-card` shadow with
  the accent ring so a hover rule can never delete the drop shadow (`box-shadow` is a single
  property - see Traps). Full token definitions: [Elevation](#elevation) > Accent Rings.
- **Card hover (Dynamic Dashboard)**: `--dz-ring-hover-inset`. **Closed for good by the owner,
  2026-08-08**, after a full evidence trail:
  1. **Baseline measurement** (shadow-elevation pass, 2026-08-07): the Dynamic Dashboard card sits
     inside five nested `overflow: hidden` ancestors core wraps around every GridStack cell
     (`dd-dz-inner`, `dd-dz-device`, `dd-widget-body`, `dd-widget`, `dd-widget-cell`); measured
     clearance between the ring target and the nearest clip boundary was `4px` left/right but `0px`
     top/bottom on every sampled card, so an outer ring is invisible top and bottom on any card
     whose content reaches the grid's minimum height.
  2. **Six-widget-type verification** (cards-polish Task 3, 2026-08-07): a `+3px` vertical
     breathing-room tweak was tried across every Dynamic Dashboard widget type - `dz-device`,
     `SELECTOR`-type `dz-device` (flagged "especially," the worst case), `dz-favorites`, `dz-room`,
     quick-stat, energy-dashboard. Only the first two are subject to the ring rule at all
     (favorites/room already carry 65-90px of natural bottom clearance; quick-stat/energy-dashboard
     use unrelated DOM never in the ring rule's scope). Neither in-scope type cleared: `dz-device`
     landed `1.5px`/side (`0.5px` short of the `2px` target), and `SELECTOR` went *negative*
     (`-1.5px` bottom, worse than the untweaked baseline) because its `<table>`/`<tbody>` ancestors
     grow to fit the HVAC-mode button group's 64px content height regardless of what the row's own
     height is told to be - a CSS2.1 table-height-as-minimum behavior that absorbs the entire tweak
     before it can shrink anything.
  3. **Owner reopened the verdict** (2026-08-08) and requested three fresh options, rendered without
     the padding tweak (natural geometry, matching how each would actually ship): **R1** (no hover
     ring at all), **R2** (straddle: `1px` inset + `1px` outer, meant to halve the clearance need
     and self-degrade gracefully on tight cards), **R3** (global inset, applied to classic cards
     too, rendered once as a labeled reference point).
  4. **R2, pixel-sampled** (not eyeballed): on roomy cards it renders exactly as designed, a clean
     double ring. On the tight cards (`dz-device`/`SELECTOR`, `4px` L/R but `0px` T/B), it does
     **not** degrade to "a bit thinner" - the `4px` sides render the full double ring, the `0px`
     sides render *zero* outer ring (not a faint sliver), producing a ring that looks different
     depending which edge you look at. Rejected: an asymmetric collapse reads as a rendering defect,
     not a deliberate thin-ring look, and is worse than either R1 (nothing) or the existing inset
     (uniform).
  5. **R3**, rendered once on a classic card for reference, read closer to a "selected" look (a
     flush line hugging the edge) than a "hovered" one (the composed outer glow+shadow) - consistent
     with the owner's earlier disfavor.
  6. **Final verdict**: keep the inset ring on the Dynamic Dashboard. R1 and R3 declined, R2's
     straddle rejected on the asymmetric-collapse evidence above. No code change - the shipped
     `--dz-ring-hover-inset` rule already implements this. Classic cards are unaffected either way,
     still on the composed outer `--dz-ring-hover`. A future pass could revisit an outer look only
     by making the Dynamic Dashboard card shorter on every widget type (a density change, per
     `css/cards.css`'s own comment), not by changing which ring token is used.
- **Status glows** (timeout/protected/low-battery): semantic ring color instead of a resting drop
  shadow, `!important` (beats the resting card shadow's own `#holder` specificity). Full token
  values and dark-underlay deltas: [Elevation](#elevation) > Status Glows.
- **Update pulse**: `tr.update-pulse` plays an 0.8s keyframe that flashes the accent ring outward to
  a `3px` peak, then settles back to the resting card shadow (`css/device-status.css`). The peak
  carries a `dz-shadow-exception` marker - an animated intermediate value, intentionally wider than
  the static 2px ring token, collapsing it to the token would flatten the pulse. See
  [Elevation](#elevation) > Interactive States.
- **Drag (dragging card)**: `scale(0.98)` + `--dz-elev-drag`. **Drop target (idle)**:
  `--dz-card-drop-outline-width` (2px) dashed accent outline at 0.3 alpha, `--dz-card-drop-outline-offset`
  (3px). **Drop target (hover)**: same outline solid, plus a `--dz-card-drop-hover-bg-alpha` (0.08)
  accent background tint, `0.15s ease` transition.

#### Log/Timer Icon Accent

**Verdict (owner, 2026-08-07): accent color, with a dark-scheme fix.** The Log/Timer icon pair
(`.timers_log .btnsmall`/`.btnsmall-sel`) had carried an accent-color declaration in `css/cards.css`
since before this pass, but it was **dead code**: `css/buttons.css`'s shared "ghost" family rule
(`.btn-default, .btn-group .btn-default, .btnsmall, .btnsmall-sel, .btn-small { color:
var(--dz-btn-ghost-text) !important; ... }`) always won the tie, because a plain declaration can
never outrank `!important` regardless of selector specificity. The icons rendered quiet gray, not
accent, on every card, always.

**Fix: matching-force**, not narrowing the shared rule. `css/cards.css`'s declaration gained its own
`!important`; `.timers_log .btnsmall`/`.timers_log .btnsmall-sel`'s two-class specificity (`0,2,0`)
then beats the ghost rule's one-class `.btnsmall` (`0,1,0`) once both carry `!important`. This
follows an existing in-repo precedent rather than inventing a new pattern: `.aw-footer .btn-default`
(`css/buttons.css`, ~line 895) already overrides the same ghost rule for one context via the
identical mechanism, and `css/cards.css`'s own comment for this rule already used the same
mechanism to win the `border` property. Documented in both files with cross-reference comments so a
future reader finds the explanation from either side.

**Token**: `--dz-card-icon-accent` (`dz-tokens.css`, light `:root`) = `var(--dz-accent-color)`.
Contrast is judged against **WCAG SC 1.4.11 (Non-text Contrast, 3:1)**, not SC 1.4.3's 4.5:1 text
threshold - these are graphical Ionicon glyphs with no text label, not text. Light already clears
3:1 as-is (measured **4.51:1** resting / **3.96:1** hover against the light card background). The
raw dark accent (`#0b9eda`, `rgb(11,158,218)`) does not: measured **2.48:1** resting / **2.29:1**
hover against the dark card background, both below the 3:1 floor. `dark.css` overrides the token to
a derived value, **`rgb(77, 184, 228)`**: the accent RGB blended **27% toward white**, the first
1%-step blend that cleared 3:1 against *both* measured dark-underlay backgrounds (resting
`rgb(81,85,88)`, hover `rgb(74,92,101)`, the tonal `--dz-btn-hover-bg` tint composited over the card
background). Re-measured live after shipping, not just computed: **3.33:1** resting / **3.08:1**
hover, both passing with a real but narrow margin above the 3:1 floor - flagged in the `dark.css`
token comment as a spot to revisit for more headroom in a future pass.

#### Selector Levels

Multi-level Selector-switch devices (SelectorStyle-0: HVAC Mode, Scene Selector, any device with 2+
named levels) render their level buttons as ONE joined segmented control, reusing the theme's own
already-shipped connected-toolbar family (`css/buttons.css:500-529`, the same mechanism visible today
on the Events page's Disabled/Enabled toggle) rather than a bespoke mechanism. Desktop:
`.item .btn-group:not(.span3 *)` (`css/cards.css`), covering the classic list (`#/LightSwitches`), the
classic Dashboard, and the Dynamic Dashboard tile - `.btn-group` is SelectorStyle-0's sole emitter
inside a card, so one rule set serves all three. Mobile:
`table.mobileitem td#status > span:has(> span > .btn-mini)` (`css/dashboard_mobile.css`), adapted for
core's `span > span > .btn-mini` markup shape.

**Look.** Accent-bordered ghost segments (`.btn-default`: `background: transparent`,
`border-color: var(--dz-accent-color)`), collapsed 1px seams (`margin: 0 0 0 -1px !important`, the
family's existing seam-collapse trick), family radius only at the group's true first/last child
(`var(--dz-btn-radius)`, 10px - interior buttons stay square), the existing `toggle-selected` fill left
untouched (`.btn-selected` desktop, `.btn-info` mobile, both already `--dz-btn-toggle-selected-bg/-text`
or the equivalent accent tokens). Wrapped segments keep their natural content width, no `flex-grow`
stretch, so a lone wrapped segment reads as a small connected segment rather than "a large base
button" (an earlier, rejected pass - see the evidence trail below).

**Wrap behavior.** `flex-wrap: wrap`; a wrapped row anchors flush against the row above (`gap: 0`) and
right-aligned to the group's own edge (`justify-content: flex-end`, `margin-left: auto` on the shell) -
reads as one continuous connected shape (a stair-step silhouette) rather than two stacked
mini-toolbars. A small-gap "separate toolbar run" variant was built and screenshot-compared on the live
HVAC 5-level wrap case and rejected: at real viewing size it read as two distinct controls, undermining
the reason this control exists (one control, never a ragged disconnected wrap).

**Mechanism notes:**

- **Wrap-corner clip.** The shell (`overflow: hidden`, `border-radius: var(--dz-btn-radius)`) still
  rounds the group's actual exterior boundary even though every button also carries its own
  first/last-child radius: `:first-child`/`:last-child` only know the group's absolute first/last
  button, not "first/last of whichever row the wrap happens to produce," so a square-cornered INTERIOR
  button can land at a wrap corner (measured: "Auto", the HVAC 5-level case). The clip papers over that
  gap; without it, that button's square corner would show through the shell's rounded position.
- **Inset focus ring** (`--dz-btn-focus-ring-inset`, `dz-tokens.css`), re-verified live under this
  mechanism, not carried over on assumption from an earlier round: with the shell clip still in place,
  the family's standard outward ring (`--dz-btn-focus-ring`) renders fine on the group's TRUE first/last
  child (their own rounded corners roughly match the clip curve) but is amputated down to almost
  nothing on the same square-cornered interior button the clip note above describes. Which segment
  lands at that position depends on a device's own level count and label lengths, so "usually fine,
  occasionally amputated" was rejected as a default; every segment in both contexts uses the inset ring
  uniformly instead.
- **The ~2px wrapped-row junction.** The horizontal (within-row) seam collapses to a true 1px hairline
  automatically, because `flex-wrap` resets which button counts as "previous" at every line break, so
  the `margin: 0 0 0 -1px` trick applies per row with no extra rule. There is no equivalent CSS
  selector for "first item in a wrapped row" the way `:first-child` identifies the group's true first
  child, so nothing collapses the VERTICAL row-to-row junction the same way: it stays two adjacent 1px
  borders (~2px combined), measured directly (`border-bottom-width`/`border-top-width` both compute
  `1px`, both accent-colored) rather than assumed. This is a structural limit of flex-wrap, not an
  oversight - visually marginal at normal viewing size (not visible in a screenshot strip without
  zooming past ~3x), disclosed rather than chased.

**Compact exception.** The Compact Dashboard (`DashboardType=1`, `.span3` tiles) is permanently
excluded (`:not(.span3 *)` scoping throughout both files): its fixed ~50px-tall card has no room for a
multi-row wrap at all, so it keeps its own pre-existing, deliberate vertical scroll-snap list
(`height`, `overflow-y: auto`, `scroll-snap-type: y mandatory`, `css/compact.css`) instead of joining
this mechanism. See [Compact Dashboard Grid](#compact-dashboard-grid).

**Census exemptions**, at two different layers:

- The mobile-layout census's generic squash rule (any two column-aligned controls with under 2px of
  vertical gap fail as "stacked controls") would otherwise flag every segment inside this joined group,
  since a connected control's collapsed seams are structurally exactly that shape. A structural,
  group-scoped exemption lives directly in `dz-mobile-layout-census.js` (docker-test rig), keyed on
  real DOM group membership (the actual `.btn-group` node two elements share), never on
  fill/border/color - deliberately not cluster-keyed, because core duplicates `id=status`/`id=type`
  across every row, which would make a cluster-keyed exemption unsound. Provenance: the plan and brief
  that dispatched this work both cited a "nativeToggle exemption" as an existing precedent to mirror.
  It did not exist - a full rig-history grep (`git grep -i nativeToggle` across every commit) returned
  zero hits, and the squash loop had never carried any pair-skip exemption before this task. Caught
  before any code was written; the exemption above was built from the file's real, closest precedent
  instead (the overlap check's own ancestor/descendant exclusion, the same "structurally one unit, not
  two independent controls" shape applied to a different check), not from the fabricated reference.
- The Dynamic Dashboard's h:2 GridStack cell still cannot fit a 5-level selector without scrolling (see
  [Dash2 Card Density](#dash2-card-density) > point 3): the accepted baseline exception
  (`cutoff::Dashboard-dash2::dz-device::button.btn.btn-small`, `mobile-layout-contract.json`) stays,
  re-verified rather than assumed still needed or auto-removed. This is a vertical-space constraint
  (how many rows N segments need at a given width, versus the ~66px a h:2 cell leaves), independent of
  whether the segments render as separate pills or one connected run - this mechanism change neither
  adds nor removes rows, so it does not change the constraint. Directly re-measured for this
  codification, not assumed from the mechanism change alone: the live HVAC Mode device still clips its
  wrapped rows past the widget edge at h:2/360px (25-85px past the edge across its three wrapped
  buttons).

**Candidate evidence trail.** Five candidates were rendered against a live ANCHOR (the Events page's
Disabled/Enabled toggle, the existing connected-toolbar family the owner pointed at) before this
mechanism shipped:

| Candidate | What it was |
|---|---|
| CONTROL | Pre-pass separate pills (baseline, via git interception) |
| S1 | Container-clip shell: accent-fill background/1px gap dividers, later a neutral-token fill, `flex-grow` edge-to-edge tiling |
| S1b | S1 plus a 1px outer border on the container (the "standard enclosed segmented" look) |
| S2 | A heritage joined style excavated from `upstream/master`-era CSS, rebuilt on current tokens |
| **S3** | The theme's own current connected-toolbar family, applied verbatim - **shipped** |

Two rounds were rejected before S3 shipped:

1. **Design-disconnect (CONTROL/S1/S1b/S2, all four).** Rejected on a live screenshot as
   "design-disconnected from the theme's other buttons." The owner's own reference point, "an option
   like the joined buttons we have now," was the LIVE connected-toolbar rendering already in the theme,
   which S2 had modernized past recognition: an instruction to "modernize [S2] to neutral tokens"
   stripped the accent-bordered character that made the heritage style read as this theme's own family
   in the first place (**the S2 neutralization miss** - provenance for why S3 reuses the family
   verbatim rather than reintroducing a modernized heritage look).
2. **The giant-base-button stretch (S3, first pass).** S3 itself was accepted in shape, but as
   strip-tested it still carried the earlier round's `flex: 1 0 auto` tiling, so a lone wrapped segment
   stretched to the full row width and read as "a large base button," not a segment of the family.
   Fixed by dropping the stretch (natural-width wrap, as shipped).

Full round-by-round detail, screenshots, and measurements:
`.superpowers/sdd/2026-08-08-selector-segmented/task-1-report.md` and `task-3-report.md`.

#### Traps

Load-bearing quirks a future edit could break without realizing it:

- **The Dynamic Dashboard card is deliberately not stretched to its cell.** `height: 100%` looks
  like the obvious fix for "card doesn't fill its GridStack cell," but it compresses the card's own
  grid rows (measured 30/60/20px -> 28/58/20px) and squeezes the switch pill and icons. The cell is
  already guaranteed >= the tallest natural card height (120px, via core's `minH: 2`); the card
  needs no forced height, only `align-items: stretch` on its flex parent.
- **`:has(.item)` scopes every card-grid rule to rows that actually hold device cards.** Without it,
  the plain Bootstrap `.row` class - reused by unrelated Angular views (e.g. the Events page's
  `<timesun>` topbar) - gets treated as a card grid and stretched to a full track. `.item` is a
  device-card-only class; `:has(.item)` is what makes the broader `.row` selector safe. Browsers
  without `:has()` support fall back to plain Bootstrap float layout (functional, no card grid),
  not breakage.
- **Matched reset+override pairs travel together.** The Bootstrap-span wrapper reset
  (`:is(.span2, .span3, ...):has(> .item) { padding: 0; margin: 0; box-sizing: border-box }`) and
  the card's own `box-sizing: border-box` (`.item, .item table[id^="item"], .item table[id^="item"]
  > tbody > tr`) are two halves of one contract: the wrapper reset is what makes any *future*
  wrapper padding safe (insets instead of grows the cell), and the card's own border-box is what
  keeps its `1.5px` border from adding to its rendered height. Editing one half without the other
  silently breaks the pairing.
- **`box-shadow` is a single property.** A hover or status rule that lists only a ring or glow
  deletes the resting `--dz-elev-card` shadow outright - CSS does not merge multiple `box-shadow`
  declarations on the same element, a later one replaces the whole property. Every card-hover/status
  rule in the theme either composes the resting shadow into its token (`--dz-ring-hover`) or
  restates it explicitly alongside the new layer (`device-status.css`'s status hovers). See
  [Elevation](#elevation) > The Shadow Contract for the enforcement gate (`scripts/check-shadows.sh`).
- **A handful of geometric values are kept verbatim, not "cleaned up," because their purpose is
  unconfirmed.** `--dz-card-fill-width` (99%, paired with a `2px` `margin-left`) reads like an old
  sub-pixel anti-clip hack; `--dz-mobile-card-slider-handle-offset` (-6px) differs by 1px from
  desktop's -5px; `--dz-mobile-card-selectorlevels-margin` (-30px) is a negative-margin hack of
  unconfirmed necessity. All three were tokenized at their current value rather than investigated or
  "fixed" (the tokenization pass was explicitly zero-visual-change); each carries a source comment
  flagging it as a possible drift, not a deliberate design value, so a future pass can grep for them
  before removing anything.
- **`.span3 #status` is accent-colored while classic `#status` is body-text colored** - an open,
  unresolved question (could be deliberate density-driven emphasis at the 180px compact tile, or
  drift from an earlier pass), not a bug the N2 verdict was meant to touch.
- **The mobile dashboard's camera section loads late.** `#dashCameras` is injected asynchronously
  (thumbnail `blob:` URLs) by non-Angular JS - it carries no `ng-scope` class, so it never joins the
  Angular digest the other sections settle on, and a plain `networkidle` wait does not guarantee it
  has finished pushing content down. Any geometry measurement or screenshot of the mobile dashboard
  should poll for `#dashCameras` present in the DOM **and** its height stable across two consecutive
  polls before capturing; card positions below the cameras section can still shift after a naive
  "page loaded" signal.
- **Two grid-gap values stay untokenized:** the classic 10px card-grid gap and the Dynamic Dashboard's
  4px tightened gap remain as literals in `css/cards.css` instead of joining the `--dz-card-space-*`
  scale. Both were audit WART rows reserved for a hierarchy candidate that was superseded at the gate
  (the N-series replaced the "airy" H3 direction), and the 4px value is not a step on the 7-step card-space
  scale, so tokenizing the pair symmetrically is impossible without either adding an off-scale token or
  changing a value; they remain refine candidates for a future density decision.

### Form Inputs

- **Text/number/password**: transparent background, bottom-border only (`1px solid var(--dz-accent-color)`), secondary text color, max-width 250px
- **Checkbox**: custom-drawn, 14x14px, `{rounded.xs}` radius, `1px solid blue` border, 8x8px blue inner fill when checked
- **Radio**: same as checkbox but `{rounded.circle}` on both outer and inner
- **Textarea**: `{rounded.xs}` radius, `1px solid blue` border, full width
- **Select (jQuery UI)**: bottom-border only, blue text, semibold weight (`--dz-weight-semibold`)

### Toggle Switch (feature: `switch_instead_of_bigtext`)

Material-style slider. Track: 40x15px, `{rounded.container}` radius. Handle: 20x20px circle.

| State | Track | Handle | Handle shadow |
|-------|-------|--------|--------------|
| Off | `rgba(blue, 0.2)` | `var(--secondary-text-color)` | `var(--dz-elev-card)` |
| On | `rgba(blue, 0.5)` | `var(--dz-accent-color)` | same |

Handle translates `34px` right on toggle, `0.4s` transition.

### Navigation

**Top navbar**: `var(--dz-nav-bg)` background with `--dz-elev-popup` shadow. Links distributed via `display: flex; justify-content: space-around`. Link style: Inter semibold (`{typography.semibold}`), `{typography.sm}`, `var(--dz-body-text)`, `{rounded.interactive}` radius.

- **Active page**: `rgba(blue, 0.4)` background, `1px solid blue` border
- **Dropdown hover**: `rgba(blue, 0.15)` background
- **Dropdown menu**: `var(--dz-body-bg)` background, `{rounded.container}` radius, `--dz-elev-popup` shadow

**Sub-tabs / Nav-tabs**: underline style. Inactive: transparent bottom border. Active/hover: `2px solid var(--dz-accent-color)` bottom border, blue text color. No background change.

**Mobile hamburger** (max-width: 979px): fixed-position 25x25px toggle. Three 4px bars animate to X via `rotate(135deg)` / `rotate(-135deg)` transforms, `0.2s ease-in-out`. Gets blue background pill with `{rounded.container}` bottom corners after 50px scroll.

### Charts (Highcharts)

| Element | Style |
|---------|-------|
| Background | `var(--dz-widget-bg)` |
| Text (titles, labels, legends) | `var(--secondary-text-color)`, Inter (`var(--dz-font-family)`) |
| Tooltip box | `var(--dz-body-bg)` fill, 60% opacity, no stroke |
| Grid lines | `var(--dz-body-bg)` |
| Export button | card surface, `4px` radius, blue icon stroke |
| Export menu | card surface, `{rounded.container}` radius, `--dz-elev-card` shadow |
| Zoom buttons | outlined style, `{rounded.interactive}` radius |
| Zoom reset | outlined with `var(--dz-accent-red)` border |

### Dialogs (jQuery UI)

- Background: `var(--dz-body-bg)`
- Max: `calc(100vw - 20px)` x `calc(100vh - 20px)`
- Content max height: `calc(100vh - 150px)` with `overflow-y: auto`
- Button pane: flex wrap, `5px` gap
- Dialog buttons: filled primary style
- Mobile (max-width: 767px): tables forced to `100%` width with `table-layout: fixed`

### Dimmer Slider

- Track: `rgba(0,0,0,0.26)`, 5px height, `{rounded.sm}` radius
- Range fill: `rgba(blue, 0.5)`
- Handle: 15px circle, solid `var(--dz-accent-color)`, positioned -5px top
- Width: `calc(100% - 100px)` (start point fixed relative to the card, so it never crosses the device icon), 55% on wide screens (1200px+)
- Blinds cards (any card with a second icon cell): track anchored on BOTH edges (`left: 14px` for the handle's -12px overhang, `right: 20px`, `width: auto`); the icon clearance itself comes from core's inline `margin-left` per variant, so the track can never overlap the blind icons at any card width

### Theme Hub

Every theme setting (the former injected Theme tab, the former injected Icons tab, and the
former standalone `themesettings.html`) lives in one page, the **theme hub**
(`src/js/theme-hub.js`, `src/js/theme-manifest.js`, `src/js/theme-hub-previews.js`,
`css/theme-hub.css`). It is the sole settings surface: the legacy tabs and their
MutationObserver self-healing machinery (`injectThemeTabs`/`armThemeTabsHealer`, formerly in
`settings-ui.js`) are deleted, along with that file and `themesettings.html`.

**Pseudo-route.** The theme cannot register an Angular route (core owns `app.routes.js`, and
any unknown hash falls through to `.otherwise` -> redirects to `#/Dashboard`), so the hub is a
click pseudo-route with no URL of its own, following the `js/custom_page.js` technique: one
Setup-menu `<li>` (`dzInsertHubMenuEntry`) is inserted immediately after core's own Settings
item. Clicking it (`dzOpenThemeHub()`) hides core's routed content (`#main-view`, the `ng-view`
mount) and shows the hub, a SIBLING of `#main-view`, never a child - Angular re-renders
`ng-view` on every digest and would wipe anything placed inside it, the same defect that forced
the old injected tabs' MutationObserver healer. A one-time `hashchange` listener
(`dzCloseThemeHubOnLeave`) restores core's content the moment the user navigates away, so the
hub is a page, not a hijack. The single menu insertion feeds BOTH surfaces at once: the Setup
dropdown, and the tile grid, since `settings_page.js` builds its grid from that same `<ul>` at
click time - no second registration. FAIL CLOSED throughout: if the Setup menu `<ul>` or its
Settings item cannot be matched, no entry is added (never a broken one), logged as a structured
warning.

**Manifest-driven rendering.** `THEME_MANIFEST` (`src/js/theme-manifest.js`) is the single
declarative source of truth: nine ordered groups (General, Menus and navbar, Dashboard, Device
cards, Charts and log, Background and branding, Colors and schemes, Icon packs, About), 35
entries. Each entry names its `storageKey` (the exact `theme.json` feature key or top-level
value, unchanged, so the storage seam's positional format stays migration-compatible), a
`control` (`toggle`/`number`/`text`/`select`/`custom`), a `label`/`description`/`appliesTo`
tag, an optional `previewId`, an optional `parent` for the five checkbox-gated pairs the legacy
tab expressed as nested checkboxes, and `reloadOnDisable` (true only where a live disable
cannot apply without an already-executed script being un-executed). `dzBuildThemeHub()` walks
the manifest once to build one underlined tab plus one `.dz-hub-section[data-group]` per group;
`dzRenderGroupRows()` renders one `.dz-hub-row[data-setting]` per non-`custom` entry (control +
label + `appliesTo` tag + description, dependent rows nested under their parent's
`.dz-hub-children` and disabled together with it) and a `.dz-hub-custom-mount` for each
`control:"custom"` entry (scheme picker, custom-colour swatches, icon-pack installer, About).
Adding a setting is a manifest entry, not new markup.

**Underlined-tab group nav.** Group navigation mirrors the theme's existing flat-underline tab
language (`css/nav.css` `.nav-tabs`, reused a third time after the icon-pack tabs below): one
row of `<button>` tabs, the active one underlined in the accent color, one section visible at a
time. It is horizontal on BOTH desktop and mobile, not a sidebar or drawer: on narrow viewports
the bar scrolls horizontally INSIDE its own box (`overflow-x: auto`, a themed thin scrollbar)
instead of wrapping or widening the page, so opening the hub never triggers page-level
horizontal scroll at any width, and every one of the nine tabs stays reachable by scrolling the
bar itself.

**Instant apply.** Every setting change applies live and persists immediately; there is no Save
button. `dzApplyHubSetting()` mirrors the in-place reconcile's existing appliers
(`settings-store.js applyThemeDeltaInPlace`) verbatim for the extra visual effect a setting
drives (`DZ_HUB_APPLIERS`: `card_min_width`/`card_max_width` -> `applyCardWidths`,
`logo`/`hide_logo` -> `setLogo`, `background_img`/`background_type` -> `applyBackground`,
`navbar_icons_text` -> `applyNavbarIconsText`), loads or unloads the setting's feature file
generically, then persists through the `settings-transport.js` seam
(`storeUserVariableThemeSettings("update")`). A `reloadOnDisable` row surfaces a disclosure
note only once its live disable actually needs a reload (an executed `.js` file cannot be
un-executed); a CSS-only feature never shows one, since disabling it just unloads a stylesheet
live.

**Previews.** Each row's `.dz-hub-preview` box renders a mini illustrating the setting
(`src/js/theme-hub-previews.js`, the `DZ_HUB_PREVIEWS` registry + `dzRenderPreview()`), one of
two kinds: a LIVE TOKEN MINI built only from `var(--dz-*)` references, so it recolors
automatically when the scheme changes with no JS re-render (device-card toggle, navbar strip,
chart bands, card width, and others); or, for the three settings with no on-screen colour to
mirror (`standby`, `check_update`, `notification`), a scheme-neutral inline `<svg>` sketch in a
fixed muted grey that reads on both backgrounds, deliberately not a token it has nothing to say
about. A setting with neither a faithful mini nor a sensible sketch keeps `previewId: null` and
renders no preview; the row is still valid.

**Colors and icon packs, hosted.** The `scheme`/`custom_color_scheme`/`iconpacks` manifest
entries are `control:"custom"`: their mount dispatches to the SAME existing UI the legacy tabs
used, relocated, not rewritten. `renderSchemePicker()` (`src/js/schemes.js`) and the 7-swatch
custom-colour editor mount into the hub's Colors group (see [Colors](#colors) above for the
scheme picker/persistence contract). `src/js/iconpack.js` loads `iconsettings.html` into the
hub's Icon packs group the same way (grid detailed below). Both mounts render only once the
hub's section is actually attached to the live document (`dzBuildThemeHub`, right after the DOM
insert), since both resolve their containers by `getElementById`/jQuery `#id`, which only match
attached nodes.

**About and attribution.** The General tab carries a short intro (name, live version, one
line); the About tab (the last tab, owner-added) carries the expansive version, a modernized
description, a Contributions block (Design: EdddieN; Code: davidlb, DewGew, landaisbenj,
Rouzax - every name linked to its GitHub profile, none highlighted), the repo/wiki links from
`theme.json`, and a required Icons8 attribution ("Icons by Icons8" linking `icons8.com`, the
free-tier license obligation). The version string is always read live from `theme.json`
(`dzHubVersionLabel()`), never a hardcoded copy.

**Maintenance and the device-image editor.** The About tab also hosts the coverage-gate
affordances the legacy tab exposed: three confirm-gated actions in the Filled-danger family -
reset to defaults, clear the browser cache, reset custom colours to the active scheme's
defaults - wired to the same underlying functions the legacy tab used (a UI relocation, not new
behavior), plus the per-device custom-icon editor (shown only while `icon_image` is enabled):
add/remove by device idx, persisted to the `custom` uservariable's icons slot, re-derived from
`getcustomiconset` on every action so it stays idempotent.

**Coverage.** `dz-manifest-contract.js` asserts every `theme.features` key and every
seam-stored value maps to exactly one manifest entry (or a `control:"custom"` hosted section).
`dz-mobile-layout-census.js`'s mobile-polish census opens the hub as one of its standing
surfaces (one `ThemeHub*` entry per group, both viewports), so a future setting or group is
measured for overlap/squash/occlusion/overflow the same as every other page, never exempted.

#### Settings storage

**Two-layer model.** Theme settings resolve through Domoticz core's native `ThemeSettings` API
(`ThemeSettingsAPI: 1`, core `WebServerCmds.cpp` `Cmd_ThemeSettingsGet/Set/SetDefault`), read
and written entirely through `src/js/settings-transport.js`. Two server-side rows exist per
theme: an **instance layer** (`themesettings_setdefault`, one shared row for the whole
Domoticz instance, the house defaults) and a **per-user layer** (`themesettings_set`, one row
per logged-in identity). `dzApiLoad()` reads both and applies them onto the in-memory `theme`
object, instance then user, so a personal override always wins over the shared default for the
keys it is allowed to touch.

**Scope rule.** Not every setting may live in the per-user layer. Every manifest entry
(`src/js/theme-manifest.js`) and every snapshot-only extra (`DZ_SCOPE_EXTRAS`) carries a scope
of `"user"` or `"house"`, resolved through `dzSettingScope()`, never read off `entry.scope`
directly. The rule, verbatim from the manifest's own header comment:

> per-user = anything that only changes how your own browser renders; house = shared content,
> branding, infrastructure, and per-device data.

`dzSnapshotSubset(snap, "user")` enforces this structurally: a per-user write can only ever
carry `"user"`-scoped keys, so a house key cannot be overridden per user even by a bug.
`dz-themesettings-contract.js` asserts the split live against the running theme.

**The 29/9 split.** Every persisted key falls into exactly one scope:

| Manifest group | User-scope keys (29 total) | House-scope keys (9 total) |
|---|---|---|
| General | `standby`, `standby_after`, `check_update`, `notification`, `center_popups`, `footer_text_disabled` | |
| Menus and navbar | `custom_settings_menu`, `navbar_icons`, `navbar_icons_text`, `sidemenu` | `custom_page_menu`, `button_name`, `custom_url` |
| Dashboard | `dashboard_show_last_update`, `dashboard_columns` | `dashboard_camera`, `dashboard_camera_refresh`, `dashboard_camera_section` |
| Device cards | `time_ago`, `fade_off_items`, `switch_instead_of_bigtext`, `switch_instead_of_bigtext_scenes`, `wind_direction`, `icon_image`, `card_min_width`, `card_max_width` | |
| Charts and log | `log_plot_bands` | |
| Background and branding | `background_img`, `background_type` | `logo`, `hide_logo` |
| Colors and schemes | `scheme`, `custom_color_scheme` | |
| Snapshot-only extras (no manifest row) | `scheme_base`, `color_scheme`, `user_schemes`, `dark_theme` | `icons` |

House data is shared content, branding, infrastructure, and per-device state (the custom menu
page, dashboard camera wiring, the logo, and the per-device icon list): things that describe
the house, not the person looking at it. Everything else, including which color scheme you
picked and how wide you like your cards, is yours alone.

**Promote and reset.** Three actions on the About tab's Maintenance block manage the two
layers directly, each behind a confirm (`dzHubConfirm`) and each gated on `dzSettingsMode()`
(`{api, perUser, admin, noIdentity}`), rendered only in native-API mode:

- **"Save my current preferences as house defaults"** (`dzHubPromote` -> `dzApiPromote()`,
  visible only when `admin && perUser`) copies the admin's own personal settings over the
  house defaults. Needs both: with no personal layer at all, the session's settings already
  *are* the house defaults (see PerUser-false collapse below), so promoting would be a no-op.
- **"Reset my personal settings"** (`dzHubResetMine` -> `dzApiResetUser()`, visible when
  `perUser`) deletes the caller's personal row; the session falls back to the house defaults.
- **"Reset the house defaults"** (`dzHubResetHouse` -> `dzApiResetHouse()`, visible when
  `admin`) deletes the shared instance row, resetting it to theme.json factory values.
  Personal settings of other users are untouched.

"Reset theme to defaults" (`dzHubDoResetTheme`), unlike the three above, is mode-aware rather
than mode-gated: it resets every native layer this identity can reach (house when admin,
personal when `perUser`) and only then clears the localStorage cache and reloads, so a partial
failure (already warned by `dzApiFail`) never masquerades as a clean reset.

**PerUser-false collapse.** A shared, non-differentiated session (this rig's default primary
instance under `-nowwwpwd`, or any core that resolves every request to the same identity)
reports `dzSettingsMode().perUser === false`. `dzApiSaveSettings()` takes its single-layer
branch there, writing only the instance row; the house-scope indicator's own render condition
(`entry.scope === "house" && dzSettingsMode().perUser`, `theme-hub.js`) never fires, so no
house chip and no locked row ever appear. The hub collapses to behave exactly like the legacy
single-shared-settings page: every row editable by whoever can reach it, since there is no
second layer to distinguish a personal setting from a shared one.

**Legacy fallback and seed-once migration.** `dzProbeThemeSettingsAPI()` checks `getversion`
for `ThemeSettingsAPI: 1`. When the core lacks it (or the probe fails), `dzSettingsMode().api`
is false and every read/write routes through the original uservariable transport
(`dzThemeSettingsLoad`/`dzThemeSettingsSave`, the three `theme-<folder>-features/-custom/-colors`
variables), unchanged from before this migration. On a capable core, `dzSeedFromLegacyIfPossible()`
runs once per cold boot for a session that may write the instance layer: if the native instance
row is empty (`DZ_LOAD_EMPTY`) but the three legacy variables exist, it loads them through the
legacy transport, snapshots the resulting `theme` object, and writes that snapshot into the
instance layer (`dzApiWriteInstanceFull`). The three legacy variables are left in place,
unchanged, frozen: a core rolled back to a version without the native API still finds them
intact and boots from them exactly as before the migration. The migration is idempotent: once
the instance row exists, `dzApiLoad()` reports `DZ_LOAD_LOADED` on every later boot and the
seed step never runs again.

**Reachability.** Two menu entries feed one hub, so every session that can reach it gets
exactly one visible way in. `dzInsertHubMenuEntry()` inserts `<li id="dzThemeHubMenu">`
immediately after the Settings item inside `#appnavbar li[has-permission='Admin'] > ul` (the
Setup dropdown, admin-only; core hides it from everyone else with zero theme code). `dzInsertHubMenuEntryOther()`
inserts `<li id="dzThemeHubMenuOther">` into `#appnavbar li[has-login-no-admin] > ul` (the
Other dropdown, shown only to a logged-in non-admin). Both anchors carry the identical
`href="#/Theme"` plus `onclick="dzOpenThemeHub()"` markup. With real Angular routes active
(`window.dzRoutesActive`, `dzRegisterThemeRoutes` in `custom.js`), `#/Theme` and `#/Theme/:tab`
are registered routes rendering the hub inside core's own `ng-view`; the `:tab` segment
deep-links straight to a manifest group (e.g. `#/Theme/colors`) via `dzMountThemeHubIn`.
`#/SetupMenu`, the routed settings tile grid, is gated `permission: "Admin"` at the route
table itself, so the admin-only surface stays admin-only even reached by a direct URL, not
only through the hidden menu entry.

**House chip and locked rows.** A per-user row for a house-scope setting renders a
`.dz-hub-chip-house` pill next to its label (`theme-hub.js` `dzRenderHubRow`, only while
`dzSettingsMode().perUser` is true): 11px semibold text (`--dz-text-micro` /
`--dz-weight-semibold`), an accent-colored 1px outline (`border: 1px solid var(--dz-accent-color)`)
rather than the accent-filled `.dz-hub-tag` pill it sits beside, same pill radius
(`var(--dz-btn-radius)`), body-text color (`css/theme-hub.css`). A non-admin session additionally
gets `.dz-hub-row-locked` on the row (`opacity: 0.5`, `.dz-hub-row-locked .dz-hub-control { pointer-events: none; }`)
and its control's native `disabled` attribute set, so a house row is visibly distinct and
provably inert for anyone who cannot write the house layer. The same `.dz-hub-row-locked`
class (hub-wide, every row) is reused by `dzHubApplyNoIdentityLock()` the first time a write
fails `no_identity` (an application-token session with no Users row to attach a personal layer
to), paired with a one-time `.dz-hub-no-identity-note` banner at the top of the About tab.

#### Icon Packs

The icon-pack installer (`src/js/iconpack.js`) lives in the hub's Icon packs group. It browses `iconpack/`, an artifact tree generated by images-machinon's `dz-pack-build.py` and never hand-edited, and lets an admin install, update, or remove icons in the Domoticz `CustomImages` table without leaving the hub. A tabbed layout (Blue UI / Color / Fun) mirrors the hub's own underlined-tab idiom (`css/iconpack.css` `.iconpack-tabs`).

Card grid (`.iconpack-grid`, `auto-fill, minmax(150px, 1fr)`, 140px under 480px):

| Element | Size/Token | Note |
|---------|------------|------|
| Preview | 48x48px | Defaults to the On master; hover shows Off on desktop, tap toggles a sticky Off on touch |
| Name | `{typography.sm}` (14px), `font-weight: 600` | Weight (`--dz-weight-semibold`) on the ambient Inter family, not a separate bold face |
| Description | `{typography.micro}` (11px), 75% opacity | `min-height: 26px` keeps card heights aligned when a description is empty |
| Intro text / search input | `{typography.xs}` (12px) / `{typography.sm}` (14px) | |
| Counter | `{typography.xs}` (12px), 75% opacity | |
| "Installed" chip | `{typography.micro}` (11px) | `var(--dz-status-ok)` background, white text, top-right |

Actions row: `images/add.png` installs; it swaps to `images/machinon/refresh.png` only when the served art or metadata has actually drifted from the pack (a title/description check against `getcustomiconset` first, then FNV-1a content signatures: the manifest carries the shipped On/Off sigs, so only the two served images are fetched per installed icon), never on a hunch. `images/remove.png` warns with the names of any devices currently assigned the icon (looked up via `getdevices`), notes they will revert to their default icon, and is disabled when nothing is installed. State is never bookkept client-side: every action re-derives install status from `getcustomiconset` before the grid repaints, so operations are idempotent and safe to retry.

"Install / update all" acts on the visible set only: with a search filter active it relabels to "Install / update shown (N)" and installs/updates just the shown icons, one upload at a time (chained, not parallel, to avoid SQLite lock contention on the CustomImages table). A busy flag serializes every DB-writing operation, install, update, or remove alike, so a second click mid-upload gets a warning toast instead of a second concurrent write.

## Feature Modules

Toggled via `theme.json` features object. Each feature has an `enabled` boolean and optional `files` array of CSS/JS to load.

| Feature | Key | Default | Files | Effect |
|---------|-----|---------|-------|--------|
| Dark theme | `dark_theme` | off | `dark_theme.css` | Swaps to dark palette via CSS custom properties. Overrides login gradient, bigtext color, camera preview overlay. |
| Compact dashboard | `dashboard_columns` | off | `dashboard_columns.css` | 180px fixed-width tile grid with condensed 3-row card layout. Hides status text. |
| Toggle switches | `switch_instead_of_bigtext` | on | `switch.js`, `switch.css` | Replaces On/Off bigtext with Material-style slider on Light/Switch devices. |
| Scene switches | `switch_instead_of_bigtext_scenes` | on | (none) | Extends toggle switch behavior to scene devices. |
| Navbar icons | `navbar_icons` | off | `navbar_icons.css` | Adds icons above nav link text. |
| Hide nav text | `navbar_icons_text` | off | (none) | Hides nav link labels, icons only. Requires `navbar_icons`. |
| Hide logo | `hide_logo` | off | (none) | Hides the navbar logo image; the header keeps hosting the search box. Custom logo image set separately via `theme.logo`. |
| Sidemenu | `sidemenu` | off | `sidemenu.css` | Vertical side navigation on narrow viewports (max-width: 979px). |
| Hide footer | `footer_text_disabled` | on | `footer.css` | Hides the copyright footer bar. |
| Center popups | `center_popups` | off | `center_popups.css` | Centers jQuery UI dialogs on screen. |
| Dashboard camera | `dashboard_camera` | on | `dashboard_camera.js`, `dashboard_camera.css` | Embeds camera preview on dashboard cards. |
| Show last update | `dashboard_show_last_update` | off | `dashboard_show_last_update.css` | Shows last-update timestamp on dashboard cards. |
| Fade off items | `fade_off_items` | off | (none) | Reduces opacity to 0.5 on "Off" status devices. |
| Time ago | `time_ago` | on | (none) | Converts timestamps to relative format via livestamp.js/moment.js. |
| Standby | `standby` | off | `standby.js`, `standby.css` | Screen dimming after configurable idle timeout. |
| Wind direction | `wind_direction` | on | (none) | Points the wind arrow at where the wind is blowing TO instead of where it comes FROM. Core reports the meteorological origin (it reads met.no's `wind_from_direction` verbatim) and both core's compass art and the theme's default `images/Wind<DIR>.png` point at it; this swaps in `images/wind-direction/Wind<DIR>.png`, the same glyphs with the pointer moved to the opposite side and the compass label left upright. The two sets must never be the same art: see `images-machinon/scripts/glyph_flip.py`. |
| Custom colors | `custom_color_scheme` | off | (none) | Enables user-defined color overrides via settings UI. |
| Custom icons | `icon_image` | off | (none) | Per-device custom icon images from `theme.json` icons array. |
| Check update | `check_update` | on | `check_update.js` | Checks for Domoticz software updates. |
| Custom pages | `custom_page_menu` | on | `custom_page.js` | Adds custom page entries to navigation. |
| Settings menu | `custom_settings_menu` | on | `settings_page.js` | Renders the Setup menu as a tile grid instead of a plain dropdown list; the theme hub itself is always reachable from either. |
| Notifications | `notification` | on | (none) | Warning toasts (noty) when a sensor times out or reports a low battery. |
| Dashboard camera section | `dashboard_camera_section` | on | (none) | Renders the camera preview as its own dashboard section. Requires `dashboard_camera`. |

## Animations

| Animation | Duration | Easing | Trigger |
|-----------|----------|--------|---------|
| Update pulse | 0.8s | ease | Device WebSocket update (if `ShowUpdatedEffect` enabled) |
| Blink | 2s | linear, infinite | `.blink` class (alarm/alert state) |
| Button transitions | 0.15s | ease | Hover/focus on all buttons |
| Switch toggle | 0.4s | default | Slider handle translate on toggle |
| Hamburger to X | 0.2s | ease-in-out | Menu toggle open/close |
| Scroll pill | 1s | ease | Menu toggle background after 50px scroll |
| Tooltip delay | 0s + 0.4s delay | linear | Device name description hover |
| Drop target tint | 0.15s | ease | Background tint on droppable hover |

## Do's

- Use CSS custom properties for all colors; never hardcode hex values outside the token definitions in `dz-tokens.css` and `dark.css`
- Use `--dz-btn-shadow-hover` + `color-mix(in srgb, <bg> 90%, black)` for filled button hover states (see Buttons > States); `filter: brightness(0.85)` is a legacy holdout on `.btn-group` filled variants only, not the pattern for new buttons
- Use the card grid gap (`{spacing.md}`, 15px) for spacing between device cards
- Use Inter regular (`--dz-weight-regular`) for body text and Inter semibold (`--dz-weight-semibold`) for headings and emphasis
- Keep device cards as CSS grid layouts; the `grid-template-areas` pattern is the foundation of the card system
- Use the outlined button style for secondary/toggle actions and filled for primary actions
- Apply `--dz-elev-card` for any new card-like container
- Use the accent ring token (`--dz-ring-accent` at rest, `--dz-ring-hover` composed for card hover/focus) rather than a raw outline value
- Test all changes in both light and dark mode
- Use the current spacing clusters (4/8/10/15/20px) until the 4px grid migration

## Don'ts

- Don't use Bootstrap 2.x gradients (`background-image`) on buttons; they are globally reset to `none`
- Don't use `text-shadow` on interactive elements; it is globally cleared
- Don't add new hardcoded colors; extend the CSS custom property system instead
- Don't use `box-shadow` and `border` together for card containers; the theme uses transparent borders with box-shadow
- Don't set fixed heights on device cards; rows use `minmax()` to accommodate variable content
- Don't use `pt` units; normalize to `px` (every theme font size is a `px`-based `--dz-text-*`/`--dz-icon-size-*` token; core's `10pt` body default is the only remaining `pt` value, and the token contract overrides it)
- Don't introduce spacing values outside the documented clusters until the 4px grid migration
- Don't add `!important` unless overriding upstream Domoticz styles that cannot be beaten by specificity (see Buttons > Bootstrap 2 Constraint for the concrete accounting behind every `!important` in `css/buttons.css`)
- Don't rely on Bootstrap class semantics (`.btn-info` = blue, `.btn-danger` = red); the theme remaps these to its own palette

## Responsive Behavior

### Breakpoints

| Name | Width | Key changes |
|------|-------|-------------|
| Mobile | < 720px | Single column cards. |
| Tablet | 720 - 1059px | 2-column card grid. |
| Desktop | 1060 - 1499px | 3-column card grid. |
| Wide | 1500 - 1899px | 4-column card grid. Dimmer slider narrows to 55%. |
| Ultra-wide | 1900px+ | 5-column card grid. |

These widths are the card grid's column-count ladder only: [Responsive Grid](#responsive-grid)
above explains that the grid is actually container-width-driven (`auto-fill`), and this table
reproduces the former viewport ladder at common widths for reference, not a live breakpoint.
They are not the theme's app-chrome breakpoints: the navbar/hamburger switch and every
mobile-polish layout rule key off 979px, and dialogs/search key off 767px - see
[Mobile Layout](#mobile-layout) and Mobile Adaptations below.

### Mobile Adaptations

- Hamburger menu replaces horizontal navbar (max-width: 979px)
- Search input collapses to icon, expands on focus with blue background pill (max-width: 767px)
- Message toast repositions to left edge
- Settings buttons become fixed bottom bar
- Dialog content tables switch to `table-layout: fixed` with word-wrap (max-width: 767px)
- Edit-form tables (`.table-details`, sub-device picker) stack label above field, inputs full-width (releases core's inline 356px/250px widths and the theme's 250px input cap; < 768px)
- Page-title rows: title owns the flex row (button column content-sized, core split it 50/50); h1 steps `{typography.display}` 26px -> `{typography.md}` 16px
- Settings grid tiles shrink to `100px` with hidden labels
- Compact card button groups become vertical scroll-snap columns
- Devices, Events, and Timers/HVAC form rows wrap with a deliberate gap instead of squashing; Devices and Floorplans additionally stack/contain their layout so the page fits the viewport - see [Mobile Layout](#mobile-layout) for the full breakpoint story, the viewport-fit pages, and the wrap-with-gap pattern

## Source Layout

`custom.css` is a thin base plus an `@import` list. It grew as one large source-ordered file and is
being split into focused feature files, one cohesive block at a time.

| File | Contents |
|------|----------|
| `dz-tokens.css` | Light `:root` `--dz-*` token contract, plus the `html:root` overrides |
| `dark.css` | Dark scheme under `html[data-dz-scheme="dark"]` |
| `css/cards.css` | Device-tile and dashboard system: card box contract, grids, card content, options menu |
| `css/buttons.css` | Buttons and button-styled controls |
| `css/nav.css` | Navbar, brand, dropdowns, sub-tabs |
| `css/dynamic-dashboard.css` | Chrome unique to core's Dynamic Dashboard (`.dd-*`) |
| `css/compact.css` | Compact dashboard mode (`.span3` tiles) |
| `css/tables.css` | DataTables |
| `css/charts.css` | Highcharts |
| `css/login.css` | Login page |
| `css/energy.css`, `css/logpage.css`, `css/setpoint.css`, `css/search.css`, `css/device-status.css`, `css/users.css` | Per-feature blocks |
| `css/dashboard_mobile.css`, `css/settings.css`, `css/floorplan.css`, `css/icons_on_tabs.css`, `css/iconsupload.css`, `css/animate.css` | Imported ahead of the base |
| `css/ionicons.min.css` | Vendored icon font |

Ten further stylesheets (`dark_theme.css`, `switch.css`, `sidemenu.css`, `footer.css`,
`navbar_icons.css`, `center_popups.css`, `standby.css`, `dashboard_camera.css`,
`dashboard_columns.css`, `dashboard_show_last_update.css`) are not imported. They are loaded at
runtime by `loadThemeFeatureFiles()` when their feature flag is on, which appends a `<link>` after
every static stylesheet.

Because `@import` must precede all inline rules, an extracted file loads *before* the rest of
`custom.css`. Only features whose selectors appear nowhere else may be extracted, or the extracted
rules would lose to the rules they now jump over.

**Import depth is one level, by design.** Every `@import` in `custom.css` must point at a leaf
file with no `@import` of its own; a file may never import an aggregator that itself imports
further files. The browser cannot start fetching an `@import`ed file until the file that imports
it has fully downloaded and parsed, so each extra nesting level serializes one more full network
round trip before its children even begin downloading (measured on Fast 3G: the theme's imported
children did not start until ~1019ms, well after `custom.css` itself was requested at ~200ms -
that gap is the round trip; a three-level chain would add a second one on top). This is a
source-only invariant, documented in a comment at the top of `custom.css`: it does not by itself
remove the round trip (the browser still fetches `custom.css`, then its 26 children), it only
stops the cost from compounding. `scripts/build-dist.sh` is what actually removes the request
fan-out for real users: it recursively inlines the whole `@import` chain, depth-first, into
`dist/custom.css` for release artifacts (`dist/` is gitignored, not committed) so a release ships
one flat file while the source stays modular, one `@import` per leaf, easy to find and edit.

## Gaps

Where the code does not yet meet the intent stated above. Each is a debt marker: it names what
would have to change, not a reason to copy the current behaviour.

- `:focus-visible` styles now exist for every button family (see Buttons > States) plus a handful of
  specific spots (card device-icon images, the Setup Apply Settings button, `.modal-footer .btn`), but
  plain nav links (`.navbar .nav li a`) and the Setup dropdown's own menu items still have no visible
  keyboard-focus ring
- No CSS custom properties for shadows outside the button family (card/popup/overlay/drag elevations
  are hardcoded `rgba` values; only the button shadows are tokenized)
- Status glow colors (timeout red, protected blue, low battery yellow) are hardcoded `rgb()` in
  `css/device-status.css`, not mapped to the semantic color system
- `--dz-input-border` and `--dz-status-disabled` share the same value (`{colors.light-border}`) in
  light mode, making borders and disabled controls visually indistinguishable
- Disabled button contrast below WCAG AA: light theme `{colors.light-text-secondary}` on
  `{colors.light-disabled}` is 3.42:1, dark theme `{colors.dark-text-secondary}` on
  `{colors.dark-disabled}` is 2.46:1. WCAG exempts disabled controls, but readability would benefit
  from dedicated disabled text/background tokens. `--dz-status-disabled` is shared with
  `--dz-input-border` (see the gap above), so it cannot be changed in isolation.
- Navbar shadow uses `10px 2px` spread instead of the card tier's `10px 1px`
- `css/login.css` still carries nine hardcoded literals (`#fff`, `#f1f1f1`, `#ccc`, `#1a1a1a`)
  alongside its 22 `--dz-*` usages, so parts of the login page do not follow the dark scheme
- Machinon's device card is designed at ~128px, but core's Dynamic Dashboard cell is fixed at 120px
  (`minH: 2` x `rowHeight: 60`) with no theme hook. That cell size is a constraint; the gap is that
  the card is squeezed to fit rather than designed for it, which costs the outer hover ring and the
  resting drop shadow on that board. Closing it needs either a compact card drawn for 120px, or a
  themeable `minH`/`defaultH` upstream.
- Selector-level segments' wrapped-row vertical junction is ~2px (two adjacent 1px borders), not a
  true 1px hairline like the horizontal seams: no CSS selector exists for "first item in a wrapped
  flex row" to collapse it the way `:first-child` collapses the group's true first button. Visually
  marginal (not visible without zooming past ~3x); see [Selector Levels](#selector-levels).
- Two declared `--dz-btn-*` tokens have no current CSS consumer: `--dz-btn-danger-bg-alpha` and
  `--dz-btn-text-shadow` (the base rule applies a literal `text-shadow: none !important` instead of
  the token). Candidates for removal in a future cleanup pass.
- The legacy `#login #submit` button (old pre-glass-morphism login markup, `css/login.css`) still has
  a raw `border-radius: 5px`. The current login page (`views/login.html`) uses `.btn-modern` instead,
  which is fully on the 10px token; this raw rule only affects the superseded markup kept for older
  Domoticz core versions.

## Iteration Guide

1. Focus on ONE component at a time
2. Reference component names and design tokens directly
3. Always check both light and dark mode after changes
4. Add new button variants following the family roles (filled primary/danger/success/warning, ghost, toggle-selected, icon-quiet, label-as-button, disabled) and 4-size system (xs/sm/md/lg); see Buttons
5. New spacing values must come from the current clusters (4/8/10/15/20px) or the target 4px grid
6. New containers use `{rounded.container}` (6px) and `--dz-elev-card`
7. New interactive elements (nav links, dropdown borders) use `{rounded.interactive}` (5px); new buttons use `{rounded.button}` (10px) via `--dz-btn-radius`, never a raw value
8. Test on mobile (< 720px) and desktop (1060px+) at minimum
9. Check upstream Domoticz source before fixing styling issues
