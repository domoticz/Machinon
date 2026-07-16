---
version: alpha
name: Machinon
description: Clean, card-based Domoticz home automation theme. Dual light/dark color scheme driven by CSS custom properties, responsive grid layout, Open Sans typography, single teal-blue accent color against neutral surfaces. Optional feature modules for compact dashboard, toggle switches, navbar icons, sidemenu, and more.

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
    fontFamily: main-font (Open Sans Regular)
    fontWeight: 400
  bold:
    fontFamily: main-font-bold (Open Sans SemiBold)
    fontWeight: 600
  micro:
    fontSize: 11px
  xs:
    fontSize: 12px
  sm:
    fontSize: 14px
  md:
    fontSize: 16px
  display:
    fontSize: 26px

rounded:
  xs: 2px
  sm: 3px
  interactive: 5px
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
  card: "0 0 10px 1px rgba(0,0,0,0.2)"
  popup: "-2px 2px 20px rgba(0,0,0,0.2)"
  button: "0 2px 4px rgba(0,0,0,0.2)"
  overlay: "0 5px 10px rgba(0,0,0,0.5)"
  drag: "0 8px 24px rgba(0,0,0,0.3)"

components:
  button-filled-primary:
    backgroundColor: "{colors.light-primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.xs}"
    rounded: "{rounded.interactive}"
    padding: "6px 12px"
  button-filled-semantic-success:
    backgroundColor: "{colors.light-success}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.interactive}"
    padding: "6px 12px"
  button-filled-semantic-warning:
    backgroundColor: "{colors.light-warning}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.interactive}"
    padding: "6px 12px"
  button-filled-semantic-danger:
    backgroundColor: "{colors.light-error}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.interactive}"
    padding: "6px 12px"
  button-outlined:
    backgroundColor: "transparent"
    textColor: "{colors.light-text}"
    border: "1px solid {colors.light-primary}"
    rounded: "{rounded.interactive}"
    padding: "6px 12px"
  button-ghost:
    backgroundColor: "rgba({colors.light-primary}, 0.1)"
    textColor: "{colors.light-primary}"
    border: "none"
    rounded: "{rounded.interactive}"
    padding: "4px 8px"
  button-disabled:
    backgroundColor: "{colors.light-disabled}"
    textColor: "{colors.light-text-secondary}"
    rounded: "{rounded.interactive}"
    cursor: "not-allowed"
    # Contrast: 3.42:1 light, 2.46:1 dark (below AA 4.5:1, but WCAG exempts disabled controls)
  device-card:
    backgroundColor: "{colors.light-surface}"
    border: "1.5px solid transparent"
    rounded: "{rounded.container}"
    elevation: "{elevation.card}"
    gap: "{spacing.sm}"
  device-card-hover:
    boxShadow: "{elevation.card}, 0 0 0 2px {colors.light-primary}"
    # On the Dynamic Dashboard the card is full-bleed in a clipped cell, so the ring is
    # drawn inset: "inset 0 0 0 2px {colors.light-primary}"
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
    elevation: "{elevation.card}"
    headerHeight: "35px"
    headerBg: "{colors.light-surface}"
    oddRowBg: "{colors.light-disabled}"
    evenRowBg: "{colors.light-surface}"
    rowBorder: "1px solid {colors.light-border}"
  navbar:
    backgroundColor: "{colors.light-navbar}"
    elevation: "0 0 10px 2px rgba(0,0,0,0.2)"
    linkFont: "{typography.bold}"
    linkSize: "{typography.sm}"
    activeBg: "rgba({colors.light-primary}, 0.4)"
    activeBorder: "1px solid {colors.light-primary}"
  dropdown-menu:
    backgroundColor: "{colors.light-bg}"
    rounded: "{rounded.container}"
    elevation: "{elevation.overlay}"
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
- Two font weights only: Open Sans Regular (body) and SemiBold (headings/emphasis)
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
> Built-in schemes (`schemes/*.json`, picker in the Theme tab rendered by `src/js/schemes.js`)
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
> Machinon publishes the `--dz-*` token names that Domoticz core's globally-linked stylesheets
> (`css/dashboard.css`, `css/style.css`) consume. It deliberately does not import core's
> `legacy.css`, so any token core reads must be defined here.

### CSS Custom Property Mapping

| Token | Light | Dark | Role |
|-------|-------|------|------|
| `--dz-body-bg` | `{colors.light-bg}` | `{colors.dark-bg}` | Page background |
| `--dz-accent-color` | `{colors.light-primary}` | `{colors.dark-primary}` | Accent/primary; CTAs, active states, links, sliders |
| `--dz-nav-bg` | `{colors.light-navbar}` | `{colors.dark-navbar}` | Top navigation bar |
| `--dz-widget-bg` | `{colors.light-surface}` | `{colors.dark-surface}` | Card/panel surfaces |
| `--dz-body-text` | `{colors.light-text}` | `{colors.dark-text}` | Primary text |
| `--secondary-text-color` | `{colors.light-text-secondary}` | `{colors.dark-text-secondary}` | Captions, timestamps, labels |
| `--dz-input-border` | `{colors.light-border}` | `{colors.dark-border}` | Table/row/input borders |
| `--dz-status-disabled` | `{colors.light-disabled}` | `{colors.dark-disabled}` | Disabled controls, odd table rows |
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

- **main-font**: Open Sans Regular (weight 400). Self-hosted woff2/woff. Used for body text, UI controls, secondary labels, timestamps.
- **main-font-bold**: Open Sans SemiBold (weight 600). Self-hosted woff2/woff. Used for headings (`h1`-`h4`), nav links, device names, status text, form labels.

### Size Scale

| Token | Size | Usage |
|-------|------|-------|
| `{typography.micro}` | 11px | Extra-small buttons (`.btn-mini`, `.btn-xs`), chart zoom buttons |
| `{typography.xs}` | 12px | Standard buttons (`.btn-primary`, `.btn-info`), chart menu items, `.btn-link` |
| `{typography.sm}` | 14px | Navbar links, options menu items, `.btn-modern`, settings dropdowns |
| `{typography.md}` | 16px | Base body text, settings panel text |
| `{typography.display}` | 26px | Login page heading |
| page title (h1) | 24px (core) / `{typography.md}` mobile | `General:`/`Log:` page headers; stepped down to 16px under 768px (custom.css); core owns the desktop 24px |

### Device Card Typography (relative units)

| Element | Size | Font | Color |
|---------|------|------|-------|
| Name | inherited | `main-font-bold` | `--dz-body-text` |
| Bigtext (value) | `1.4em` | `main-font` | `--dz-accent-color` |
| Status | inherited | `main-font-bold` | `--dz-body-text` |
| Last update | `80%` | `main-font` | `--secondary-text-color` |
| Name icon | `110%` | inherited | inherited |
| Compact bigtext | `1.3em` | `main-font-bold` | `--dz-accent-color` |
| Compact last update | `0.72em` | inherited | `--secondary-text-color` |

## Spacing

### Current Clusters (legacy)

| Token | Value | Usage |
|-------|-------|-------|
| `{spacing.xxs}` | 4px | Button group gaps, timer mode margins, checkbox `margin-right` |
| `{spacing.xs}` | 8px | Popup padding, control padding, button internal padding, dialog button gap |
| `{spacing.sm}` | 10px | Container padding, table cell padding, card name padding, card grid gap (as 15px) |
| `{spacing.md}` | 15px | Card grid gap, form list margins, settings list item margins |
| `{spacing.lg}` | 20px | Section spacing, large button padding, settings panel padding |

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

Both are user-configurable (Theme settings > Devices > Card Min/Max Width, clamped 200-800 /
250-1200 by `applyCardWidths()`). The 320px default reproduces the former viewport-breakpoint
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
| `{rounded.interactive}` | 5px | All buttons, nav links, input select borders, login submit |
| `{rounded.container}` | 6px | Device cards, DataTables, dropdown menus, popups, dialogs, log console, settings panels |
| `{rounded.circle}` | 50% | Radio buttons, slider handle, user avatars |

## Elevation

| Level | Name | Shadow | Usage |
|-------|------|--------|-------|
| 0 | flat | none | Default state, transparent backgrounds |
| 1 | card | `{elevation.card}` | Device cards, DataTables, log console, page-content containers |
| 2 | popup | `{elevation.popup}` | Options popup, message toast, setpoint popup |
| 3 | button | `{elevation.button}` | Login submit, `.btn-modern` |
| 4 | overlay | `{elevation.overlay}` | Dropdown menus |
| 5 | drag | `{elevation.drag}` | Drag ghost during card reorder |

### Interactive States

- **Card hover**: keeps the card shadow and adds an accent ring:
  `0 0 10px 1px rgba(0,0,0,0.2), 0 0 0 2px var(--dz-accent-color)`. `box-shadow` is a single
  property, so a hover rule that lists only the ring deletes the resting shadow.
- **Card hover (Dynamic Dashboard)**: `inset 0 0 0 2px var(--dz-accent-color)`. The card is
  full-bleed inside a cell that core wraps in five nested `overflow: hidden` ancestors, so an
  outer ring cannot show there.
- **Update pulse**: keyframe animation that flashes the blue outline ring over 0.8s
- **Drag target (active)**: `2px dashed rgba(blue, 0.3)` outline, `3px` offset
- **Drag target (hover)**: `2px solid blue` outline, `3px` offset, `rgba(blue, 0.08)` background tint, `0.15s ease` transition

## Components

### Buttons

**Hierarchy (4 visual tiers):**

| Tier | Background | Text | Border | Usage |
|------|-----------|------|--------|-------|
| **Filled primary** | `var(--dz-accent-color)` | `{colors.on-primary}` | none | Primary actions, save, active toggles |
| **Filled semantic** | respective semantic color | `{colors.on-primary}` | none | Success, warning, destructive actions |
| **Outlined** | transparent | `var(--dz-body-text)` | `1px solid var(--dz-accent-color)` | Secondary actions, filters, zoom buttons |
| **Ghost** | transparent or `rgba(blue, 0.1)` | `var(--dz-accent-color)` | none | Tertiary actions, icon buttons, inline links |

**Size tiers:**

| Size | Padding | Font size | Classes |
|------|---------|-----------|---------|
| `xs` | `2px 8px` | `{typography.micro}` | `.btn-mini`, `.zoom-button` |
| `sm` | `4px 8px` | `{typography.micro}` | `.btn-small`, `.btnsmall`, `.btn-icon`, `.btn-xs` |
| `md` | `6px 12px` | `{typography.xs}` | `.btnstyle3`, `.btn-primary`, `.btn-info`, `.btn-warning`, `.btn-danger` |
| `lg` | `10px 20px` | `{typography.sm}` | `.savebtn`, `.resetbtn`, `.btn-modern`, `.btn-large` |

**States:**
- Hover (filled): `filter: brightness(0.85)`
- Hover (outlined): fill with `var(--dz-accent-color)`, text switches to `{colors.on-primary}`
- Hover (ghost `.btnsmall`): tint deepens to `rgba(blue, 0.2)`
- Disabled: `background: var(--dz-status-disabled)`, `color: var(--secondary-text-color)`, `cursor: not-allowed`, `pointer-events: none`
- Transition: `background 0.15s ease, color 0.15s ease, border-color 0.15s ease, filter 0.15s ease`

### Button Groups

**In device cards**: flex row wrap with `3px` gap, each button gets `{rounded.interactive}` (pill-with-gap style).

**In toolbars/dialogs**: connected segments. First child: `5px 0 0 5px` radius. Last child: `0 5px 5px 0` radius. Middle children: `0` radius. `1px solid blue` border, `-1px` left margin to collapse borders.

### Device Cards

Cards are `<table>` rows styled as CSS grid containers. The card surface uses `{colors.light-surface}` background, `1.5px solid transparent` border, `{rounded.container}` radius, and `{elevation.card}` shadow.

**Standard card (`.span4`):**
```
grid-template-areas:
  'name    name    name    bigtext bigtext options'
  'img     img2    status  status  status  status'
  'favorite lastupdate ... lastupdate tools tools'

Rows: auto | minmax(58px, 1fr) | minmax(0, 20px)
Columns: 48px 18px minmax(0,1fr) minmax(0,auto) minmax(0,auto) 15px
Gap: 10px
```

**Dashboard card**: hides third row (`grid-template-rows: 40px minmax(58px,1fr) 0`, `overflow: hidden`).

**Compact card (`.span3`):**
```
grid-template-areas:
  'name       name    name'
  'img        img2    bigtext'
  'lastupdate lastupdate lastupdate'

Rows: 28px 50px 12px
Columns: 58px 5px 1fr
Gap: 2px
Fixed tile width: 180px
```

**Double/triple icon variants**: wider icon columns (48px + 48px for double, adds `img3` area for triple).

**Card icon boxes are pinned**: `#img img` and `#img1 img` (the scene widget's active icon) render in a fixed `40x40` box with `object-fit: contain`, so 96px masters (2x art) stay crisp and never resize the row. An unpinned `#img1` used to render scene icons at intrinsic size (caught by the icon facts engine's slot-mismatch check).

**Bar-ranges gauge**: core renders its `<dz-bar>` threshold gauge inside the last-update cell;
the theme repositions it as a 4px full-bleed status edge along the card top (top corners follow
the card radius). Core's inline placement would overflow the 20px bottom row. Track color comes
from `--dz-bar-track-bg` (0.2 neutral grey, both schemes). Applies to classic pages and the
standard dashboard; on the Dynamic Dashboard the gauge stays hidden with its host cell.

**Dynamic Dashboard card** (Constraint): the same card, mounted in a GridStack cell. Core sets
`defaultH: 2` and `minH: 2` (`ddDzDevice.widget.js`) against a `rowHeight` of 60
(`ddGrid.directive.js`), so the cell is always at least 120px and there is no theme hook for
either. Measured natural card heights are
116px (switch), 118px (dimmer, blinds) and 120px (selector), so the tallest card needs the whole
cell. Consequences:

- The row gap is tightened to `4px` (from `{spacing.sm}`); at the classic gap the card is ~128px.
- The card keeps its natural height. Forcing `height: 100%` compresses its grid rows and squeezes
  the switch pill and icons.
- No padding may be reserved around the card, which is why the hover ring is inset.
- Core clips every cell of the card (`dashboard.css`: `.dd-dz-inner table[id^="itemtable"] td
  { overflow: hidden }`), so an icon that overhangs its `td` is shaved here though it is visible on
  the classic dashboard. Not fixable from the theme.

### Form Inputs

- **Text/number/password**: transparent background, bottom-border only (`1px solid var(--dz-accent-color)`), secondary text color, max-width 250px
- **Checkbox**: custom-drawn, 14x14px, `{rounded.xs}` radius, `1px solid blue` border, 8x8px blue inner fill when checked
- **Radio**: same as checkbox but `{rounded.circle}` on both outer and inner
- **Textarea**: `{rounded.xs}` radius, `1px solid blue` border, full width
- **Select (jQuery UI)**: bottom-border only, blue text, `main-font-bold`

### Toggle Switch (feature: `switch_instead_of_bigtext`)

Material-style slider. Track: 40x15px, `{rounded.container}` radius. Handle: 20x20px circle.

| State | Track | Handle | Handle shadow |
|-------|-------|--------|--------------|
| Off | `rgba(blue, 0.2)` | `var(--secondary-text-color)` | `0 2px 3px rgba(0,0,0,0.7)` |
| On | `rgba(blue, 0.5)` | `var(--dz-accent-color)` | same |

Handle translates `34px` right on toggle, `0.4s` transition.

### Navigation

**Top navbar**: `var(--dz-nav-bg)` background with `0 0 10px 2px rgba(0,0,0,0.2)` shadow. Links distributed via `display: flex; justify-content: space-around`. Link style: `main-font-bold`, `{typography.sm}`, `var(--dz-body-text)`, `{rounded.interactive}` radius.

- **Active page**: `rgba(blue, 0.4)` background, `1px solid blue` border
- **Dropdown hover**: `rgba(blue, 0.15)` background
- **Dropdown menu**: `var(--dz-body-bg)` background, `{rounded.container}` radius, `{elevation.overlay}` shadow

**Sub-tabs / Nav-tabs**: underline style. Inactive: transparent bottom border. Active/hover: `2px solid var(--dz-accent-color)` bottom border, blue text color. No background change.

**Mobile hamburger** (max-width: 979px): fixed-position 25x25px toggle. Three 4px bars animate to X via `rotate(135deg)` / `rotate(-135deg)` transforms, `0.2s ease-in-out`. Gets blue background pill with `{rounded.container}` bottom corners after 50px scroll.

### Data Tables

Wrapped in a container with `{elevation.card}` shadow and `{rounded.container}` radius.

| Element | Style |
|---------|-------|
| Header | `var(--dz-widget-bg)` background, 35px height, no border |
| Odd rows | `var(--dz-status-disabled)` background |
| Even rows | `var(--dz-widget-bg)` background |
| Row border | `1px solid var(--dz-input-border)` |
| Selected row | `var(--dz-accent-color)` background, 75% opacity |
| Filter/info text | `var(--secondary-text-color)` |
| Bottom margin | 10px |

### Charts (Highcharts)

| Element | Style |
|---------|-------|
| Background | `var(--dz-widget-bg)` |
| Text (titles, labels, legends) | `var(--secondary-text-color)`, `main-font` |
| Tooltip box | `var(--dz-body-bg)` fill, 60% opacity, no stroke |
| Grid lines | `var(--dz-body-bg)` |
| Export button | card surface, `4px` radius, blue icon stroke |
| Export menu | card surface, `{rounded.container}` radius, `{elevation.card}` shadow |
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

### Icon Pack Browser

An "Icons" tab sits beside "Theme" on Setup > Settings, injected unconditionally by `iconpack.js` alongside the Theme tab (not a `theme.json` feature toggle). It browses `iconpack/`, an artifact tree generated by images-machinon's `dz-pack-build.py` and never hand-edited, and lets an admin install, update, or remove icons in the Domoticz `CustomImages` table without leaving the browser.

Card grid (`.iconpack-grid`, `auto-fill, minmax(150px, 1fr)`, 140px under 480px):

| Element | Size/Token | Note |
|---------|------------|------|
| Preview | 48x48px | Defaults to the On master; hover shows Off on desktop, tap toggles a sticky Off on touch |
| Name | `{typography.sm}` (14px), `main-font-bold` | |
| Description | `{typography.micro}` (11px), 75% opacity | `min-height: 26px` keeps card heights aligned when a description is empty |
| Intro text / search input | `{typography.xs}` (12px) / `{typography.sm}` (14px) | |
| Counter / "Installed" chip | `{typography.micro}` (11px) | Chip: `var(--dz-status-ok)` background, white text, top-right |

Actions row: `images/add.png` installs; it swaps to `images/machinon/refresh.png` only when the served art or metadata has actually drifted from the pack (byte-compare of the On and Off 48px previews, plus a title/description check against `getcustomiconset`), never on a hunch. `images/remove.png` warns with the names of any devices currently assigned the icon (looked up via `getdevices`), notes they will revert to their default icon, and is disabled when nothing is installed. State is never bookkept client-side: every action re-derives install status from `getcustomiconset` before the grid repaints, so operations are idempotent and safe to retry.

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
| Wind direction | `wind_direction` | on | (none) | Custom wind direction arrow icons on weather devices. |
| Custom colors | `custom_color_scheme` | off | (none) | Enables user-defined color overrides via settings UI. |
| Custom icons | `icon_image` | off | (none) | Per-device custom icon images from `theme.json` icons array. |
| Check update | `check_update` | on | `check_update.js` | Checks for Domoticz software updates. |
| Custom pages | `custom_page_menu` | on | `custom_page.js` | Adds custom page entries to navigation. |
| Settings menu | `custom_settings_menu` | on | `settings_page.js` | Theme settings panel in Domoticz settings. |
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
- Use `filter: brightness(0.85)` for filled button hover states; it works across both light and dark themes
- Use the card grid gap (`{spacing.md}`, 15px) for spacing between device cards
- Use `main-font` for body text and `main-font-bold` for headings and emphasis
- Keep device cards as CSS grid layouts; the `grid-template-areas` pattern is the foundation of the card system
- Use the outlined button style for secondary/toggle actions and filled for primary actions
- Apply `{elevation.card}` for any new card-like container
- Use the blue outline ring (`0 0 0 2px var(--dz-accent-color)`) for card hover/focus states
- Test all changes in both light and dark mode
- Use the current spacing clusters (4/8/10/15/20px) until the 4px grid migration

## Don'ts

- Don't use Bootstrap 2.x gradients (`background-image`) on buttons; they are globally reset to `none`
- Don't use `text-shadow` on interactive elements; it is globally cleared
- Don't add new hardcoded colors; extend the CSS custom property system instead
- Don't use `box-shadow` and `border` together for card containers; the theme uses transparent borders with box-shadow
- Don't set fixed heights on device cards; rows use `minmax()` to accommodate variable content
- Don't use `pt` units; normalize to `px` (the `11pt` on navbar links is legacy debt)
- Don't introduce spacing values outside the documented clusters until the 4px grid migration
- Don't add `!important` unless overriding upstream Domoticz styles that cannot be beaten by specificity
- Don't rely on Bootstrap class semantics (`.btn-info` = blue, `.btn-danger` = red); the theme remaps these to its own palette

## Responsive Behavior

### Breakpoints

| Name | Width | Key changes |
|------|-------|-------------|
| Mobile | < 720px | Single column cards. Hamburger menu. Search expands full-width on focus. Dialog tables fixed-layout. |
| Tablet | 720 - 1059px | 2-column card grid. |
| Desktop | 1060 - 1499px | 3-column card grid. Navbar fully visible. |
| Wide | 1500 - 1899px | 4-column card grid. Dimmer slider narrows to 55%. |
| Ultra-wide | 1900px+ | 5-column card grid. |

### Mobile Adaptations

- Hamburger menu replaces horizontal navbar (max-width: 979px)
- Search input collapses to icon, expands on focus with blue background pill
- Message toast repositions to left edge
- Settings buttons become fixed bottom bar
- Dialog content tables switch to `table-layout: fixed` with word-wrap
- Edit-form tables (`.table-details`, sub-device picker) stack label above field, inputs full-width (releases core's inline 356px/250px widths and the theme's 250px input cap; < 768px)
- Page-title rows: title owns the flex row (button column content-sized, core split it 50/50); h1 steps 24px -> `{typography.md}` 16px
- Settings grid tiles shrink to `100px` with hidden labels
- Compact card button groups become vertical scroll-snap columns

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

## Gaps

Where the code does not yet meet the intent stated above. Each is a debt marker: it names what
would have to change, not a reason to copy the current behaviour.

- No formal `:focus-visible` styles for keyboard navigation / accessibility
- No CSS custom properties for shadows (hardcoded `rgba` values)
- No typography scale as CSS custom properties
- Status glow colors (timeout red, protected blue, low battery yellow) are hardcoded `rgb()` in
  `css/device-status.css`, not mapped to the semantic color system
- `--dz-input-border` and `--dz-status-disabled` share the same value (`{colors.light-border}`) in
  light mode, making borders and disabled controls visually indistinguishable
- Disabled button contrast below WCAG AA: light theme `{colors.light-text-secondary}` on
  `{colors.light-disabled}` is 3.42:1, dark theme `{colors.dark-text-secondary}` on
  `{colors.dark-disabled}` is 2.46:1. WCAG exempts disabled controls, but readability would benefit
  from dedicated disabled text/background tokens. `--dz-status-disabled` is shared with odd table
  rows and input borders, so it cannot be changed in isolation.
- Navbar shadow uses `10px 2px` spread instead of the card tier's `10px 1px`
- `css/login.css` still carries nine hardcoded literals (`#fff`, `#f1f1f1`, `#ccc`, `#1a1a1a`)
  alongside its 22 `--dz-*` usages, so parts of the login page do not follow the dark scheme
- Machinon's device card is designed at ~128px, but core's Dynamic Dashboard cell is fixed at 120px
  (`minH: 2` x `rowHeight: 60`) with no theme hook. That cell size is a constraint; the gap is that
  the card is squeezed to fit rather than designed for it, which costs the outer hover ring and the
  resting drop shadow on that board. Closing it needs either a compact card drawn for 120px, or a
  themeable `minH`/`defaultH` upstream.

## Iteration Guide

1. Focus on ONE component at a time
2. Reference component names and design tokens directly
3. Always check both light and dark mode after changes
4. Add new button variants following the 4-tier hierarchy (filled/semantic/outlined/ghost) and 4-size system (xs/sm/md/lg)
5. New spacing values must come from the current clusters (4/8/10/15/20px) or the target 4px grid
6. New containers use `{rounded.container}` (6px) and `{elevation.card}`
7. New interactive elements use `{rounded.interactive}` (5px)
8. Test on mobile (< 720px) and desktop (1060px+) at minimum
9. Check upstream Domoticz source before fixing styling issues
