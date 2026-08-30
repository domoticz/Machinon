---
version: alpha
name: Machinon
description: Clean, card-based Domoticz home automation theme. Dual light/dark color scheme driven by CSS custom properties, responsive grid layout, Inter typography, single slate-blue accent color against cool neutral surfaces. Optional feature modules for compact dashboard, toggle switches, navbar icons, sidemenu, and more.

colors:
  # Light theme (Blue UI)
  light-bg: "#F4F8FC"
  light-primary: "#396D9E"
  light-navbar: "#E9F2FB"
  light-surface: "#FFFFFF"
  light-text: "#1B2B3A"
  light-text-secondary: "#3E5568"
  light-border: "#CBD9E6"
  light-disabled: "#8CA0B3"
  light-error: "#992F2B"
  light-success: "#306B30"
  light-warning: "#7A5412"

  # Dark theme (Blue UI Dark)
  dark-bg: "#0F1620"
  dark-primary: "#98CCFD"
  dark-navbar: "#0A0F16"
  dark-surface: "#18202B"
  dark-text: "#DCE6F0"
  dark-text-secondary: "#9DB2C6"
  dark-border: "#2A3644"
  dark-disabled: "#5E7183"
  dark-error: "#FA5D57"
  dark-success: "#73D173"
  dark-warning: "#F2B03D"

  # Fixed (both themes)
  on-primary: "#FFFFFF"
  label-important: "#B94A48"
  gradient-start: "#0BCDC7"
  gradient-dark-start: "#103C68"
  # No sun-icon entry: the sunrise/sunset sun is not one fixed value for both
  # themes. It is scheme-aware (--dz-sun-color): #8C730E light, #FAD232 dark.
  # See Colors > Special-Cased Colors below.

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
    fontSize: 20px
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
  # Buttons: soft-elevated language. Every filled/ghost/toggle/
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
    # Declared-only: no live instance in the current markup.
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
    # Resting state is transparent + bordered; the accent tint above only
    # appears on hover.
  button-icon-quiet:
    backgroundColor: "transparent"
    textColor: "inherit"
    border: "none"
    rounded: "{rounded.button}"
    padding: "4px 8px"
    hitBox: "28px min-width/min-height"
    # Icon-only controls (Devices row actions, scheme-picker icons): no
    # resting border or shadow; hover is a tonal glyph filter, not a
    # background wash. The Devices panel splitter is not on this tier:
    # see Core-Region Takeover below.
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
    # Contrast: 2.88:1 light, 2.31:1 dark (below AA 4.5:1, but WCAG exempts disabled controls)
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
    selectedRowBg: "derived: rgba({colors.light-primary}, 0.18)"
    selectedRowBorder: "{colors.light-primary}"
    hoverRowBg: "derived: rgba({colors.light-primary}, 0.08)"
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

Machinon is a clean, card-based theme for the Domoticz home automation dashboard. It replaces Domoticz's default Bootstrap 2.x UI with a modern CSS grid layout, CSS custom properties for theming, and a dual light/dark color scheme. The design centers on a single slate-blue accent color, matched to the theme's Blue UI icon set, against cool neutral surfaces, with device cards displayed in a responsive grid. The theme supports optional feature modules (compact dashboard, toggle switches, navbar icons, sidemenu, and more), all toggled via a settings UI stored in `theme.json`.

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

### Comments

Code comments and this document describe the current design only: live constraints
the code cannot show (why a rule exists, what breaks without it, upstream quirks,
load order, specificity). They never carry provenance: no dates, no decision or
report attributions, no fix history, no task numbers, no what-was-tried. Git
history holds all of that. Pointers may only target files that ship in this repo or in Domoticz
core; never working documents that do not ship.

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
> `theme.scheme_base`. A dark scheme is less exposed to that underlay than it might appear:
> `applyCustomColorScheme` (`src/js/scheme.js`) sets `--dz-widget-bg` and `--dz-body-text`
> inline from the scheme's own `item` and `main_text` keys, and the table-stripe tokens derive
> from those two, so all four gated rails are scheme-owned. What actually falls through to
> `dark.css` is only what no scheme key sets at all: shadows, elevation, glows and the dd grid
> line.
> Every shipped scheme must hold body text vs body background at WCAG AA 4.5:1 or better,
> and text-on-accent (`--dz-accent-text`, the token every "text on an accent surface" rule
> consumes; scheme key `accent_text`) at 3:1 or better.
> The two base cards' hardcoded preview swatches must match the computed tokens.
> Adding a scheme = one JSON file + an `index.json` entry. The shipped set is deliberately
> small: four families, each a light and dark pair. Machinon Light
> and Machinon Dark are the token defaults themselves and carry no JSON; Magenta, Paper and
> Gruvbox are the three JSON families, and Magenta is the base's hue opposite. Retired slugs
> are migrated by `DZ_SCHEME_MIGRATIONS` in `src/js/schemes.js`: most map to their old base so a
> user's light/dark intent survives a deletion, and the one exception (`e-ink` -> `paper-light`)
> is a rename onto its direct successor rather than a base fallback, which still preserves the
> same intent. A surviving slug must never appear in that map.
> The swatch order is `Background, Menu, Item, Main, Text, Secondary Text, Disabled`, grouped
> as surfaces from page to card, then the accent, then text, then state. One list in
> `src/js/schemes.js` drives both the card previews and the custom-colour editor.
>
> Deliberately NOT tokenized: the login page and the offline splash (fixed brand surfaces),
> Blockly's canvas, and the legacy dark_theme.css gradient. Everything else colour-bearing flows
> through tokens, including text on the semantic colours: red/success/warning buttons consume
> `--dz-btn-primary-text` (`var(--dz-accent-text)`), which is white in light but `dark.css`
> overrides `--dz-accent-text` for dark, since Blue UI Dark's accent is pale enough that white text
> would fail contrast there;
> the device status glows use the `--dz-status-*-values` r,g,b triplets, and the
> sunrise/sunset sun is `--dz-sun-color`, which differs by scheme like the other semantic colours
> (scheme colors key `sun` overrides it the same way).
>
> **Token definitions must DERIVE, never copy.** A token whose definition is a literal copy of
> another token's value stops tracking schemes and rots silently. Write `var(--dz-widget-bg)` /
> `rgba(var(--dz-accent-values), a)` / `color-mix(...)`, or document WHY a value is fixed.
> Derived-by-mix examples: table odd stripe (8% body-text into widget-bg), dd skeleton.
> Selected table rows use a soft accent tint fill with an accent left-border marking the
> selection, and keep body text (not on-accent text), so in-row accent controls stay legible
> against the tint. Row hover uses a lighter accent tint of its own, distinct from selection.
>
> Scheme picks persist to the Domoticz user variables immediately (persistSchemeChoice);
> user presets and hand-picked customs are contrast-checked at save time
> (schemeContrastFailures: body/secondary 4.5, on-accent 3.0) with a warning, never silently.
>
> **Settings persistence** runs through a transport seam (`src/js/settings-transport.js`),
> layered on Domoticz core's native `ThemeSettings` API where the core reports
> `ThemeSettingsAPI: 1`: a shared instance (house) layer and a per-user layer, split by a
> `"user"`/`"house"` scope carried on every settings-manifest entry. A core without the native
> API falls back to the original theme user variables, and a one-time migration seeds the
> native instance layer from them; the variable names, merge shape, and legacy field positions
> live in `src/js/settings-transport.js`. See [Settings storage](#theme-hub) under Theme Hub
> for the two-layer model, the scope rule, and the reachability/UI contract.
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
| `--dz-accent-values` | `57,109,158` | `152,204,253` | Raw RGB for `rgba()` usage |
| `--dz-accent-red-values` | `153,47,43` | `250,93,87` | Raw RGB for `rgba()` usage |
| `--dz-status-danger` | alias of `--dz-accent-red` | (follows) | Status fills: danger tier (battery empty bar) |
| `--dz-status-warn` | alias of `--dz-btn-warning-bg` | (follows) | Status fills: warning tier (battery half bar) |
| `--dz-status-ok` | alias of `--dz-btn-success-bg` | (follows) | Status fills: healthy tier (battery base/full bar) |

Derived tokens (`--dz-panel-bg`, `--dz-border-color`, `--dz-table-*`, `--dz-btn-*`, `--dz-input-*`,
`--dz-modal-*`, and the rest of core's `--dz-widget-*` contract from `css/variables.css` -
`--dz-widget-shadow` (= `--dz-elev-card`), `--dz-widget-name-*`, `--dz-widget-hover-name-*`,
`--dz-widget-status-text`, `--dz-btn-danger-bg-alpha`) reference the rows above rather than
restating colors. The `--dz-widget-*` set matters beyond this page: core imports nothing here, so
whatever reads the full contract (core `dashboard.css`'s `.dd-widget`, theme-aware external UIs)
falls back to its own defaults unless Machinon defines them. `--dz-widget-accent`,
`--dz-accent-red`, `--dz-widget-amber`, `--dz-widget-energy-export`, `--dz-widget-energy-gas`,
`--dz-widget-energy-water` and `--dz-widget-energy-price` are additionally set in an `html:root`
block, whose `(0,1,1)` specificity beats core's later-loaded `:root`.

### Special-Cased Colors

Not part of the main token mapping table above. Some of these are genuinely fixed across every
scheme (Label important, Header gradient); others vary by scheme through their own token rather
than the shared mapping table, so "theme-independent" no longer describes the whole group.

- **On primary** (`{colors.on-primary}`): white text on filled buttons and accent backgrounds - the light value only. Varies by scheme: the real token is `--dz-accent-text`, which `dark.css` overrides because Blue UI Dark's accent is pale (schemes set it via the `accent_text` key; see Colors above)
- **Sun and moon icons** (`--dz-sun-color`, `--dz-moon-color`): see Semantic identity colours below, which covers both alongside the five energy tokens
- **Label important** (`{colors.label-important}`): `#b94a48` for critical badges - a deliberate literal, no `--dz-*` token (matched by `scripts/check-tokens.sh` against its `custom.css` declaration instead)
- **Header gradient**: `{colors.gradient-start}` to `{colors.light-primary}` (light), `{colors.gradient-dark-start}` to `#0073a7` (dark) - the dark end-stop is a deliberate literal, no token (part of the legacy `dark_theme.css` gradient called out as not tokenized above)

### Semantic identity colours

`--dz-widget-amber`, `--dz-widget-energy-export`, `--dz-widget-energy-gas`,
`--dz-widget-energy-water`, `--dz-widget-energy-price`, `--dz-sun-color` and
`--dz-moon-color` name what a thing IS, not what the user picked: gas is orange
because gas is orange. Five of the names are core's own
(`www/css/dashboard.css` reads them for the Dynamic Dashboard), so defining
them here is what makes core's icons follow the theme. The sun and moon pair
are the theme's own: core hardcodes those two icons rather than tokenising
them, so `css/dynamic-dashboard.css` overrides them by rule instead.

They are defined once per scheme BASE, in `dz-tokens.css` for light and
`dark.css` for dark, and NOT as scheme keys or colour-picker swatches. The hue
is a theme constant; only the lightness has to differ between a white card and
a near-black one. Every scheme, including a custom one or a saved preset,
resolves them through the `data-dz-scheme` underlay that already governs every
token a scheme does not set.

A scheme overrides one only when its own identity demands it. Today that is
Paper alone, which is deliberately monochrome and carries the whole family at
38% of the base saturation.

Floor is WCAG SC 1.4.11's 3:1 for non-text, measured against each scheme's own
card colour; the shipped values target 3.2:1 so none sits on the line. Check
with `scripts/measure-icon-contrast.py --check` and
`dz-glyph-audit.js --scheme all` on the test rig.

### Status Glow Colors (hardcoded, not yet mapped to custom properties)

| Status | Glow color | Card opacity |
|--------|-----------|-------------|
| Timeout | `rgb(199,67,67)` | 0.5 |
| Protected | `rgb(0,0,139)` | 1.0 |
| Low Battery | `rgb(255,255,0)` | 1.0 |
| Off (fade) | default card shadow | 0.5 |

### Theme Wizard: Generated Scheme Pairs

The "Create a theme" wizard (`src/js/theme-wizard.js`, dialog documented under
[Theme Wizard](#theme-wizard) in Components) generates a matching light+dark pair from one or
two seed colours through a pure, DOM-free computer: `src/js/scheme-generator.js`. This section
is the contract that computer must keep; the dialog only collects the seed and a look, then
calls `dzGenerateSchemePair(seed)` and saves the result exactly like a hand-picked custom scheme
(same `dzSaveGeneratedPair` path as [Scheme pairing](#scheme-pairing) below).

**Three looks, five axes.** `DZ_LOOKS` (`crisp`/`soft`/`deep`, `DZ_LOOK_ORDER`) differ
STRUCTURALLY, not just in how much hue is mixed into the greys. Grey tint alone was tried first
and measured as nearly invisible in light mode: with only chroma (`nC`) varying, `item` came out
BYTE-IDENTICAL across every look (all three used pure white cards) and `background` differed by
only dE 0.009-0.024. Each look therefore also owns:

1. **Grey tint** (`nC`) - the OKLCH chroma carried into every neutral (navbar/background/item/
   border/disabled), tinted by the second seed's hue if one is given.
2. **Page-to-card lightness gap** - the `light`/`dark` `[navbar, background, item]` lightness
   tuples: Crisp keeps cards close to white with a visible page tint; Deep spreads them wide so
   cards float.
3. **Border treatment** - Crisp is the only `hardBorder` look: it SOLVES a real edge against the
   background at a target ratio (`borderRatio`, contrast-solved via `dzSolveLightness`). Soft and
   Deep instead offset a fixed perceptual distance from the background (`borderOffset`, no ratio
   target) - a whisper, not a line. This is most of what makes Crisp read as its own thing rather
   than a slightly greyer Soft.
4. **Body-text and accent contrast floors** (`body`, `alt`, `acc` below) - higher in Crisp, eased
   in Soft/Deep.
5. **Dark-page depth** (`danchor`, the dark `[navbar, background, item]` tuple) - how far into
   black the dark variant's page sits.

**A fourth look, "High Contrast", was specified and cut.** At stricter ratios only (varying axis
4 alone, holding 1-3 and 5 fixed), it measured within OKLab dE 0.031 of Crisp - a near-duplicate.
Text is placed at a lightness ANCHOR and its contrast ratio is enforced as a FLOOR, not a target
(solving text down to exactly its ratio produced washed-out mid-greys, e.g. `#585352` on
near-white, where the shipping schemes sit at 10.7-13.6:1); anchors already sit near the extremes,
so raising a floor from 7 to 10 binds on nothing the anchor wasn't already clearing. Three looks
that genuinely differ beat four where one is a passenger. **Constraint for anyone re-adding a
look:** it must vary WHAT the look changes (one of the five axes above, or a new one), never HOW
STRICT an existing floor is - a stricter-floor-only look will keep measuring as a duplicate.
Users who need AAA use the manual seven-swatch editor, which has no floor at all.

**Twelve keys generated, by construction.** `dzGenerateScheme(seed, variant)` returns exactly the
keys `applyCustomColorScheme()` (`src/js/scheme.js`) consumes for a scheme: `background`, `item`,
`navbar`, `main_color`, `main_text`, `alt_text`, `border`, `disabled`, `accent_text`, `error`,
`success`, `warning` - 12. Every ratio in the table below is met BY CONSTRUCTION (solved directly
via `dzSolveLightness`, or verified and nudged in a loop for `accent_text`/`main_color`), not
warned about afterwards: `schemeContrastFailures()` is a backstop here, not the gate it is for
hand-picked colours.

| Pair | Crisp | Soft | Deep |
|---|---|---|---|
| main_text vs background | 8.0 | 7.0 | 7.0 |
| alt_text vs background | 5.0 | 4.6 | 4.6 |
| main_color vs background | 4.5 | 4.5 | 5.5 |
| accent_text vs main_color | 4.5 | 4.5 | 4.5 |
| disabled vs background | 3.2 | 3.2 | 3.2 |
| error/success/warning vs background | 4.5 | 4.5 | 5.5 |

Semantic hues (`error` 27deg, `success` 145deg, `warning` 75deg in OKLCH) stay FIXED whatever the
accent is - a purple accent must not make "error" purple - only their chroma follows the accent's
own chroma (clamped to `semC`), so they read as siblings of it rather than pasted-in defaults.

`main_color` and `disabled` are the two keys deliberately NOT spread across looks (no per-look
value beyond the one `acc` floor and the universal 3.2 disabled floor): the accent is the user's
own colour and must look like itself whichever look they pick, and disabled is a de-emphasis
colour with one right answer, not a design axis.

**Deliberately NOT generated: `sun`, `moon`, the five `energy_*` keys.** These are device
semantics - gas is orange because gas is orange, not because a user chose it (see [Semantic
identity colours](#semantic-identity-colours) above) - defined once per scheme BASE in
`dz-tokens.css`/`dark.css`. A generated scheme sets `theme.scheme_base` like any other custom
scheme and inherits them through that underlay untouched. A user does not choose what colour
water is.

### Scheme pairing

`pair` and `variant` are declared metadata, not derived: every built-in scheme JSON
(`schemes/*.json`) now carries them (e.g. Paper Light/Dark both carry `"pair": "paper"`, with
`"variant": "light"`/`"dark"`), and `dzSaveGeneratedPair` (`src/js/schemes.js`) writes them onto
both halves of a wizard-generated pair (`pair` a fresh id from `dzNewPairId`, `variant` its base).
The two hardcoded default cards (Machinon Light/Dark in `renderSchemePicker`) carry `pair:
"machinon"` the same way. A legacy hand-saved preset (`saveCurrentColorsAsScheme`, predating this
metadata) has no `pair` and is correctly treated as unpaired.

`dzFindPairMate(slug, schemes, userSchemes)` resolves a slug's counterpart: the two base cards via
a hardcoded `DZ_BASE_PAIR` map, everything else by matching `pair` with the opposite `variant`
among the built-in schemes list and the user's saved presets, returning `null` for anything
unpaired. **It deliberately has no UI caller yet.** This is groundwork for a future header
light/dark toggle (flip the active scheme to its counterpart without opening the hub), not dead
code left over from a removed feature - the same deliberate-unread-field pattern as `card.pair` in
the scheme picker's card data.

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

**Units: `rem` for the type scale, `px` for fixed detail.** The six scale tokens
are declared in `rem` so they follow the browser's default-font-size preference; the sizes
below are what they compute to at the 16px default. Browser *zoom* already scales `px`
correctly (WCAG 1.4.4); `rem` additionally serves users who raise their default font size
without magnifying the layout.

Not everything follows: the standby clock, icon sizes, borders and layout values stay `px`
deliberately, because they are physical detail rather than reading text. `check-typography.sh`
enforces this in both directions - consuming stylesheets must take sizes from tokens, and the
type tokens themselves must be rem or a `var()` alias, with the standby clock pair exempt by
name. The layout holds to 200% root size: no page overflows its viewport, because the card
grid's tracks are `fr`/`minmax` and absorb taller text.

| Token | Size | Usage |
|-------|------|-------|
| `{typography.micro}` | 11px | `.btn-mini`/`.btn-xs`, chart zoom buttons, compact-card last update, description tooltips, sunrise/sunset times, Dynamic Dashboard library descriptions, log search counter, icon pack chip/description |
| `{typography.xs}` | 12px | Standard buttons, chart menu items, device-card last update, badges, Dynamic Dashboard library labels |
| `{typography.sm}` | 14px | **Body base**, nav links, menus, tables, ACE editor, options menu |
| `{typography.md}` | 16px | Settings panels, dropdown panes, mobile page-title h1 |
| `{typography.lg}` | 20px | Device values (`#bigtext`), section headings |
| `{typography.display}` | 26px | Page-title h1 (desktop), login heading |
| clock (`--dz-text-clock`) | 80px (60px at <=979px) | Standby clock |
| clock-sub (`--dz-text-clock-sub`) | 60px (40px at <=979px) | Standby date |
| icon sm (`--dz-icon-size-sm`) | 16px | Inline/tab Ionicons |
| icon md (`--dz-icon-size-md`) | 24px | Header buttons, card options |
| icon lg (`--dz-icon-size-lg`) | 30px | Search icon, dialog close glyphs |

**Site-only display tier (not theme tokens).** The GitHub Pages landing page under `site/`
declares three additional sizes, `--site-text-display-sm/md/lg` at 32 / 40 / 56px, because a
marketing hero cannot be carried by a 26px maximum. They are declared in `site/style.css`,
they are not `--dz-*` tokens, and they must never be used by theme CSS. `check-typography.sh`
governs `custom.css` and `css/*.css` only, so `site/` sits outside it by design rather than
by omission.

**Semantic aliases.** `--dz-text-lg` is never consumed directly; three aliases name what the
text *is*, so a size decision cannot leak between unrelated surfaces:

| Alias | Resolves to | Used by |
|-------|-------------|---------|
| `--dz-text-value` | `--dz-text-lg` | Device values (`#bigtext`), incl. both compact variants |
| `--dz-text-section-title` | `--dz-text-lg` | Hub section/About titles, `#iconsmain h3` |
| `--dz-text-nav-touch` | `--dz-text-lg` | Mobile flyout menu links (touch targets, deliberately larger than desktop nav's `--dz-text-sm`) |

All three resolve to the same value today, so they are a no-op; the point is that changing
device values can no longer move a heading. The other scale tokens are still consumed
directly on purpose: an alias earns its place when two purposes actually want to diverge,
and only `lg` has demonstrated that. Mint a new one when that
happens, not in advance.

### The Token Contract

Every `font-family`, `font-size`, and `font-weight` declared anywhere in the theme's own CSS
(`custom.css`, `css/*.css`) must resolve through one of the `var(--dz-*)` tokens above, or be
`font-size: 0` (used to visually hide a text node without removing it). `scripts/check-typography.sh`
enforces this line by line, including the shorthand `font:` property (no token-legal form exists for
it, so any use is a violation) and a repo-wide scan for the retired `main-font` family name, and it
gates `scripts/build-release.sh` (run in CI by `validate.yml`): a release cannot ship with a raw
font declaration in theme CSS.

Body text is theme-owned at `--dz-text-sm` (14px), replacing core's `10pt` (13.33px) default. Page
titles (`.page-header-small h1`) are theme-owned at `--dz-text-display` (26px) on desktop, stepping
down to `--dz-text-md` (16px) under 768px so long device names hold one or two lines on a phone.

**Dynamic Dashboard stat cards need two corrections, and both are this theme's doing.** Measured
like-for-like on the same dashboard at the same 1600px viewport, the default theme fits every card
in the Energy Dashboard widget with 5-9px to spare, while Machinon cut two of them.

*Width.* `css/nav.css` sets `.bannercontent { padding: 90px 2% 0 2% }`, a gutter that suits the
classic list pages. The dash2 board brings its own (`.dd-page { padding: 10px 8px 8px }`), so ours
was pure loss: 30.89px a side, and with the scrollbar the grid ran 1467px against the default
theme's 1544px, costing 38px on every 6-column widget and 8px on every stat card (136 vs 144).
`css/dynamic-dashboard.css` zeroes the horizontal padding on that page only, via
`.bannercontent:has(.dd-page)`; the vertical padding stays, since the 90px top clears the navbar.

*Type width.* Core renders `.dd-stat-value` at 1.9em, which is 133px of 13.33px Arial for
"0.809 m3" inside a 144px card. The same string in this theme's 14px Inter is 148px, about 11%
wider, so it was cut. `--dz-text-widget-value` caps it with `min(1.9em, 18cqi)` and makes
`.dd-stat-card` the container, so the value renders at core's own size whenever it fits and shrinks
only on the cards that would cut. Note `cqi` resolves against the container's CONTENT box: 12cqi
was tried first and rendered 14.2px against the default theme's 25.3px, which is a different defect,
not a fix. 18cqi gives 21.3px, the largest that fits.

`.dd-stat-line` (core's 1.3em two-column rows, used by the Battery card) needs the same cap via
`--dz-text-widget-line`, at a lower `cqi` because the constraint there is two columns sharing the
card rather than one centred number. Capping only the value missed it: at full width the right
column ran 5px past the card edge and lost `54.6 V` to `overflow: hidden`.

Separately, `--dz-widget-sunpv` is defined in `dz-tokens.css` because **core uses it twice and
defines it nowhere** (`energy-dashboard.html:186`, `battery-status.html:59`). An unresolved `var()`
with no fallback is invalid at computed-value time, and `color` inherits, so that line rendered
`rgb(255,255,255)` on a white card: correctly positioned, fully opaque, and invisible. Aliased to
`--dz-widget-amber` because that is what the name implies; remove once core defines it.

The container belongs on the CARD, not the widget cell. An earlier attempt put it on the cell and
changed nothing, because the cell is wide while the box that is actually too narrow is one of six
cards inside it.

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
`css/typography.css`, not left to inheritance). The value (`#bigtext`) is `--dz-text-lg` (20px,
regular weight); last update is `--dz-text-xs` (12px). Compact-dashboard cards (`.span3`) reuse the
same tokens: bigtext is `--dz-text-lg` at `--dz-weight-semibold`, last update steps down to
`--dz-text-micro` (11px). One width-gated exception: on a Dynamic Dashboard tile under 200px the
value steps to `--dz-text-md` (16px) and moves to its own line (see Standard card below), because at
that width name and value cannot share a row. There is no separate relative-size table: every card
variant, standard or compact, reads its size from the scale above.

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

### Top Header

Two stacked rows read as one block. The **logo row** (`header.logo`) is the brand strip: `--dz-accent-color`, carrying the logo, search and hamburger in the on-accent token so they read on it. The **menu bar** (`.navbar-inverse .navbar-inner`) below it is neutral `--dz-nav-bg`, with a 1px `--dz-accent-color` hairline at its bottom marking the block's end. The two rows differ in colour, so they read as distinct without a line between them (this replaced a `--dz-status-disabled` to `--dz-accent-color` gradient). The accent tracks the scheme, so on the pale-accent dark scheme the brand strip is a lighter band.

The default logo is an inline SVG wordmark (`images/machinon/brand/logo.svg`, lowercase "machinon"), injected by `page.js` `setLogo()`. On the accent strip it is drawn **mono on-accent**: text and mark both `--dz-accent-text`, the open ring `--dz-accent-color` (so the strip shows through it). A user-uploaded custom logo (`theme.logo`) stays an `<img>` and is never recoloured; `hide_logo` toggles whichever is shown. The logo is `150px` wide (`125px` on mobile), left-padded `20px`, centred on mobile. Master SVGs live in the `images-machinon` logo engine (`brand/`, `brand/BRAND.md`); the two-tone adaptive treatment (mark `--dz-accent-color` on a neutral ground) is used off-theme, e.g. the site nav.

The hamburger bars are `--dz-accent-text` on the accent strip; scrolled, the toggle detaches into an `--dz-accent-color` box (with `--dz-elev-popup`) keeping the on-accent bars. When the flyout opens, that box is dropped and the bars become the close X in `--dz-body-text` on the neutral drawer, the same whether opened from the top or while scrolled. The search box is `--dz-accent-text` on the strip; its mobile expanded field is a neutral `--dz-widget-bg` popup (accent border) so it stands out from the accent header.

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
overrides each one to a deepened alpha (see Dark Underlay below).

| Level | Name | Token | Value | Usage |
|-------|------|-------|-------|-------|
| 0 | flat | none | `none` | Default state, transparent backgrounds |
| 1 | card | `--dz-elev-card` | `0 1px 4px rgba(0,0,0,0.25)` | Device cards, DataTables, log console, page-content containers |
| 2 | popup | `--dz-elev-popup` | `0 2px 6px rgba(0,0,0,0.28)` | Navbar inner and dropdown menus (nav, sidemenu, settings), Highcharts export menu, card tooltips, mobile item cards, mobile search input |
| 3 | button | `--dz-btn-shadow` | see [Buttons](#buttons) Token Table | Resting shadow for every filled button; the value lives in the Buttons section's token table, referenced here rather than duplicated, along with the hover/pressed/focus-ring variants |
| 4 | overlay | `--dz-elev-overlay` | `0 3px 10px rgba(0,0,0,0.30)` | Card options flyout, setpoint popup, search message toast |
| 5 | drag | `--dz-elev-drag` | `0 6px 14px rgba(0,0,0,0.35)` | Drag ghost during card reorder |

The values above follow a crisp-tight direction: small offsets, tight blur, alpha carrying the
depth. Per the token-derivation policy that already governs Colors (see above): a token's
definition must either derive from another token or document why its value is fixed. The
elevation, glow, and ring values below are fixed by design (shadow geometry and alpha, not a color
that a scheme overrides), so they are literal `rgba()`/`px` values rather than `var()` references.

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

### Modal Scrim

`#mk-rgbw-scrim` (css/rgbw-popup.css) codifies the modal scrim language: a full-viewport
`rgba(0, 0, 0, 0.5)` dim, NO blur or glass (the Menus anti-glass ruling: glass fails AA on busy
backdrops), fixed literal by design (shadow geometry, not a scheme color). Any future modal
reuses this scrim, not a new one.

### Interactive States

- **Card hover**: `--dz-ring-hover`. **Constraint.** `box-shadow` is a single property, so a
  hover rule listing only the ring would delete the resting card shadow; the token composes
  `var(--dz-elev-card)` into its own definition so no call site can drop the card layer
  (`dz-tokens.css`, the accent-rings comment).
- **Card hover (Dynamic Dashboard)**: `--dz-ring-hover-inset`. **Constraint.** Core clips the
  card cell with 0px of top/bottom clearance, so an outer ring is shaved invisible there; the
  inset form is the only one that renders correctly. Full clip geometry lives with the rules
  in `css/cards.css`.
- **Update pulse**: keyframe animation (`css/device-status.css`) that flashes the accent ring
  outward to a 3px peak over 0.8s. The 50% keyframe carries a `dz-shadow-exception` marker: it is
  an animated intermediate value, intentionally wider than the static `--dz-ring-accent` (2px),
  and collapsing it to the token would flatten the pulse's peak.
- **Drag target (active)**: `var(--dz-card-drop-outline-width) dashed rgba(var(--dz-accent-values), 0.3)` outline, `var(--dz-card-drop-outline-offset)` offset
- **Drag target (hover)**: `var(--dz-card-drop-outline-width) solid var(--dz-accent-color)` outline, `var(--dz-card-drop-outline-offset)` offset, `rgba(var(--dz-accent-values), var(--dz-card-drop-hover-bg-alpha))` background tint, `0.15s ease` transition

### Dark Underlay

`dark.css` redefines `--dz-elev-*` to a deepened alpha per level: the same geometry, deepened
so it still reads against a dark surface. `--dz-elev-drag`'s alpha is capped at 0.6 rather than
continuing the linear scale from its light-scheme value.
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
`scripts/check-shadows.sh` per the per-layer rule described below, and the JS exception sits
outside the checker's `*.css` scope entirely.

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
gates `scripts/build-release.sh` (run in CI by `validate.yml`) alongside `check-typography.sh` and
`check-buttons.sh`.

## Buttons

Every button-like control in the theme (`.btn*` classes, label-as-button chips, icon-only hit-boxes,
and several core-rendered regions that ship no `.btn` class at all) shares one **soft-elevated**
language: one radius, one resting/hover/pressed shadow triple, one focus ring, one disabled
treatment (`css/buttons.css`). The token table and size tiers below name every variant.

### Token Table

All tokens live in `dz-tokens.css`. Colors/text below are the light-scheme values; dark.css overrides
the ones that need to differ.

| Token | Value | Notes |
|-------|-------|-------|
| `--dz-btn-primary-bg` | `var(--dz-accent-color)` | Filled primary/info background |
| `--dz-btn-primary-text` | `var(--dz-accent-text)` | Text on any filled or toggle-selected surface |
| `--dz-btn-info-bg` | `var(--dz-accent-color)` | Alias: Bootstrap's `.btn-info` reuses the primary look |
| `--dz-btn-danger-bg` | `var(--dz-accent-red)` | Filled danger background |
| `--dz-btn-success-bg` / `--dz-btn-warning-bg` | `#306b30` / `#7a5412` | Defined in the mapped-token block, not the `--dz-btn-*` block; consumed by `.btn-success`/`.btn-warning` (both declared-only, no live instance in the current markup) |
| `--dz-btn-bg` / `--dz-btn-text` / `--dz-btn-border` | `var(--dz-widget-bg)` / `var(--dz-body-text)` / `var(--dz-input-border)` | Bootbox `.modal-footer .btn` only; radius/shadow come from the shared base rule (`--dz-btn-radius`/`--dz-btn-shadow`), not from this token group |
| `--dz-btn-hover-bg` | `rgba(var(--dz-accent-values), 0.1)` | Ghost/icon-quiet hover tint |
| `--dz-btn-shadow` | `0 1px 3px rgba(0,0,0,.18), 0 1px 2px rgba(0,0,0,.10)` | Resting elevation for every filled button |
| `--dz-btn-shadow-hover` | `0 2px 6px rgba(0,0,0,.22), 0 1px 3px rgba(0,0,0,.12)` | Hover: shadow grows, it does not change color |
| `--dz-btn-shadow-pressed` | `inset 0 1px 2px rgba(0,0,0,.12)` | Momentary `:active` only; the toggle-selected family does not consume it (see Family Roles and States below) |
| `--dz-btn-focus-ring` | `0 0 0 2px rgba(var(--dz-accent-values), .35)` | `:focus-visible`; stacks on top of the resting or pressed shadow (comma-joined, never replaces it) |
| `--dz-btn-radius` | `10px` | Every button's corner radius; see Radius Rationale |
| `--dz-btn-pad-xs` / `-sm` / `-md` / `-lg` | `4px 8px` / `4px 12px` / `6px 14px` / `10px 20px` | Size-tier padding only; font size stays on the typography token contract, not here |
| `--dz-btn-ghost-border` / `-text` | `1px solid var(--dz-accent-color)` / `var(--dz-body-text)` | Ghost family (bordered, transparent at rest) |
| `--dz-btn-toggle-selected-bg` / `-text` | `var(--dz-accent-color)` / `var(--dz-accent-text)` | One pressed/selected fill for every toggle mechanism (theme's own `.btn-selected` and Bootstrap's native `.active`) |
| `--dz-btn-icon-box` | `28px` | Min-width/min-height square hit-box for icon-only buttons |
| `--dz-btn-line-height` | `20px` | Forced line-height so same-tier block buttons measure an identical height everywhere |
| `--dz-btn-disabled-bg` / `-text` | `var(--dz-status-disabled)` / `var(--secondary-text-color)` | Shared by every family; see the existing WCAG AA gap below |
| `--dz-menu-bg` | `var(--dz-nav-bg)` | Shared "Menu" surface; see Menu Surface below |

### Size Tiers

| Tier | Padding token | Value | Paired font | Example consumers |
|------|--------------|-------|-------------|--------------------|
| `xs` | `--dz-btn-pad-xs` | `4px 8px` | `--dz-text-micro` (11px), explicit on `.btn-mini`/`.btn-xs`/`.btn-small` | Chart zoom buttons, HVAC/Scene segmented pills, Events A-/A+, label-as-button chips |
| `sm` | `--dz-btn-pad-sm` | `4px 12px` | Inherits the ambient `--dz-text-sm` (14px); no tier-level override | Back/Forecast nav links, `.btnsmall`/`.btnsmall-sel` ghost buttons, grid-view `.btnstyle3` |
| `md` | `--dz-btn-pad-md` | `6px 14px` | Split: `.btn-primary`/`.btn-info`/`.btn-warning`/`.btn-danger` pin `--dz-text-xs` (12px) explicitly; `.btnstyle3`/`.btnstyle3-sel` inherit the ambient `--dz-text-sm` (14px) instead | Save/Delete toolbars, Hardware/Users "Add", sub-device editor buttons, Setup "Apply Settings" |
| `lg` | `--dz-btn-pad-lg` | `10px 20px` | `--dz-text-sm` (14px), explicit on `.btn-modern`/`.btn-modern-warning` | Login/Verify/Passkey (`.btn-modern`) |

Three more tier names exist, but they are not padding-driven sizes,
so they sit outside the table above:

- **`compact`** - the flex-centered `.btnstyle3` family. It hugs its own text content height instead
  of the forced line-height the block family uses, so it lands on a constant rendered height
  regardless of which pad token happens to apply; it gets its own name so a real
  height regression is never masked by "well, it's still md padding."
- **`icon-box`** - `.btn-icon` and friends: the `--dz-btn-icon-box` (28px) square hit-box family.
- **`icon`** - bare glyph close buttons (Tips modal `x`, Automation Wizard `x`, Dynamic Dashboard
  panel `x`). These render at `border-radius: 0`, sized by their own font-size/line-height alone; they
  are core-native text glyphs, deliberately outside the button token system, not an oversight.

### Family Roles

| Family | Look | Classes | Notes |
|--------|------|---------|-------|
| **Filled primary/info** | Accent fill, `--dz-accent-text` text | `.btn-primary`, `.btn-info`, `.btnstyle3`, `.btn-modern` | Primary actions, save, login |
| **Filled danger** | `--dz-accent-red` fill | `.btn-danger`, `.btn-modern-warning` | Destructive actions |
| **Filled success/warning** | Semantic fill | `.btn-success`, `.btn-warning` | Declared and token-correct; **no live instance** in the current markup |
| **Ghost** | Transparent, `1px solid` accent border, tint only on hover | `.btn-default`, `.btnsmall`, `.btn-small` | Secondary/filter/toolbar actions; no resting elevation |
| **Toggle-selected** | Accent fill, flat (no pressed inset) | `.btn-selected`, `.btn-group .btn.active`, `.btn.active`, `.zoom-button-active` | One fill language for both the theme's own selected class and Bootstrap's native `.active`. Flat by design: a persistent selected state is a resting state, not a moment of contact, so it does not borrow `--dz-btn-shadow-pressed` - fill + text color alone carry "selected". The momentary `:active` press (a genuine click, not a resting selection) does use that token; see States below |
| **Icon-quiet** | Fully transparent, no border, no resting shadow | `.btn-icon` | Hit-box only (`--dz-btn-icon-box`); hover is a tonal glyph filter (`saturate`/`brightness`), never a background wash, so device/card icon glyphs don't start looking like buttons |
| **Accent-pill** | Accent-tinted wash at rest, `--dz-accent-color` glyph, strengthens to `--dz-btn-hover-bg` on hover | `.page-devices > .splitter` | The one icon-quiet-adjacent control that needs to read as an affordance *before* the pointer arrives (it collapses/expands the whole filter column); deliberately not icon-quiet for exactly that reason - see Core-Region Takeover |
| **Label-as-button** | Accent fill, xs padding | `.label-info[href]`, `.badge-info[href]`, `.label.lcursor`, `.badge.lcursor` | Core renders several clickable actions as `<span>`/`<a>` labels, not `<button>`; only the clickable ones (`[href]`/`.lcursor`) join the button system - static `.label`/`.badge` chips stay flat informational chips |
| **Disabled** | Flat grey, no shadow | `[disabled]`, `.disabled`, `.btnstyle3-dis`, `.btnsmall-dis` | Same `--dz-btn-disabled-bg`/`-text` pair across every family; `cursor: default`/`not-allowed`, `pointer-events: none` in most paths |

### States

- **Rest**: `--dz-btn-shadow` (filled/toggle-selected only; ghost and icon-quiet render flat)
- **Hover (filled)**: the shadow grows to `--dz-btn-shadow-hover` and the fill darkens via
  `color-mix(in srgb, <bg> 90%, black)` - not a `filter`. The `.btn-group` filled variants
  (`.btn-group .btn-primary`/`.btn-danger`/`.btn-info`, the connected Save/Delete/Enabled pills) are
  the one place still on the older `filter: brightness(0.85)` mechanism; a known inconsistency,
  not an intended second hover language
- **Hover (ghost/icon-quiet)**: `--dz-btn-hover-bg` tint (ghost) or a tonal glyph `filter` (icon-quiet); no shadow change
- **Pressed (momentary `:active`)**: `--dz-btn-shadow-pressed` (inset), replacing Bootstrap 2's own
  divergent light/dark inset shadows
- **Toggle-selected (persistent)**: flat - no shadow, `box-shadow: none`. Deliberately split from
  the bullet above: a selected state sharing the pressed inset would read as "permanently being
  clicked"; fill + text color alone carry the state
- **Focus-visible**: `--dz-btn-focus-ring`, stacked with a comma onto whatever shadow the element
  already carries at rest, never replacing it. **Constraint.** Later flat-family rules would tie
  the ring away by source order, so it is re-asserted per state; the accounting lives in
  `css/buttons.css`'s "Focus ring, state-proof" block
- **Disabled**: flat - `--dz-btn-disabled-bg`/`-text`, `box-shadow: none`, no hover/focus reaction
- **Transition**: `background-color .12s ease, box-shadow .12s ease` on the shared base rule (plus a
  slower `0.15s ease` background/color/border-color/filter transition kept on the older Bootstrap-class
  selectors for the brightness-hover holdouts above)

**Label centering.** Every button in the base rule is `display: inline-flex; align-items: center;
justify-content: center` rather than centered by arithmetic. **Constraint.** Core fixes some button
heights the theme doesn't own, and flex/stretch parents can grow a box past the padding+line-height
sum; the live cases are documented with the base rule in `css/buttons.css`.

### Radius Rationale

Buttons are `10px` (`--dz-btn-radius`), device cards are `6px` (`{rounded.container}`) - a deliberate
split, not a rounding inconsistency: buttons are a small, dense control that reads better with a
softer, roomier corner than a large card surface would want. There is no filled "you are here" box
anywhere: every menu surface uses the unified accent-edge language, no radius involved; see
[Menus > Unified Accent-Edge](#unified-accent-edge-you-are-here-language).

### Menu Surface

`--dz-menu-bg` aliases `--dz-nav-bg`: the top menu bar and every floating
menu (navbar dropdown, card 3-dot flyout) share ONE color concept, the scheme's "navbar" color, which
the settings UI labels "Menu". Floating menus consume `--dz-menu-bg`, never `--dz-nav-bg` directly, so
the mapping stays a single-line decision if a future scheme ever wants the two surfaces to diverge. The
scheme JSON key itself stays `navbar` (not renamed to `menu`), since renaming it would be a scheme
file-format break for no behavioral gain. This is one token of a larger shared family; see
[Menus](#menus) for the full token set, per-surface anatomy, and enforcement.

### The Button Contract (enforcement)

`scripts/check-buttons.sh` (static, scoped to `css/buttons.css` only) checks that every
`border-radius`, `box-shadow`, and `padding` declaration in that one file resolves through a
`var(--dz-btn-*)` token (or is `0`/`none`); a line tagged `dz-btn-exempt` with its own justification
comment is skipped. It gates `scripts/build-release.sh` (run in CI by `validate.yml`) alongside
`check-typography.sh`: a release cannot ship with a raw radius/shadow/padding value in that file.

### Bootstrap 2 Constraint

**Constraint.** Bootstrap 2 (`css/bootstrap.css`, loaded globally, not removable per-theme) styles
`.btn-*` with gradients at higher state-rule specificity than the theme's base rules. Every
`!important` in `css/buttons.css` on `background`/`border`/`box-shadow`/`color` exists to beat this
one constraint, not as a style preference; the full specificity accounting lives in that file's
"Universal button reset" comment block. See also the Don'ts entry on `!important` below.

### Core-Region Takeover

Regions core styles itself (its own stylesheet loads after the theme and re-asserts raw values, or
ships bare/unclassed buttons the `.btn` system never reaches) needed their own rules, one per region,
each citing in its owning file the exact core selector/specificity that forced it:

- **`dd-topbar`** (Dynamic Dashboard compact view-mode bar) - icon-quiet tier (`css/buttons.css`)
- **Events editor chrome + Automation Wizard** - toolbar buttons, the open-file tab close-`x`, and the
  Wizard footer (filled tier, including Back/Cancel which the ghost convention would otherwise give)
  (`css/buttons.css`)
- **Charts zoom/range segmented group** - `.zoom-button`/`.zoom-reset` ghost tier, plus the connected
  1H/3H/day range group using the same corner-squaring technique as `.btn-group` (`css/charts.css`)
- **DataTables pager** - `.fg-button` ghost tier; lives in `css/tables.css`, not `css/buttons.css`,
  for cascade-order reasons documented with the rule there
- **Devices panel splitter** - accent-pill tier (`css/buttons.css`); see Family Roles for why it is
  deliberately not icon-quiet
- **Dropdown active item** - every dropdown's "you are here" marker; lives in `css/nav.css` as part
  of the `--dz-menu-*` family, not the button system (see [Menus](#menus))
- **About page** - `.btn-modern` used directly; no override needed, listed for completeness

### Button Groups

**In device cards** (`css/cards.css`, `.item .btn-group`): SelectorStyle-0's sole emitter inside a
card (HVAC Mode, Scene Selector, any multi-level Selector switch). Level buttons do not render as
separate pills at a diverged radius: they join into one connected-toolbar run at the family radius
(`--dz-btn-radius`) itself, reusing the exact mechanism described in the paragraph below rather
than diverging from it. Full mechanism and wrap behavior: [Selector Levels](#selector-levels).

**In toolbars/dialogs** (`css/buttons.css`, `.btn-group`): connected segments, all at `--dz-btn-radius`
(10px). First child: outer corners rounded, inner corners squared. Last child: mirrored. Middle
children: fully squared. A `.btn-group` wrapping a single button (`:only-child`, e.g. the Dynamic
Dashboard's dashboard-switcher) gets the full radius back, since there is no sibling to square against.
`1px solid` accent border, `-1px` left margin to collapse borders. The same corner-squaring technique
is reused verbatim for the chart zoom/range group (see Core-Region Takeover).

## Tables

Every table-bearing surface in the theme (core's DataTables pages and its report tables) follows
one **alignment policy** keyed to column content type, one shared padding rhythm, and one
totals-row treatment (`css/tables.css`, `dz-tokens.css`). Without these rules, alignment is
accidental: core's own CSS either leaves every column at the browser default (left) or, on report
tables, blanket right-aligns every cell regardless of type, so headers and data frequently
disagree and numbers are never actually right-aligned anywhere in the theme.

### Alignment Policy

| Column type | Alignment | Detection |
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

**The month-view weekday column's fingerprint.** **Constraint.** Core gives every report type's
month-view weekday column no id, class, or header text to select on, so `css/tables.css`
selects on an aria-label fingerprint instead; the fragility account lives with the rule in
`css/tables.css`.

### Token Table (Tables)

The fourteen `--dz-table-*` tokens live in `dz-tokens.css` and are consumed by `css/tables.css`. The related `--dz-form-cell-pad` (last row) lives alongside them but is a form rhythm consumed by `css/settings.css`, not a data-table token.

| Token | Value | Notes |
|-------|-------|-------|
| `--dz-table-header-bg` | `var(--dz-widget-bg)` | Header row background |
| `--dz-table-header-text` | `var(--dz-body-text)` | Header row text |
| `--dz-table-row-even-bg` | `var(--dz-widget-bg)` | Even (unstriped) row background |
| `--dz-table-row-odd-bg` | `color-mix(in srgb, var(--dz-widget-bg) 92%, var(--dz-body-text))` | Odd-row stripe; DERIVED (8% body text mixed into the widget background) so striping stays readable under every scheme - the old fixed greys failed WCAG under some schemes' text colors |
| `--dz-table-row-text` | `var(--dz-body-text)` | Row text |
| `--dz-table-border` | `var(--dz-input-border)` | Row border |
| `--dz-table-row-selected-bg` | `rgba(var(--dz-accent-values), 0.18)` | Selected-row background; a soft accent tint (row text stays `--dz-table-row-text`, no opacity dimming). See Selected/Hover Rows |
| `--dz-table-row-selected-border` | `var(--dz-accent-color)` | Selected-row accent edge; an inset left box-shadow on the first cell |
| `--dz-table-row-hover-bg` | `rgba(var(--dz-accent-values), 0.08)` | Row hover tint; lighter than the selected tint so the two states stay distinct |
| `--dz-table-control-text` | `var(--secondary-text-color)` | DataTables length/filter/info chrome text |
| `--dz-table-total-bg` | `color-mix(in srgb, var(--dz-accent-color) 15%, var(--dz-widget-bg))` | Totals/summary row background; DERIVED so schemes track (see Totals Rows below) |
| `--dz-table-total-text` | `var(--dz-body-text)` | Totals/summary row text |
| `--dz-table-cell-pad` | `6px 10px` | Body-cell padding rhythm (see Padding Rhythm below) |
| `--dz-table-header-pad` | `8px 10px` | Header-cell padding rhythm |
| `--dz-form-cell-pad` | `8px 10px` | Form (label:value) cell padding for Setup tabs and edit-form `.table-details`; a separate rhythm from the data-cell pad (forms, not data rows), horizontal deliberately not widened (mobile overflow) |

### Totals Rows

The totals idiom: a **quiet accent-tinted band**, `--dz-table-total-bg` (15% accent mixed into the
widget surface) paired with the ordinary body-text token, never the accent color at full strength.
It replaces the inline style core appends with its totals `<tfoot>`
(`CounterReport.js`/`RainReport.js`; `TemperatureReport` has none, no natural sum), whose bold
accent band falls below the 4.5:1 WCAG AA floor under the live Blue UI scheme. Both schemes clear
AA (>= 4.5:1) with the token pair. **Constraint.** The override must be row-level `!important`,
since an inline style beats any external selector; the inheritance account lives with the rule in
`css/tables.css`.

### Padding Rhythm

`--dz-table-cell-pad` (6px 10px) and `--dz-table-header-pad` (8px 10px) replace DataTables' vendor
default (`3px 10px`, `demo_table_jui.css`) on every DataTables page and the report tables' `thead`/
`tbody`/`tfoot` cells alike, so header height and row rhythm match across every table-bearing surface
in the theme. These are a deliberate **design choice** near the de facto 4/8/10 spacing cluster
(see [Spacing](#spacing)), not derived from the spacing scale directly - a table row needs independent
vertical/horizontal control a single spacing scalar can't express, so they get their own token pair
rather than reusing `{spacing.xs}`/`{spacing.sm}` in place.

**Accepted mobile cost.** The rhythm leaves Users[mobile] and Cam[mobile] with a small page-length
overflow at 360x780; accepted rather than carving out per-surface padding.

### Viewport Fit

Two chrome-sizing overrides, unrelated to alignment/padding, keep table-bearing pages from
overflowing the viewport:

- **`#/Log` desktop (145px chrome constant).** **Constraint.** Core's `.log-console-container`
  guesses its surrounding chrome at 110px; Machinon's actual chrome measures 145px, a flat 35px
  overflow. `css/logpage.css` overrides the constant to `calc(100vh - 145px)`, desktop-only; the
  derivation arithmetic lives in that file's comment above the override.
- **Mobile app-shell (60px).** **Constraint.** Below 979px the navbar moves into normal flow
  (see [Mobile Layout](#mobile-layout)), claiming 60px core's `#holder { min-height: 100% }` knows
  nothing about; `css/sidemenu.css` compensates with `min-height: calc(100% - 60px)`, clearing the
  identical overflow on Users, Mobile, and Cam at once. The failure chain lives with the rule in
  `css/sidemenu.css`.
- **`#/Devices`.** Not a chrome-sizing bug (genuinely more content than any viewport); it gets
  the `#/Log` treatment: page fits the viewport, the row area alone scrolls with a sticky
  `<thead>`, scoped to `.page-devices` only. **Constraint.** The per-breakpoint budgets are in
  the [Viewport-Fit Pages](#viewport-fit-pages) table; the derivation, live measurements, and
  the DataTables markup-shape account live in `css/tables.css`'s comments above the rules.

### The Table Contract

Tables have **no static grep-style checker** (no `scripts/check-tables.sh`) - by design, not an
oversight: table correctness is a rendered-page property (live data classification, computed colors
through cascade and inline styles), not a lexical property a regex can answer. Verifying tables
means checking the rendered page against three invariants:

1. **Alignment**: every column's header and data agree, per the Alignment Policy above.
2. **Totals-row contrast**: >= 4.5:1 (WCAG AA normal text) in both schemes.
3. **Viewport**: `scrollWidth` and `scrollHeight` stay within the viewport, minus the pages that
   scroll by design.

### Core-Region Takeover (Tables)

Regions core renders and styles itself, each needing the theme's own alignment/padding/totals rules
layered on top. The per-column type census behind each rule set (which columns are numeric,
datetime, or icon, and why) lives as comments beside the rules in `css/tables.css`:

- **Devices** (`#devices`, 14 columns), including a Last Seen `nowrap` rule (Inter is wider than
  the original theme's Open Sans).
- **Hardware** (`#hardwaretable`, 7 columns).
- **Cam** (`#cameratable`, 10 columns, plus `#activetable`, 3 columns).
- **Mobile** (`#mobiletable`, 6 columns).
- **Device Timers** (`.js-device-timers` container; the table has no static id).
- **Report tables** (`#reporttable.myrighttable`, every report type) - base right-align, the two
  text columns left (see the aria-fingerprint note above), the trend column centered, and the
  totals band override (see Totals Rows above). Core's own `.myrighttable td` blanket right-aligns
  every cell regardless of type; these rules also fix the header side of that mismatch.
- **DataTables pager** (`.fg-button`) - ghost-tier styling; documented under
  [Buttons > Core-Region Takeover](#core-region-takeover), since it's a button family, not a table
  concern, even though the rule lives in `css/tables.css` for cascade-ordering reasons.

## Menus

Every menu-shaped surface in the theme, the top navbar band, its dropdowns (Setup, Other,
Custom), third-level flyout submenus (More options > Plans / Data push), the mobile side-menu
flyout, the settings tile grid (`#/SetupMenu`), the standard Settings page (10 Setup tabs), and
the card 3-dot options flyout, shares one designed family (`dz-tokens.css`,
`css/nav.css`, `css/sidemenu.css`, `css/settings.css`, `css/cards.css`).

### The Eight Surfaces

| Surface | What | Family tokens consumed |
|---|---|---|
| S1 | Desktop navbar + its dropdowns (Setup, Other, Custom) | bg, text, item-hover-bg, item-active-bg, separator, radius, shadow |
| S2 | Third-level flyout submenus (Setup > More options > Plans, > Data push) | bg, text, item-hover-bg, radius, shadow (geometry containment is JS, not tokens) |
| S3 | Mobile side-menu flyout (`.navbar-inverse.navbar-inner.slide`, `<979px`) | bg, text, item-hover-bg, item-active-bg, separator, shadow |
| S4 | Settings tile grid (`#/SetupMenu`) | text only (`.machinoText`/`.dropdown-content a`); the tile box itself is card-tier, see Card-Flyout below |
| S5 | Standard Settings page (10 Setup tabs) | separator (heading underline); everything else is the type scale, spacing clusters, and card-tier tokens, not `--dz-menu-*` |
| S6 | Sub-tabs / nav-tabs (watch-only) | none of `--dz-menu-*`; its own established underline recipe, see Watch-Only below |
| S7 | Card 3-dot options flyout (`css/cards.css` `.options`) | bg only, see Card-Flyout below |
| S8 | Setup CTA (mobile fixed Apply bar vs in-flow controls) | none; a layout defect class, not a styled surface |

### Token Table

All tokens live in `dz-tokens.css`, `:root` (light-scheme values below; `dark.css` needs **no**
menu-family entries at all, every token is either a `var()` alias/composition of a token
`dark.css` already overrides, or a scheme-independent literal).

| Token | Value | Notes |
|-------|-------|-------|
| `--dz-menu-bg` | `var(--dz-nav-bg)` | The top bar and every floating menu share one "Menu" surface colour, the scheme's navbar tint |
| `--dz-menu-text` | `var(--dz-body-text)` | Resting item/label text |
| `--dz-menu-item-hover-bg` | `rgba(var(--dz-accent-values), 0.15)` | Dropdown-item hover tint |
| `--dz-menu-item-active-bg` | `transparent` | Current-route item background; stays transparent by design, "you are here" reads via the accent-edge language below, never a fill |
| `--dz-menu-separator` | `var(--dz-status-disabled)` | Divider between stacked items (`css/sidemenu.css`) |
| `--dz-menu-radius` | `6px` | Floating-menu container corner radius (`css/nav.css`) |
| `--dz-menu-shadow` | `var(--dz-elev-popup)` | Composes the popup elevation tier (dropdowns and flyouts) |

### Unified Accent-Edge "You Are Here" Language

Every menu surface marks its current item the same way, oriented to the surface's own axis.

- **Horizontal surfaces** (top navbar tab, sub-tabs): a `2px solid var(--dz-accent-color)`
  **bottom border**, no fill, no box. The top navbar's rule reuses the sub-tabs' own active
  recipe verbatim rather than inventing a second underline mechanism (`css/nav.css`,
  `.navbar .nav .current_page_item > a`). Every item, current or not, reserves the full
  `border-bottom-width: 2px` at rest, so becoming current only ever changes the edge's colour,
  never its width, no layout shift.
- **Vertical surfaces** (dropdown current items, mobile flyout current items): the identical
  language rotated 90 degrees, a `2px solid var(--dz-accent-color)` **left border**, again no
  fill (`css/nav.css` `.navbar .nav .dropdown-menu .current_page_item > a`; `css/sidemenu.css`
  `.navbar .nav .current_page_item > a`). The same edge-width reservation applies on every item.
- **Focus-visible ring** is reserved for keyboard navigation only; a plain `:focus` must never
  paint a "you are here" box, because a real click focuses an element (mouse-away leaves it
  focused, not hovered), so any `:focus`-scoped marker would repaint on every click. There is no
  filled current-item box anywhere.

**Constraint.** The current-item rules and the `:focus-visible` ring's `box-shadow` are
`!important` out of necessity, not preference: core ties the same selectors on border and color,
and the ring would otherwise be killed on the current item itself. The full cascade accounting
lives with the rules in `css/nav.css` and `css/sidemenu.css`.

### Defect Fixes

**Third-level flyout containment (S2).** **Constraint.** Bootstrap anchors a submenu's top edge
to its trigger with no viewport awareness, and a CSS clamp would clip the third-level flyouts
sharing the same selector, so containment is JS (`armFlyoutContainment()`, `src/js/page.js`);
the mechanism and its fail-closed behavior live in that function's comment block.

**Setup CTA overlap (S8).** **Constraint.** Core's fixed mobile Apply bar paints over whatever
in-flow content occupies its band, so a padding nudge cannot fix it; `css/settings.css` instead
caps the tab content to a measured viewport budget and lets it scroll internally, mobile-only,
leaving the bar itself untouched. The derivation and scoping account live with the rules there.

### Surface Treatments

**Settings page (S5).** Sub-tabs render as a single horizontal row with horizontal overflow
scrolling, mirroring the Theme hub's own `.dz-hub-tabs` pattern, instead of a tall wrapped block.
Section headings (`h2`) sit on the type scale (`--dz-text-md`, 16px semibold) with a
`border-bottom` + `margin-bottom` section boundary; table-cell padding is `8px 10px`, and the
roomier 15/20 cluster is deliberately not used (the centered-row overflow trap; see the comment in
`css/settings.css`). Depth is **flat modern**, coherent with the Theme hub: bordered, shadowless
panels, and Setup's inputs carry the `:focus-visible` ring recipe from `css/theme-hub.css`'s
`.dz-hub-input`. **Constraint.** The one inline-width `!important` widening (Security tab) and the
id-based specificity that beats the card rule are accounted for beside the rules in
`css/settings.css`.

**Desktop dropdowns and submenus (S1/S2).** Items use the 8/10 padding cluster; the item hover
tint rides `--dz-menu-item-hover-bg`; the `.divider` rule is tokenized (`--dz-menu-separator`),
since an untokenized divider silently inherits core's near-invisible `rgba(255,255,255,0.1)`. The
current item carries the accent left edge (see Unified Accent-Edge above). Top-level nav hover is
a visual no-op in both schemes (`background: var(--dz-nav-bg)`, byte-identical to the navbar's own
background). Two known core-side defects, logged, not fixable in theme CSS: the admin Setup toggle
redirects to `#/SetupMenu` on a real click, and duplicate `id`s in core's `index.html` leave the
Other dropdown with no "you are here" marker for a non-admin user.

**Mobile side menu (S3).** The panel (`.navbar-inverse.navbar-inner.slide`, `<979px`) renders
**opaque** (`var(--dz-menu-bg)`, no `backdrop-filter`): glass and accent-tinted scrims both fail
WCAG AA text contrast on busy backdrops, measured in both schemes; the opaque panel clears 4.5:1.
Item density matches the desktop dropdowns (`8px 10px`); the current item carries the 2px accent
left edge, never the horizontal underline (vertical surface). The open-state close ("X") bars read
`var(--dz-body-text)`, not `#fff`, clearing the WCAG SC 1.4.11 3:1 non-text floor against the
scheme surface; the closed hamburger's `#fff` bars stay, sitting on the blue banner instead.
**Constraint.** The panel must be `box-sizing: border-box`; the overhang arithmetic and the glass
measurement account live with the rule in `css/sidemenu.css`.

**Tile grid (S4).** Tokens-only surface: the tile box itself is card-tier (see Card-Flyout
below), and its labels (`.machinoText`, `.dropdown-content a`) consume the `--dz-menu-text`
alias rather than referencing `--dz-body-text` directly.

### Watch-Only: Sub-Tabs (S6)

Sub-tabs / nav-tabs are a settled family, deliberately outside the `--dz-menu-*` token set. Their
existing recipe, documented under [Navigation](#navigation), a `2px solid var(--dz-accent-color)`
bottom border on active/hover with no background change, is the one the unified accent-edge
language was built to match, not the other way around: the top navbar's own underline (see Unified
Accent-Edge above) reuses this recipe verbatim rather than defining a second one.

### Card-Flyout: Tokens Only

The card 3-dot options flyout (S7, `.options`, `css/cards.css`) is
tokens-only: geometry stays a cards concern. It consumes exactly
one family token, `--dz-menu-bg`, for its background (the flyout is a
menu surface, not a card surface), and keeps every other property on its own card-chrome tier,
deliberately not migrated onto the equivalent `--dz-menu-*` token: `--dz-card-radius-chrome`
(5px, not the family's 6px) for its corner radius, and `--dz-elev-overlay` (not the family's
`--dz-elev-popup`, which composes `--dz-menu-shadow`) for its shadow. The two tiers happen to
differ (5px vs 6px, overlay vs popup elevation) and that difference is intentional, not an
oversight.

A second, easily-confused surface is explicitly NOT part of the menu family at all: the settings
tile grid's own nested sub-menu (`.dropdown-content`, built by `js/settings_page.js` inside a
grouped tile). Its real surface tokens are the card tier (`--dz-widget-bg` / `--dz-card-radius` /
`--dz-elev-card`), not `--dz-menu-*`; only its two text-colour rules (`.machinoText`,
`.dropdown-content a`) alias onto `--dz-menu-text`, since label text is genuinely shared family
vocabulary even where the box around it is not. **Constraint.** `css/cards.css`'s shared
`.rectangle-8` rule always wins this element's surface properties outright, so any same-property
declaration in `css/settings.css` would be dead on arrival; the cascade account lives beside the
rules in `css/settings.css`.

The sub-menu's row hover was previously an unmatched exception (a hardcoded `rgba(0,0,0,0.5)`,
unreadable on dark schemes). It is now resolved by mirroring the device card 3-dot menu
(`.options .btnsmall`, `css/cards.css`), the closest sibling: rows rest on `--secondary-text-color`
and, on hover, go to `--dz-accent-color` over the family tint `--dz-menu-item-hover-bg`. The rows
are full-width and padded (`--dz-btn-pad-md`) with the container carrying vertical-only padding, so
the hover band paints the whole row like every other menu, and the link underline is dropped.

### The Menu Contract (enforcement)

**`scripts/check-menus.sh`** (static, scoped to `css/nav.css`, `css/sidemenu.css`,
`css/settings.css`): three rules, mirroring `check-shadows.sh`/`check-typography.sh`'s own
per-declaration assembly technique so a value wrapped across physical lines can't bypass the
check. (a) No raw hex or `rgb()`/`rgba()` colour literal on any background/color/border-color
property, unless marked `dz-menu-exception` with its own justification comment. (b) Every
`box-shadow` layer references a `var(--dz-` token. (c) `font-size`/`font-weight` only from the
type-scale tokens. It is the fourth static checker (after typography, buttons, shadows), wired into
`scripts/build-release.sh` alongside the other three.

## Mobile Layout

Mobile layout (`css/floorplan.css`, `css/dashboard_mobile.css`,
`css/cards.css`, `css/dynamic-dashboard.css`, `css/tables.css`, `src/js/floorplan-stage.js`)
rests on one boundary (979px), one form pattern (wrap with a gap), a set of viewport-fit pages,
and four Dash2 density rules. Together they guard against the classic mobile defects: controls
squashing into each other, the navbar scrolling out of reach, and content clipped past its
container.

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

Core's own `#holder { min-height: 100% }` has no awareness that the navbar just claimed 60px of
that 100%; `css/sidemenu.css` compensates with `min-height: calc(100% - 60px)` (see
[Viewport Fit](#viewport-fit) above). Every mobile-polish media query in this project keys off
the same pair of numbers, `@media (max-width: 979px)` paired with `@media (min-width: 980px)`
for the matching desktop-only rule, so a page's mobile and desktop treatment never straddle a
gap or an overlap at the boundary.

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
horizontal: core switches plans by scrolling the DOCUMENT sideways, which drags the in-flow
mobile navbar off-screen mid-navigation. **Constraint.** `window.scrollTo` cannot be retargeted
from CSS alone, so the fix pairs `css/floorplan.css` (the stage becomes the scroll box, gated
on `body.machinon-fp-stage`) with `src/js/floorplan-stage.js`, fail-closed in both directions;
the mechanism, gate conditions, and wrapper shape live in that module's header comment.

### The Wrap-With-Gap Form Pattern

Several of core's forms render as rigid multi-cell tables or fixed-width flex rows with zero
inter-control gap: fine at desktop width, but the row has nowhere to go at 360px, so buttons
collide or wrap with a sub-2px seam between them (a "squash"). The fix is the same recipe
everywhere it appears: `display: flex; flex-wrap: wrap; gap: 8px` on the row, plus `display:
contents` on whatever rigid wrapper core puts between the row and its buttons (a `<td>` in a
table, an `ng-repeat`'s `<span>`), so that wrapper stops taking part in layout and its children
become direct flex items sharing the gap.

The exemplar is `#updelclr` (the Timers Update/Delete/Clear row, `css/dashboard_mobile.css`):

```css
@media (max-width: 979px) {
    #updelclr, #updelclr tbody, #updelclr tr {
        display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
    }
    #updelclr td { display: contents; }
}
```

The same recipe is reused, unchanged in shape, at the other collision sites (Events file-header
form, HVAC/Scene selector row), and further sites reuse the plain `gap: 8px` /
`margin-bottom: 8px` half of the pattern where the layout is a simple stack rather than a
collision. Every pattern site lands on the existing `{spacing.xs}` cluster value (8px), not a
new number; these sites are the first candidates to move onto a `--dz-gap` custom property once
the spacing-token migration in [Spacing](#spacing) lands.

### Dash2 Card Density

Four density rules fit the Machinon device card, and its widgets, into the Dynamic Dashboard's
fixed-height GridStack cell:

1. **Stretch to the cell.** The card's grid rows compress into the cell's definite height
   instead of rendering at natural height and being clipped. Scoped to `.dd-widget--dz-device`
   only: scene widgets and the `dz-favorites` widget's scrolling re-render of the same card
   markup both keep their natural, uncompressed height (`css/cards.css`).
2. **The h:2 floor.** Core fixes the minimum cell at 120px with no theme hook; a two-line name
   clamp keeps a long device name from growing the card past that floor, with the full name
   still reachable via the hover tooltip and `title` attribute.
3. **The h:3+ scroll-cap release.** A multi-level selector (HVAC mode, Scene) scrolls inside its
   own `#status` cell at h:2; a height-gated container query releases the cap from h:3 up, so
   resizing the widget is what reveals the rest of the selector. The h:2 cutoff itself is an
   accepted exception to the no-cutoff rule (see the Contract below). **Constraint.** Every
   alternative layout was measured and rejected at h:2; the measurements live with the rules in
   `css/cards.css`.
4. **Width-aware slider placement.** The blinds slider's multi-icon track defaults to a bottom
   strip (the safe fallback, and what an unsupported browser degrades to), and a
   `@container (min-width: 200px)` / `(min-width: 220px)` pair moves it beside the icons once
   the tile is wide enough (double-icon / triple-icon variants; `css/cards.css`).

The Quick Stats widget also gets a compact single-column row list under
`@container (max-width: 340px)`, and `css/dynamic-dashboard.css` counters a stray Bootstrap 2
caret-margin rule on the Dash2 toolbar dropdowns; both accounts live as comments in
`css/dynamic-dashboard.css`.

### The Mobile Layout Contract

The rules every route must hold at a phone viewport (360x780):

1. **No control overlap or squash.** No two visible interactive elements' bounding boxes may
   intersect more than 4px in both axes (ancestor/descendant pairs, an icon
   inside its own button, are excluded), and column-aligned controls in the same cluster need at
   least 2px of vertical gap - the `#updelclr` class of bug the wrap-with-gap
   pattern above fixes.
2. **No chrome occlusion or menu-scroll-away.** No fixed/absolute element may cover more than
   30% of the navbar's box. On a route whose navbar is not
   fixed/sticky (the mobile in-flow navbar, see the 979px boundary above), horizontal page
   overflow must never be able to scroll the navbar out of the
   viewport - the class of bug the Floorplans stage containment exists to prevent.
3. **Viewport.** Document `scrollWidth` stays within 360px (+4px tolerance); no visible element's
   clip-aware edge draws outside the `[-10, 370]` band (the
   off-canvas side menu is excluded, since it is clipped, not stray).
4. **Dash2 card cutoff** (the Dynamic Dashboard, which renders its desktop layout on mobile). No
   icon, toggle, or button may exceed its `.dd-widget`'s clip rect by more than 2px, and text must
   not overflow without an ellipsis - the Quick Stats overflow class the density rules above
   address.
5. **Touch targets.** Interactive elements should not fall under 24x24 CSS px; advisory, not a
   hard floor, pending a future spacing-scale project.

Two accepted exceptions to these rules stand:

- The HVAC 5-level selector cutoff at h:2 (see Dash2 Card Density above).
- The Setup mobile CTA bar (`css/settings.css`, a `position: fixed` Apply/Save bar) transiently
  overlapping in-flow settings content; not a rigid-table squash, so flex/gap cannot resolve it,
  and the fixed-CTA positioning strategy itself is a parked decision.

## Components

### Device Cards

Cards render across **three markup contexts sharing one visual language**: classic dashboard
rows (`#holder .row`), the Dynamic Dashboard (`.dd-widget-body`, core's own name for the
GridStack board - never call it "Dash2" in code or docs, see `css/cards.css`'s header comment),
and the mobile dashboard (`table.mobileitem`, `body.dashMobile`). All three consume one **66-token**
`--dz-card-*` / `--dz-mobile-card-*` family in `dz-tokens.css`: a 7-step spacing scale, 4 radius
properties across 3 conceptual tiers, and ~55 per-site structural values. Card surface: `var(--dz-widget-bg)`
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

This is settled architecture: both contexts render the exact same widget-template markup, so
an anatomy change written into the shared rule lands in both by construction. Where the two
must genuinely diverge (the hover ring, the Dynamic Dashboard's height-compression grid), a
second, narrowly scoped rule follows the shared one; `css/cards.css` names the core constraint
forcing each split.

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

**Dynamic Dashboard tiles under 200px** reassign row 1 and row 3 (container query on the widget
body): the name spans the whole first row and the value moves to the third, which is free because
Dash2 hides last-seen by default. Sharing row 1 does not survive that width, since the value keeps
its min-content width and its right justification puts the surplus over the name. The value steps to
`--dz-text-md` and the name row gives up the top padding it only needed beside a larger value, so no
card grows: the tallest measures 124px against 125px before, and short-named cards drop to 98px.
When `dashboard_show_last_update` is on, that feature's own CSS returns the value to row 1, because
the third row then carries the timestamp.

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
stay crisp and never resize the row.

**Bar-ranges gauge**: core renders its `<dz-bar>` threshold gauge inside the last-update cell;
the theme repositions it as a `--dz-card-bar-height` (4px) full-bleed status edge along the card
top (top corners follow the card radius). Core's inline placement would overflow the 20px bottom
row. Track color comes from `--dz-bar-track-bg` (0.2 neutral grey, both schemes). Applies to
classic pages and the standard dashboard; on the Dynamic Dashboard the gauge stays hidden with its
host cell.

**Dynamic Dashboard card**: the same card, mounted in a GridStack cell core fixes at a 120px
minimum with no theme hook, which the tallest card needs entirely. **Constraint.** The card
keeps its natural height (never `height: 100%`), the row gap tightens to a literal `4px` (see
Traps), no padding may be reserved around the card (which is why the hover ring is inset, see
States), and core clips every card cell, shaving any icon that overhangs its `td`. The measured
heights and the full derivation live with the tile-fit rules in `css/cards.css`.

**Mobile card (`table.mobileitem`, the third context).** This
is a genuinely different widget template, not a scaled-down `.item` card. It carries no `.item`
class, no `#bigtext`, and no separate `#type`/`#lastupdate` cells - the whole status/value string
lives in one `<td id="status">`. Its rows are `display: flex` inside an outer element that stays
`display: table` (`css/dashboard_mobile.css`), which is exactly why it gets its own
`--dz-mobile-card-*` token namespace rather than folding into `--dz-card-*`: the values genuinely
differ site-by-site (e.g. `14px` name line-height here vs. `18px` on desktop), and the two contexts
don't even share a layout algorithm. Two mobile-specific behaviors:

- **Arrow-badge scoping.** The round name badge (`--dz-mobile-card-name-badge-size`, 18px) and
  its `::after` arrow glyph mark exactly one thing: the row-level "view log" link on
  Temperature/Weather/Utility rows. **Constraint.** The arrow arm must exclude the section
  banner's `th a`; see `css/dashboard_mobile.css`.
- **Nowrap mitigation.** **Constraint.** Core's inline `white-space: nowrap` on the Temperature
  status cell is overridden to keep the table inside its container; the failure chain lives
  with the rule in `css/dashboard_mobile.css`. Drop the override once core removes the inline
  nowrap, not before.

#### Tokens

All tokens live in `dz-tokens.css`; none are mirrored in
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

Tooltip (4px) and slider (3px) do not share a value, so the "fine" tier stays two named
properties rather than being forced onto one shared property, which would silently change one
of the two. The card/button radius split (cards 6px, buttons 10px) is deliberate; see the tier
comments in `dz-tokens.css`.

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
| `--dz-card-value-line-height` | 24px | `#bigtext` line-height. DERIVED: the measured glyph box of `--dz-text-lg` in Inter (16->19, 18->22, 20->24, 22->26); a line-height below the font size makes the text overrun its own line box. Re-derive whenever the value size changes |
| `--dz-card-bar-height` | 4px | Bar-ranges gauge height |
| `--dz-card-lastupdate-pad-right` | 50px | `#lastupdate` right padding (wider than the 20px family below - verified, not a typo) |
| `--dz-card-meta-line-height` | 14px | `#type`/`#lastupdate` line-height; see Text Hierarchy |
| `--dz-card-status-max-height` | 60px | `#status` scroll cap |
| `--dz-card-scrollbar-size` | 4px | `#status` scrollbar width/height |

**Options flyout / favorite / Log-Timer icon** (5 tokens):

| Token | Value | Notes |
|-------|-------|-------|
| `--dz-card-options-offset` | 5px | 3-dot flyout right offset |
| `--dz-card-options-top` | 8px | 3-dot flyout top offset |
| `--dz-card-options-min-width` | 120px | 3-dot flyout min width |
| `--dz-card-favorite-line-height` | 16px | Favorite star and Log/Timer icon line-height (shared value) |
| `--dz-card-icon-accent` | `var(--dz-accent-color)` light and dark | Log/Timer icon color; see Log/Timer Icon Accent |

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

**Quiet status.** A dense card carries one full-emphasis anchor, not three. `#name` and `#status`
must never share one weight rule - that would put two full-weight, full-contrast text blocks on
every card before `#bigtext` (the largest element on the card, 20px, accent-colored) adds a third:

```css
/* custom.css */
.item #name {                     /* in the semibold heading/emphasis list */
    font-weight: var(--dz-weight-semibold) !important;
}
.item #status {                   /* its own rule, deliberately regular */
    font-weight: var(--dz-weight-regular) !important;
}
```

paired with the metadata line-height tighten (`--dz-card-meta-line-height`, 14px, one step below
the browser's unset `normal`) on `.item #type`/`.item #lastupdate` in `css/cards.css`. `#name`
is the card's one anchor by repetition and full contrast; `#bigtext` reads large and
accent-colored, its `font-weight` computed `400` by absence, not an explicit declaration (a
future pass could make that explicit and token-driven).
`#status` keeps its color (`var(--dz-body-text)`); only its weight is quiet. `#type`/`#lastupdate`
are quiet by construction: secondary color, regular weight.

**Mobile is structurally unaffected**: `table.mobileitem` shares none of the desktop card's
markup, so the split above cannot leak there. Mobile's bold status text (its own rule in
`css/dashboard_mobile.css`) is a deliberate scope decision, not an oversight, and stands as a
one-line follow-up if mobile should later be brought in line.

#### States

- **Card hover (classic)**: `--dz-ring-hover`, composing the resting `--dz-elev-card` shadow with
  the accent ring so a hover rule can never delete the drop shadow (`box-shadow` is a single
  property - see Traps). Full token definitions: [Elevation](#elevation) > Accent Rings.
- **Card hover (Dynamic Dashboard)**: `--dz-ring-hover-inset`, a settled decision.
  **Constraint.** On the Dynamic Dashboard, core clips the card cell, so the hover ring is
  drawn inset there instead of outside the card edge; the full clip geometry and the
  asymmetric-collapse rationale live with the rules in `css/cards.css`. Revisit an outer look
  only by making the card shorter on every widget type (a density change), not by changing
  which ring token is used.
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

The Log/Timer icon pair (`.timers_log .btnsmall`/`.btnsmall-sel`) is accent-colored.
**Constraint.** The color declaration in `css/cards.css` must carry its own `!important` to beat
the ghost-family color rule in `css/buttons.css`; the cascade account lives with the rule in
`css/cards.css`.

**Token**: `--dz-card-icon-accent` (`dz-tokens.css`) = `var(--dz-accent-color)` in both schemes.
Contrast is judged against **WCAG SC 1.4.11 (Non-text Contrast, 3:1)**, not SC 1.4.3's 4.5:1
text threshold: these are graphical Ionicon glyphs with no text label. Both schemes clear 3:1
resting and hovered, so `dark.css` needs no derived override; the measurements live with the
rule in `css/cards.css`.

#### Selector Levels

Multi-level Selector-switch devices (SelectorStyle-0: HVAC Mode, Scene Selector, any device with
2+ named levels) render their level buttons as ONE joined segmented control, reusing the theme's
own already-shipped connected-toolbar family (`css/buttons.css`, the same mechanism visible today
on the Events page's Disabled/Enabled toggle) rather than a bespoke mechanism. Desktop: `.item
.btn-group:not(.span3 *)` (`css/cards.css`), covering the classic list (`#/LightSwitches`), the
classic Dashboard, and the Dynamic Dashboard tile - `.btn-group` is SelectorStyle-0's sole emitter
inside a card, so one rule set serves all three. Mobile: `table.mobileitem td#status > span:has(>
span > .btn-mini)` (`css/dashboard_mobile.css`), adapted for core's `span > span > .btn-mini`
markup shape.

**Look.** Accent-bordered ghost segments (`.btn-default`: `background: transparent`,
`border-color: var(--dz-accent-color)`), collapsed 1px seams (`margin: 0 0 0 -1px !important`, the
family's existing seam-collapse trick), family radius only at the group's true first/last child
(`var(--dz-btn-radius)`, 10px - interior buttons stay square), the existing `toggle-selected` fill left
untouched (`.btn-selected` desktop, `.btn-info` mobile, both already `--dz-btn-toggle-selected-bg/-text`
or the equivalent accent tokens). Wrapped segments keep their natural content width, no `flex-grow`
stretch, so a lone wrapped segment reads as a small connected segment rather than "a large base
button".

**Wrap behavior.** `flex-wrap: wrap`; a wrapped row anchors flush against the row above (`gap: 0`)
and right-aligned to the group's own edge (`justify-content: flex-end`, `margin-left: auto` on the
shell) - reads as one continuous connected shape (a stair-step silhouette) rather than two stacked
mini-toolbars. A small-gap "separate toolbar run" look is rejected by design: at real viewing size
it reads as two distinct controls, undermining the reason this control exists (one control, never
a ragged disconnected wrap).

**Constraints** (each full account lives with its rules in the named file):

- **Wrap corners.** No CSS selector knows the corners of whichever rows a wrap produces, so
  `src/js/devices.js` (`retagSelectorWrapCorners`) tags the stair-step silhouette's true convex
  corners and `css/cards.css` rounds exactly those, fail-closed: an untagged button falls back
  to the existing corner CSS, never to a rounded outline around empty space. The shell clip is
  only a safety net, not the fix. A decorative `::after` overlay tracing the shell's own
  bounding box is not a substitute: it paints exactly the empty-space outline this fail-closed
  design avoids.
- **Selected hover.** Core's ghost-hover wash would replace a selected segment's solid fill;
  `css/cards.css` re-declares the selected-hover state at winning specificity, darkening the
  fill via the family's filled-button hover derivation.
- **Inset focus ring.** Every segment uses `--dz-btn-focus-ring-inset` uniformly, since the
  shell clip amputates the outward ring on a wrapped interior segment and which segment lands
  there depends on the device's own level count and labels; see `css/cards.css`.
- **Wrapped-row junction.** The vertical row-to-row seam stays ~2px; a structural flex-wrap
  limit, visually marginal, listed under [Gaps](#gaps) and disclosed with the rule in
  `css/cards.css`.

**Compact exception.** The Compact Dashboard (`DashboardType=1`, `.span3` tiles) is permanently
excluded (`:not(.span3 *)` scoping throughout both files): its fixed ~50px-tall card has no room for a
multi-row wrap at all, so it keeps its own pre-existing, deliberate vertical scroll-snap list
(`height`, `overflow-y: auto`, `scroll-snap-type: y mandatory`, `css/compact.css`) instead of joining
this mechanism. See [Compact Dashboard Grid](#compact-dashboard-grid).

**Accepted exception.** The Dynamic Dashboard's h:2 GridStack cell still cannot fit a 5-level
selector without scrolling (see [Dash2 Card Density](#dash2-card-density) > point 3). This is a
vertical-space constraint (how many rows N segments need at a given width, versus the ~66px a h:2
cell leaves), independent of whether the segments render as separate pills or one connected run.
Relatedly, a connected control's collapsed seams are structurally exempt from the mobile squash
rule (see [The Mobile Layout Contract](#the-mobile-layout-contract)): the group is one unit, not
two independent controls.

#### Traps

Load-bearing quirks a future edit could break without realizing it; each full account lives
beside its rule in the named file:

- **The Dynamic Dashboard card is deliberately not stretched to its cell.** `height: 100%`
  compresses the card's own grid rows and squeezes the switch pill and icons; the cell is
  already guaranteed at least the tallest natural card height. See the tile-fit note in
  `css/cards.css`.
- **`:has(.item)` scopes every card-grid rule to rows that actually hold device cards.** The
  plain Bootstrap `.row` class is reused by unrelated Angular views; browsers without `:has()`
  fall back to plain float layout (functional, no card grid), not breakage. See `css/cards.css`.
- **Matched reset+override pairs travel together.** The Bootstrap-span wrapper reset and the
  card's own `box-sizing: border-box` are two halves of one contract; editing one half silently
  breaks the pairing. See the card box contract at the top of `css/cards.css`.
- **`box-shadow` is a single property.** A hover or status rule that lists only a ring or glow
  deletes the resting `--dz-elev-card` shadow outright; every card-hover/status rule composes
  the resting shadow into its token (`--dz-ring-hover`) or restates it alongside the new layer.
  See [Elevation](#elevation) > The Shadow Contract for the enforcement gate
  (`scripts/check-shadows.sh`).
- **A handful of geometric values are kept verbatim because their purpose is unconfirmed.**
  `--dz-card-fill-width` (99%), `--dz-mobile-card-slider-handle-offset` (-6px vs desktop's
  -5px), and `--dz-mobile-card-selectorlevels-margin` (-30px) each carry a drift flag beside
  their value in `dz-tokens.css`; grep for consumers before removing anything.
- **`.span3 #status` is accent-colored while classic `#status` is body-text colored**: an open,
  unresolved question (deliberate compact-tile emphasis, or drift), flagged beside the rule in
  `css/compact.css`.
- **The camera section loads late.** `#dashCameras` is injected outside the Angular digest, so
  any geometry measurement or screenshot of a dashboard with cameras must poll for it present
  in the DOM AND height-stable across two consecutive polls before capturing. **Constraint.**
  The injection and its digest-bypass account live in `js/dashboard_camera.js`.
- **Two grid-gap values stay untokenized.** The classic 10px card-grid gap and the Dynamic
  Dashboard's 4px tightened gap stay literal in `css/cards.css`: 4px is not a step on the
  card-space scale, so the pair cannot be tokenized symmetrically without an off-scale token or
  a value change. Refine candidates for a future density decision.

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
| Off | `rgba(var(--dz-accent-values), 0.2)` | `var(--secondary-text-color)` | `var(--dz-elev-card)` |
| On | `rgba(var(--dz-accent-values), 0.5)` | `var(--dz-accent-color)` | same |

Handle translates `34px` right on toggle, `0.4s` transition.

### Navigation

**Top navbar**: `var(--dz-nav-bg)` background with `--dz-elev-popup` shadow. Links distributed via `display: flex; justify-content: space-around`. Link style: Inter semibold (`{typography.semibold}`), `{typography.sm}`, `var(--dz-body-text)`, `{rounded.interactive}` radius.

- **Active page**: no fill. A `2px solid var(--dz-accent-color)` bottom border (accent text), the same recipe Sub-tabs / Nav-tabs use below, reused verbatim rather than a second underline mechanism.
- **Dropdown hover**: `--dz-menu-item-hover-bg` (accent, 0.15 alpha)
- **Dropdown menu**: `--dz-menu-bg` background, `--dz-menu-radius` radius, `--dz-menu-shadow` shadow

This bar and every dropdown/flyout beneath it belong to one shared token family; see
[Menus](#menus) for the full token set, the current-item accent-edge language (underline here,
a left edge on vertical surfaces like the dropdowns), per-surface anatomy, and the enforcement
contract.

**Sub-tabs / Nav-tabs**: underline style. Inactive: transparent bottom border. Active/hover: `2px solid var(--dz-accent-color)` bottom border, blue text color. No background change. Watch-only: a settled recipe; see [Menus > Watch-Only](#watch-only-sub-tabs-s6).

**Mobile hamburger** (max-width: 979px): fixed-position 25x25px toggle. Three 4px bars animate to X via `rotate(135deg)` / `rotate(-135deg)` transforms, `0.2s ease-in-out`. Gets blue background pill with `{rounded.container}` bottom corners after 50px scroll. The open-state ("X") bars read `var(--dz-body-text)`, not the closed hamburger's own `#fff`, because the mobile flyout panel behind them is opaque; see [Menus](#menus).

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

- Track: `--dz-card-slider-track-bg`, 5px height, `{rounded.sm}` radius
- Range fill: `rgba(var(--dz-accent-values), 0.5)`
- Handle: 15px circle, solid `var(--dz-accent-color)`, positioned -5px top
- Width: `calc(100% - 100px)` (start point fixed relative to the card, so it never crosses the device icon), 55% on wide screens (1200px+)
- Blinds cards (any card with a second icon cell): track anchored on BOTH edges instead of a fixed width, so it can never overlap the blind icons at any card width. **Constraint.** The anchoring derivation and the Dynamic Dashboard's zeroed-margin variant live with the blinds rules in `css/cards.css`.

### Color Popup (feature: `rgbw_popup`)

Machinon-owned popup replacing core's cursor-anchored RGBW picker; core's
`#rgbw_popup` stays untouched as the delegate path (rel dimmers, drift guard, feature
off). Custom w/ww subtypes (RGBWZ, RGBWWZ) also open the Machinon popup, on the same
Color/White tabs as RGBW/RGBWW; their Color pane also grows a white-mix slider (core's
m:4 mode, see below). `js/rgbw-popup.js` + `css/rgbw-popup.css`, feature id 45.

- Shell: `--dz-widget-bg`, `{rounded.container}`, `--dz-elev-overlay`, `max-height: 90vh`.
- Placement adheres to the center_popups setting: anchored near the clicked card (no scrim,
  self-clamped, non-modal like setpoint) on desktop by default; centered + scrim when
  center_popups is on; always centered + scrim at or below the 979px mobile boundary.
  Centered mode uses the center_popups idiom (left/right 0 + auto inline margins).
- Title: `{typography.sm}` + `--dz-weight-semibold`, sentence case - the codified
  dialog-title language (no uppercase tracking anywhere in the theme).
- Close control (codified here as the dialog-close language): an icon-quiet family
  button (`.mk-rgbw-close`, own class, not `.btn-icon` itself) holding a 16px
  `ion-md-close` Ionicon; transparent, no border, `--dz-btn-icon-box` hit-box, the
  same tonal glyph hover filter as `.btn-icon`, `--dz-btn-focus-ring` focus.
  `.ui-close` remains the legacy cursor-popup close (setpoint, core's own
  `rgbw_popup`); this popup does not use it.
- Tabs: the flat underlined sub-tab idiom, text-only.
- Sliders: card dimmer-slider language on native range inputs. Brightness has no end
  labels (owner revision: nothing else in the theme labels slider ends); the live value
  readout (`{typography.sm}` `--dz-weight-semibold` `--dz-accent-color`) in a fixed-width
  slot carries the scale on its own, and does not jitter while dragging. Warmth's track is
  a fixed cool-to-warm gradient (physical color temperature, not a scheme color).
- White-mix slider (bHasCustom subtypes only, RGBWZ/RGBWWZ): on the Color pane under the
  wheel, gated on the same capability core uses for its customw/customww modes. Track is a
  live gradient from the currently picked color to white (repainted on every wheel drag and
  hex edit), the same fixed-literal-track idiom as the warmth slider. Mix 0 keeps sending
  plain `m:3`; mix above 0 sends `m:4` with core's own formulas (`cw`/`ww` split evenly for
  RGBWZ, split by warmth for RGBWWZ). Seeded from an existing `m:4` state's `(cw+ww)/255` so
  an already-mixed device opens showing its mix, not a reset one. On temperature-capable
  subtypes (RGBWWZ) the mixed-in white's tint follows the White tab's own warmth slider;
  the mix slider only sets how much white is blended in, not its color.
- 2D picker cursor (codified here): 15px circle at slider-handle scale, filled with the
  picked color, 2px `--dz-widget-bg` ring.
- Presets: On/Off, both plain ghost family (owner call: Off is not destructive).
- Sends: live, page-global `SetColValue`, 400ms deadline rate-limit (never a resettable
  debounce). Payloads mirror core's `getJSONColor` exactly.

### Theme Wizard

The "Create a theme" wizard (`src/js/theme-wizard.js` + `css/theme-wizard.css`) is a 3-step
dialog - Colours, Look, Name - over the pure generator documented under [Theme Wizard: Generated
Scheme Pairs](#theme-wizard-generated-scheme-pairs) in Colors. It owns DOM, state and persistence;
nothing outside the dialog is mutated until Save, so Cancel is free at every step and needs no
restore path (the alternative, repainting the real UI live, means judging colours through the 50%
scrim plus a restore path that has to survive Escape, backdrop click, route change and a
mid-wizard reload).

Assembled entirely from the house vocabulary, deliberately not its own: a user should not be able
to tell this dialog was added later.

- Shell: the Color Popup shell language above (`--dz-elev-overlay`, `{rounded.container}`), the
  center_popups centring idiom (`top`/`left`/`right` + auto inline margins + `translateY(-50%)`,
  not `left:50%` + a 2D translate), `box-sizing: border-box` with the same phone-overflow reason
  as `#mk-rgbw-popup`, `max-width: calc(100vw - 20px)`.
- Reuses `#mk-rgbw-scrim`, the codified [Modal Scrim](#modal-scrim), rather than introducing a
  second one. **Constraint.** The dialog's `z-index` is `2001`, one above the shared scrim's
  `2000` - anything below 2000 renders BEHIND the dim it sits on.
- Title/close: the codified dialog-title and dialog-close languages (`{typography.sm}` +
  semibold sentence case; an icon-quiet `ion-md-close` button, not `.btn-icon` itself).
- Step strip: the flat underlined sub-tab idiom (`.dz-hub-tab`), with the active step's accent
  carried on both the underline and the label. **Deliberately INERT** - `cursor: default`, no
  click handler - because Back is the dialog's only navigation and forward-jumping past an
  unfinished step is invalid (Step 3 needs a name); `aria-current="step"` carries the affordance
  a clickable tab would otherwise imply.
- Look tiles: the `.scheme-card` idiom (border, `--dz-card-border-width`, `--dz-card-radius`,
  hover, `--dz-ring-accent` on the selected tile - correct here since a look tile has no resting
  card shadow of its own for a ring to compete with).
- Buttons: `.btn-primary` (Save/Next) / `.btn-default` (Cancel/Back), the Filled-primary and
  Ghost families used everywhere else.
- Sizing: the dvh-with-vh-fallback rule below.

**Shared colour field** (`dzBuildColorField`, `src/js/theme-hub.js`) - one factory used by BOTH
this wizard's colour fields and the Theme Hub's 7-swatch custom-colour editor (swatch order and
list documented under [Colors](#colors) above). Renders the existing
`.dz-hub-swatch` (native `<input type="color">`, unchanged markup/classes) plus a wheel-picker
toggle button and a hex text field. The native input is KEPT, not replaced: it is the
keyboard-accessible path and is genuinely good on desktop and Chrome Android. It was joined by a
wheel and hex field because Firefox on Android renders `<input type="color">` as a coarse
seven-band palette, which guts a feature whose entire premise is picking a colour - a
pre-existing limitation that hit the manual editor too, not something the wizard introduced.

Only ONE wheel/hex disclosure exists for the whole page (`DZ_COLOR_FIELD_DISCLOSURE`), moved to
sit after whichever field is open (`field.anchor.insertAdjacentElement("afterend", ...)`) and
rebuilt from scratch on every open, rather than one permanently attached under every swatch.
**Constraint, and the reason for the one-panel design:** `src/js/color-wheel.js`'s
`dzAttachColorWheel` assigns its drag state (`activeCanvas`, `dragging`, `activeOnPick`) to
MODULE-SCOPE singletons at attach time, not per-canvas, so a second concurrently-attached wheel
would silently steal the drag gesture from the first. A wheel permanently attached under every one
of the hub's seven swatches (or even both of the wizard's two fields) would therefore ship a
visibly broken first wheel; a single shared, move-and-rebuild disclosure sidesteps the singleton
rather than fighting it, and is better on phones anyway (a full wheel under every swatch would not
fit at 360px). `onChange` fires once per COMPLETED pick - the native input's own change/input
event, a wheel drag's release, or a valid hex entry - never continuously during a drag, mirroring
the Color Popup's schedule-during-drag/flush-on-release contract, so a caller that persists on
every call (the hub writes to the server on every change) is never hammered.

**Constraint, cross-feature hazard closed in review:** leaving a field's disclosure open and then
opening the Color Popup elsewhere re-attaches the SAME module singletons to the popup's own
canvas; without a fix, dragging the still-open disclosure afterward would drive the popup's
`handlePick`/`flushSend` instead - a real light on the user's wall reacting to an unrelated screen.
Closed by reclaiming the singletons AT DRAG TIME (`dzReclaimColorWheel`, a listener registered
BEFORE the module's own `mousedown` handler), not by trying to close the disclosure on every
possible navigation path - enumerating those paths is exactly how the hazard was missed the first
time.

**`src/js/color-wheel.js`** - the wheel itself, extracted from `js/rgbw-popup.js` (feature-toggled,
feature id 45, may be switched off) so that this always-loaded consumer could use it without the
wizard or hub depending on toggleable code. **Constraint.** Its four `document` listeners
(mousemove/mouseup/touchmove/touchend, including a `{passive:false}` touchmove that would
otherwise kill the scroll fast path on mobile) are wired LAZILY, on the first `dzAttachColorWheel`
call, behind a `wired` flag - never at module load. The module itself loads on every page
regardless of feature 45 or whether a user ever opens a wheel; registering the listeners
unconditionally at load, harmless inside the feature-toggled file it was extracted from, becomes a
global side effect the moment the same code lives in an always-loaded file.

**dvh sizing rule.** `.dz-wizard`'s `top`/`max-height` are declared twice, `vh` then `dvh`
(an invalid-value cascade, not a media query: a browser without `dvh` support ignores the second
declaration and keeps the first) - the same technique already shipped for `css/settings.css`'s
`#settingscontent` (the Setup page's own tab-content height, predating the wizard). Plain `vh`
resolves against the LARGE viewport
(browser chrome hidden); Firefox Android keeps a bottom URL bar on screen, so a dialog centred and
capped with plain `vh` sizes and centres against a taller-than-visible area, and its footer -
`flex: none`, outside the body's own scroll region - can render below the real fold with no page
scroll available to bring it back. `dvh` tracks the actual visible ("small") viewport instead.
Confirmed on hardware (Galaxy S24, Firefox Android): the footer was unreachable before this fix.
`#mk-rgbw-popup` (`css/rgbw-popup.css`) carries the identical `vh`-then-`dvh` pair for consistency,
but its own defect was MEASURED rather than assumed to exist: at 360x780 its lowest control sits
~185px clear of the viewport bottom (vs. the wizard's ~72px), and the popup scrolls itself as a
whole rather than pinning a footer outside a scroll region, so it never actually reproduced the
cutoff - the `dvh` there is defense-in-depth, not a fix, and carries no CHANGELOG line of its own.

### Floorplan Device Popup

Clicking a device on a floorplan opens core's own SVG popup (`g.DeviceDetails`, drawn by
`www/js/domoticzdevices.js`), not an HTML card. The theme cannot restyle the popup by changing
its markup, so `css/floorplan.css` overrides SVG presentation attributes with ordinary
`fill`/`stroke` declarations. **Constraint.** A stylesheet declaration always beats a
same-property SVG presentation attribute, so most overrides need no `!important`; the per-rule
exceptions and their verifications live with the rules in `css/floorplan.css`.

**Collapsed chrome.** `rect.popup`/`rect.header` fill from `--dz-widget-bg`, text from
`--dz-body-text` (name semibold, status semibold and accent-colored). The slider matches the
card slider's LANGUAGE (flat, accent-filled, unstroked: `--dz-card-slider-track-bg` track,
`--dz-accent-color` fill) but keeps core's GEOMETRY, because the popup lives in the floorplan's
scaled SVG user-unit space, not px. Core's black drop-shadow rect is softened to `opacity:
0.12` to sit within the elevation language. **Constraint.** The header's explicit
`stroke: none` guarantee and the shadow-softening rationale live with the rules in
`css/floorplan.css`.

**Expanded state (opt-in).** Feature `floorplan_popup_details` (`theme.json` id 44, **default
off**) reveals core's own popup expander (`image#twisty`), which has shipped hidden and works
correctly once revealed; with the feature off, the popup keeps its collapsed-only behavior. The
expanded Log/Notifications action pills are themed on the primary button tokens
(`--dz-btn-primary-bg`/`--dz-btn-primary-text`). **Constraint.** The feature file loads after
`css/floorplan.css`, so source order, not `!important`, settles the override (see
`css/floorplan_popup_details.css`); the pills' flat DOM structure and the one required
`!important` on their labels are documented with the rules in `css/floorplan.css`.

**Remaining core rasters.** The slider knob (`images/handle.png`) and the expander chevron
(`images/expand16.png`) are core raster PNGs, which CSS cannot recolor the way it recolors an
SVG shape; replacement art is tracked upstream as issue #6959.

The surface's invariant, across light/dark x collapsed/expanded x feature off/on: no `url(#...)`
computed fill and no pure-black stroke may survive anywhere in the popup.

### Theme Hub

Every theme setting lives in one page, the **theme hub**
(`src/js/theme-hub.js`, `src/js/theme-manifest.js`, `src/js/theme-hub-previews.js`,
`css/theme-hub.css`). It is the sole settings surface: there is no injected Setup tab and no
standalone settings page.

**Routing.** With routes active (`window.dzRoutesActive`), `#/Theme` and `#/Theme/:tab` are
registered Angular routes rendering the hub inside core's own `ng-view`, the `:tab` segment
deep-linking straight to a manifest group (e.g. `#/Theme/colors`). **Constraint.** When the
route table cannot be reached, the hub falls back to the original click pseudo-route (hide
`#main-view`, show a sibling, restore on `hashchange`); the fallback anatomy, the
menu-insertion fail-closed rules, and the tile-grid feed live in `src/js/theme-hub.js` (header
comment) and `custom.js` (route table).

**Manifest-driven rendering.** `THEME_MANIFEST` (`src/js/theme-manifest.js`) is the single
declarative source of truth: nine ordered groups (General, Menus and navbar, Dashboard, Device
cards, Charts and log, Background and branding, Colors and schemes, Icon packs, About), 35
entries. Adding a setting is a manifest entry, not new markup: each entry declares its
`storageKey`, `control` (`toggle`/`number`/`text`/`select`/`custom`),
label/description/`appliesTo` tag, optional `previewId` and `parent`, and `reloadOnDisable`.
The full entry schema lives in the manifest's own header comment; the group/row build walk
lives in `src/js/theme-hub.js` (`dzBuildThemeHub`, `dzRenderGroupRows`).

**Underlined-tab group nav.** Group navigation mirrors the theme's existing flat-underline tab
language (`css/nav.css` `.nav-tabs`, reused a third time after the icon-pack tabs below): one
row of `<button>` tabs, the active one underlined in the accent color, one section visible at a
time. It is horizontal on BOTH desktop and mobile, not a sidebar or drawer: on narrow viewports
the bar scrolls horizontally INSIDE its own box (`overflow-x: auto`, a themed thin scrollbar)
instead of wrapping or widening the page, so opening the hub never triggers page-level
horizontal scroll at any width, and every one of the nine tabs stays reachable by scrolling the
bar itself.

**Instant apply.** Every setting change applies live and persists immediately; there is no Save
button. A `reloadOnDisable` row surfaces a disclosure note only once its live disable actually
needs a reload (an executed `.js` file cannot be un-executed); a CSS-only feature never shows
one, since disabling it just unloads a stylesheet live. **Constraint.** The per-setting applier
map (`DZ_HUB_APPLIERS`) and the persistence path live in `src/js/theme-hub.js` and the
`src/js/settings-transport.js` seam.

**Previews.** Each row's `.dz-hub-preview` box renders a mini illustrating the setting
(`src/js/theme-hub-previews.js`), one of two kinds: a LIVE TOKEN MINI built only from
`var(--dz-*)` references, so it recolors automatically when the scheme changes with no JS
re-render; or, for the three settings with no on-screen colour to mirror (`standby`,
`check_update`, `notification`), a scheme-neutral inline `<svg>` sketch in a fixed muted grey
that reads on both backgrounds, deliberately not a token
it has nothing to say about. A setting with neither a faithful mini nor a sensible sketch keeps
`previewId: null` and renders no preview; the row is still valid.

**Colors and icon packs, hosted.** The `scheme`/`custom_color_scheme`/`iconpacks` manifest
entries are `control:"custom"`: their mounts dispatch to the existing UI modules rather than
duplicating them: the scheme picker and 7-swatch custom-colour editor (`src/js/schemes.js`, see
[Colors](#colors) for the picker/persistence contract) into the Colors group, the installer
(`src/js/iconpack.js`) into the Icon packs group. **Constraint.** Both mounts render only once
the hub is attached to the live document; the reason lives in `src/js/theme-hub.js`
(`dzBuildThemeHub`).

**About and attribution.** The General tab carries a short intro (name, live version, one
line); the About tab (the last tab) carries the expansive version, a modernized
description, a Contributions block (Design: EdddieN; Code: davidlb, DewGew, landaisbenj,
Rouzax - every name linked to its GitHub profile, none highlighted), the repo/wiki links from
`theme.json`, and a required Icons8 attribution ("Icons by Icons8" linking `icons8.com`, the
free-tier license obligation). The version string is always read live from `theme.json`
(`dzHubVersionLabel()`), never a hardcoded copy.

**Maintenance and the device-image editor.** The About tab also hosts a Maintenance block:
three confirm-gated actions in the Filled-danger family -
reset to defaults, clear the browser cache, reset custom colours to the active scheme's
defaults - plus the per-device custom-icon editor (shown only while `icon_image` is enabled):
add/remove by device idx, persisted to the `custom` uservariable's icons slot, re-derived from
`getcustomiconset` on every action so it stays idempotent.

**Coverage.** Every `theme.features` key and every
seam-stored value must map to exactly one manifest entry (or a `control:"custom"` hosted
section); a key without a manifest home is a defect. The hub is subject to the
[Mobile Layout Contract](#the-mobile-layout-contract) like every other page, never exempted.

#### Settings storage

**Two-layer model.** Theme settings resolve through Domoticz core's native `ThemeSettings` API
(`ThemeSettingsAPI: 1`), read and written entirely through `src/js/settings-transport.js`. Two
server-side rows exist per theme: an **instance layer** (one shared row, the house defaults)
and a **per-user layer** (one row per logged-in identity), applied instance then user, so a
personal override always wins over the shared default for the keys it is allowed to touch.

**Scope rule.** Not every setting may live in the per-user layer. Every manifest entry and
every snapshot-only extra carries a scope of `"user"` or `"house"`. The rule, verbatim from the
manifest's own header comment:

> per-user = anything that only changes how your own browser renders; house = shared content,
> branding, infrastructure, and per-device data.

**Constraint.** A per-user write can structurally only carry `"user"`-scoped keys, so a house
key cannot be overridden per user even by a bug; the enforcement (`dzSnapshotSubset`) lives in
`src/js/settings-transport.js`.

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

**Promote and reset.** Three confirm-gated actions on the About tab's Maintenance block manage
the two layers directly, rendered only in native-API mode: **"Save my current preferences as
house defaults"** (admin with a personal layer) copies the admin's personal settings over the
house defaults; **"Reset my personal settings"** deletes the caller's personal row, falling
back to the house defaults; **"Reset the house defaults"** (admin) resets the shared row to
factory values, leaving other users' personal settings untouched. "Reset theme to defaults" is
mode-aware rather than mode-gated: it resets every native layer this identity can reach, then
clears the localStorage cache and reloads. **Constraint.** The visibility gating and the
promote no-op rationale live in `src/js/theme-hub.js`; the write paths in
`src/js/settings-transport.js`.

**PerUser-false collapse.** A shared, non-differentiated session (a core running `-nowwwpwd`,
or any core that resolves every request to the same identity) collapses the hub to the legacy
single-shared-settings behavior: one layer, no house chips, no locked rows, every row editable
by whoever can reach it. The detection and the single-layer write branch live in
`src/js/settings-transport.js` and `src/js/theme-hub.js`.

**Legacy fallback and seed-once migration.** **Constraint.** On a core without
`ThemeSettingsAPI: 1` (or a failed probe), every read/write routes through the original
uservariable transport; on a capable core, a one-time idempotent seed copies the three legacy
variables into the instance layer and leaves them in place, unchanged and frozen, so a core
rolled back to a version without the native API still boots from them exactly as before. The
probe, seed conditions, and idempotence account live in `src/js/settings-transport.js`.

**Reachability.** Two menu entries feed one hub (the Setup dropdown for admins, the Other
dropdown for logged-in non-admins, each hidden by core's own permission directives), so every
session that can reach the hub gets exactly one visible way in. `#/SetupMenu`, the routed
settings tile grid, is gated `permission: "Admin"` at the route table itself, so the admin-only
surface stays admin-only even reached by a direct URL. Insertion anchors and gating live in
`src/js/theme-hub.js` and `custom.js`.

**House chip and locked rows.** While per-user mode is active, a house-scope setting's row
carries a `.dz-hub-chip-house` pill next to its label: `--dz-text-micro` semibold, an
accent-colored 1px outline (rather than the accent-filled `.dz-hub-tag` it sits beside), the
same pill radius (`var(--dz-btn-radius)`), body-text color. A non-admin session additionally
gets `.dz-hub-row-locked` on the row (`opacity: 0.5`, pointer-events off, native `disabled`
set), so a house row is visibly distinct and provably inert for anyone who cannot write the
house layer. The same class locks every row after the first `no_identity` write failure,
paired with a one-time banner on the About tab; render conditions live in
`src/js/theme-hub.js`, the styles in `css/theme-hub.css`.

#### Icon Packs

The icon-pack installer (`src/js/iconpack.js`) lives in the hub's Icon packs group. It browses `iconpack/`, a generated artifact tree that is never hand-edited, and lets an admin install, update, or remove icons in the Domoticz `CustomImages` table without leaving the hub. A tabbed layout (Blue UI / Color / Fun) mirrors the hub's own underlined-tab idiom (`css/iconpack.css` `.iconpack-tabs`).

Card grid (`.iconpack-grid`, `auto-fill, minmax(150px, 1fr)`, 140px under 480px):

| Element | Size/Token | Note |
|---------|------------|------|
| Preview | 48x48px | Defaults to the On master; hover shows Off on desktop, tap toggles a sticky Off on touch |
| Name | `{typography.sm}` (14px), `font-weight: 600` | Weight (`--dz-weight-semibold`) on the ambient Inter family, not a separate bold face |
| Description | `{typography.micro}` (11px), 75% opacity | `min-height: 26px` keeps card heights aligned when a description is empty |
| Intro text / search input | `{typography.xs}` (12px) / `{typography.sm}` (14px) | |
| Counter | `{typography.xs}` (12px), 75% opacity | |
| "Installed" chip | `{typography.micro}` (11px) | `var(--dz-status-ok)` background, white text, top-right |

Actions row: `images/add.png` installs; it swaps to `images/machinon/refresh.png` only when the served art or metadata has actually drifted from the pack, never on a hunch. `images/remove.png` warns with the names of any devices currently assigned the icon, notes they will revert to their default icon, and is disabled when nothing is installed. State is never bookkept client-side: every action re-derives install status from the server before the grid repaints, so operations are idempotent and safe to retry. **Constraint.** The drift check (metadata first, then FNV-1a content signatures) and the re-derive path live in `src/js/iconpack.js`.

"Install / update all" acts on the visible set only: with a search filter active it relabels to "Install / update shown (N)" and installs/updates just the shown icons. **Constraint.** Every DB-writing operation is serialized (uploads chained, never parallel; a busy flag turns a second click mid-operation into a warning toast); the SQLite-contention rationale lives in `src/js/iconpack.js`.

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
| Wind direction | `wind_direction` | on | (none) | Points the wind arrow at where the wind is blowing TO instead of where it comes FROM. Core reports the meteorological origin (it reads met.no's `wind_from_direction` verbatim) and both core's compass art and the theme's default `images/Wind<DIR>.png` point at it; this swaps in `images/wind-direction/Wind<DIR>.png`, the same glyphs with the pointer moved to the opposite side and the compass label left upright. The two sets must never be the same art. |
| Custom colors | `custom_color_scheme` | off | (none) | Enables user-defined color overrides via settings UI. |
| Custom icons | `icon_image` | off | (none) | Per-device custom icon images from `theme.json` icons array. |
| Check update | `check_update` | on | `check_update.js` | Checks for Domoticz software updates. |
| Custom pages | `custom_page_menu` | on | `custom_page.js` | Adds custom page entries to navigation. |
| Settings menu | `custom_settings_menu` | on | `settings_page.js` | Renders the Setup menu as a tile grid instead of a plain dropdown list; the theme hub itself is always reachable from either. |
| Notifications | `notification` | on | (none) | Warning toasts (noty) when a sensor times out or reports a low battery. |
| Dashboard camera section | `dashboard_camera_section` | on | (none) | Renders the camera preview as its own dashboard section. Requires `dashboard_camera`. |
| Expandable floorplan popups | `floorplan_popup_details` | off | `floorplan_popup_details.css` | Reveals core's floorplan popup expander (`image#twisty`), showing Type, Log, Notifications and the favorite star. Hidden by default since 2019; see [Floorplan Device Popup](#floorplan-device-popup). |

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
file with no `@import` of its own; each extra nesting level serializes one more full network
round trip before its children even begin downloading. **Constraint.** The measured round-trip
account lives in the comment at the top of `custom.css`. The invariant caps the cost, it does
not remove it; `scripts/build-dist.sh` removes the request fan-out for real users by inlining
the whole `@import` chain into `dist/custom.css` (gitignored) so a release ships one flat file
while the source stays modular.

## Gaps

Where the code does not yet meet the intent stated above. Each is a debt marker: it names what
would have to change, not a reason to copy the current behaviour.

- `:focus-visible` styles now exist for every button family (see Buttons > States) plus a handful
  of specific spots (card device-icon images, the Setup Apply Settings button, `.modal-footer
  .btn`) and every top-level nav link (`.navbar-inverse .nav > li > a:focus-visible`,
  `css/nav.css`). The dropdown-menu items themselves (`.navbar .nav .dropdown-menu li a`,
  Setup/Other/Custom) still have no visible keyboard-focus ring.
- Disabled button contrast below WCAG AA: light theme `{colors.light-text-secondary}` on
  `{colors.light-disabled}`, and dark theme `{colors.dark-text-secondary}` on
  `{colors.dark-disabled}`, both fall below AA 4.5:1. WCAG exempts disabled controls, but
  readability would benefit from dedicated disabled text/background tokens.
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
- (Resolved 2026-08-16: the four declared-but-unconsumed tokens flagged here,
  `--dz-btn-danger-bg-alpha`, `--dz-btn-text-shadow` and the `--dz-nav-active-bg`/`-text` pair,
  were removed from `dz-tokens.css` in the dead-token cleanup pass.)
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
