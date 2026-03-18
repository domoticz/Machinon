# Machinon Theme Contract

> Authoritative spec for the Machinon Domoticz theme. All design tokens, usage rules, and implementation constraints in one place. When visual companion docs conflict with this document, this document wins.

## Design Tokens

### Colors — Light Theme

| Token | Value | WCAG | Usage |
|-------|-------|------|-------|
| `--main-blue-color` | `#097fae` | 4.5:1 AA | Primary accent, filled buttons, links |
| `--color-success` | `#3b863b` | 4.5:1 AA | Add, enable, confirm |
| `--color-warning` | `#b36200` | 4.5:1 AA | Edit, update, modify |
| `--color-error` | `#c43b3b` | 5.2:1 AA | Delete, reset, destructive |
| `--main-bg-color` | `#f1f1f1` | — | Page background |
| `--main-item-bg-color` | `#ffffff` | — | Card/surface background |
| `--main-navbar-bg-color` | `#ffffff` | — | Navbar background |
| `--main-text-color` | `#1a1a1a` | 17.4:1 AAA | Primary text |
| `--secondary-text-color` | `#6d6e6d` | 5.1:1 AA | Labels, metadata |
| `--main-border-color` | `#d3d3d3` | — | Borders, dividers |
| `--main-disabled-color` | `#d3d3d3` | — | Disabled states, odd table rows |

WCAG column = contrast ratio for white text on the color (filled button context).

### Colors — Dark Theme

| Token | Value | WCAG | Usage |
|-------|-------|------|-------|
| `--main-blue-color` | `#0b9eda` | 3.0:1 Large | Primary accent |
| `--color-success` | `#4aa84a` | 3.0:1 Large | Add, enable, confirm |
| `--color-warning` | `#df7b00` | 3.0:1 Large | Edit, update, modify |
| `--color-error` | `#e05555` | 3.8:1 Large | Delete, reset, destructive |
| `--main-bg-color` | `#333639` | — | Page background |
| `--main-item-bg-color` | `#515558` | — | Card/surface background |
| `--main-navbar-bg-color` | `#232324` | — | Navbar background |
| `--main-text-color` | `#ffffff` | 7.5:1 AAA | Primary text |
| `--secondary-text-color` | `#cccccc` | 4.7:1 AA | Labels, metadata |
| `--main-border-color` | `#6d6e6d` | — | Borders, dividers |
| `--main-disabled-color` | `#808080` | — | Disabled states |

Dark theme semantic colors target AA Large (3:1) for filled buttons. Full AA (4.5:1) is physically impossible for both white-text-on-color and color-text-on-dark-bg simultaneously.

### Color Values (RGB)

For `rgba()` usage, the blue channel is also available as `--main-blue-color-values`:
- Light: `9,127,174`
- Dark: `11,158,218`

---

## Buttons

Three types based on **how the button is used**, not its Bootstrap class name.

### Filled (Action Buttons)

White text on colored background. Standalone actions — buttons you click to *do* something.

| Property | Value |
|----------|-------|
| Background | `<semantic-color>` |
| Border | `1px solid <semantic-color>` |
| Text | `#fff` |
| Hover | `filter: brightness(0.85)` |
| Disabled | `bg: --main-disabled-color`, `color: --secondary-text-color`, `cursor: not-allowed`, `pointer-events: none` |

Classes:
- Blue: `.btn-info`, `.btn-primary`, `.btnstyle3`, `.btnstyle3-sel`, `.savebtn`, `.allow5min`, `.log-filter-btn-active`, `.btn-selected`/`.active`, `.btn-modern`, dialog buttons
- Green: `.btn-success`
- Orange: `.btn-warning`
- Red: `.btn-danger`, `.resetbtn`, `.btn-modern-warning`

### Outline (Toggle / Neutral)

Colored border, **`--main-text-color` for text** (not the semantic color). Used for toggle states, selections, and cancel/dismiss.

| Property | Value |
|----------|-------|
| Background | `transparent` |
| Border | `1px solid <semantic-color>` |
| Text | `var(--main-text-color)` |
| Hover | `bg: <semantic-color>`, `color: #fff` |
| Disabled | `border-color: --main-disabled-color`, `color: --main-disabled-color`, `cursor: not-allowed` |

Classes: `.btn-default`, `.btn-mini`, `.zoom-button`, `.zoom-reset`, `.log-filter-btn`, `.btn-large`

**Why `--main-text-color` instead of the semantic color?** Using the semantic color for outline text fails WCAG on both light and dark backgrounds. Using `--main-text-color` gives 17.4:1 (light) and 7.5:1 (dark) — AAA in both themes. The colored border still conveys the semantic meaning.

### Ghost (Tertiary / Inline)

No border. Blue text on tinted background. Navigation, inspection, low-stakes actions.

| Property | Value |
|----------|-------|
| Background | `transparent` or `rgba(--main-blue-color-values, 0.1)` |
| Border | `none` |
| Text | `var(--main-blue-color)` |
| Hover | `background: rgba(--main-blue-color-values, 0.2)` |
| Disabled | `color: --main-disabled-color`, `cursor: not-allowed` |

Classes: `.btnsmall`, `.btnsmall-sel`, `.btnsmall-dis`, `.btn-icon`, `.btn-link`, `.btnstyle`/`.btnstylerev`

### Why Filled vs Outline?

The split is based on context, not class name:

| Context | Type | Reason |
|---------|------|--------|
| Standalone action (Add, Update, Delete, Save) | Filled | Peers — color differentiates meaning, not weight |
| Toggle/selection inactive state | Outline | Contrasts with filled active state |
| Cancel / Dismiss | Outline | Lower visual weight than the action it cancels |
| Navigation / inspection | Ghost | Shouldn't compete with action buttons |

In Bootstrap 2.x, `btn-info`, `btn-warning`, `btn-danger`, and `btn-success` are all filled with gradients. Machinon follows this — they're all action buttons with equal visual weight.

---

## Universal Button Properties

| Property | Value |
|----------|-------|
| `border-radius` | `5px` — no exceptions |
| `transition` | `background 0.15s ease, color 0.15s ease, border-color 0.15s ease, filter 0.15s ease` |
| `font-family` | `main-font` — no bold on selected state (causes layout shift) |
| `cursor` | `pointer` (normal) / `not-allowed` (disabled) |

## Button Sizes

| Size | Padding | Font | Classes |
|------|---------|------|---------|
| XS | `1px 5px` | `10px` | `.btn-xs` |
| Small | `2px 8px` | `11px` | `.btn-mini`, `.zoom-button`, `.zoom-reset` |
| Default | `6px 12px` | `12px` | Most buttons |
| Large | `10px 20px` | `14px` | `.savebtn`, `.resetbtn`, `.btn-modern`, `.btn-large` |

## Button Groups

### Device cards (`.item .btn-group`) — Pills

- `display: flex; flex-wrap: wrap; gap: 3px`
- Every child: `border-radius: 5px` (individual pills)
- Selected child: filled style (colored bg, white text, no bold)

### Toolbars/dialogs (`.btn-group` outside `.item`) — Connected

- `display: flex; gap: 0`
- Children: `border-radius: 0`
- First child: `border-radius: 5px 0 0 5px`
- Last child: `border-radius: 0 5px 5px 0`
- Selected child: filled style (colored bg, white text, no bold)

Context-based, not viewport-based. No media queries for this distinction.

---

## Typography

| Context | Font | Size |
|---------|------|------|
| Page heading | `main-font-bold` | `20px` |
| Section heading | `main-font-bold` | `16px` |
| Navigation | `main-font-bold` | `11pt` |
| Card name | `main-font-bold` | `14px` |
| Card value (bigtext) | `main-font` | `1.4em`, `--main-blue-color` |
| Body text | `main-font` | `13px` |
| Metadata | `main-font` | `11px`, `--secondary-text-color` |
| Button text | `main-font` | see Button Sizes table |

Font families:
- `main-font` — Open Sans Regular (400)
- `main-font-bold` — Open Sans SemiBold (600)

---

## Cards

| Property | Value |
|----------|-------|
| Background | `--main-item-bg-color` |
| Border radius | `6px` |
| Shadow | `0 0 10px 1px rgba(0,0,0,0.2)` |
| Hover | `box-shadow: 0 0 0 2px var(--main-blue-color)` |

### Card States

| State | Treatment |
|-------|-----------|
| Protected | Blue glow: `0 0 10px 2px rgba(0,0,139,0.4)` |
| Timeout | Red glow + 50% opacity: `0 0 10px 2px rgba(199,67,67,0.5)` |
| Low battery | Yellow glow: `0 0 10px 2px rgba(255,255,0,0.4)` |
| Update pulse | Blue box-shadow pulse animation (0.8s) |
| Faded off | `opacity: 0.5` |

---

## Border Radius

| Value | Usage |
|-------|-------|
| `5px` | Buttons, navbar active, input focus, tags |
| `6px` | Cards, tables, dialogs, menus, popups |
| `2px` | Checkboxes, labels, badges, textareas |
| `3px` | Sliders, log count badges |
| `50%` | Radio buttons, slider handles, toggle thumb |
| `34px` | Toggle switch track |

---

## Shadows

| Context | Value |
|---------|-------|
| Cards / tables | `0 0 10px 1px rgba(0,0,0,0.2)` |
| Navbar | `0 0 10px 2px rgba(0,0,0,0.2)` |
| Popups / menus | `-2px 2px 20px 0 rgba(0,0,0,0.2)` |
| Login button | `0 2px 4px 0 rgba(0,0,0,0.2)` |
| Focus / hover | `0 0 0 2px var(--main-blue-color)` |

---

## Spacing

### Button padding

See Button Sizes table.

### Common gaps

| Value | Usage |
|-------|-------|
| `3px` | Button group pills |
| `5px` | Dialog button sets |
| `10px` | Card internal padding |
| `15px` | Card grid gap |

---

## Technical Gotchas

### Bootstrap 2.x gradient override

Bootstrap sets `background-image: linear-gradient(...)` and `text-shadow` on all `btn-*` classes. `background-color` does NOT override `background-image` — the gradient bleeds through.

```css
/* WRONG — gradient still shows */
.btn-info { background-color: var(--main-blue-color); }

/* CORRECT — resets background-image */
.btn-info { background: var(--main-blue-color); text-shadow: none; }
```

Applies to ALL `btn-*` classes: `.btn-info`, `.btn-success`, `.btn-warning`, `.btn-danger`, `.btn-primary`, `.btn-default`.

### Button group specificity

`.btn-group > .btn:first-child` (Bootstrap) has higher specificity than `.item .btn-group .btn` (ours). Must explicitly override first/last child for pills:

```css
.item .btn-group > .btn,
.item .btn-group > .btn:first-child,
.item .btn-group > .btn:last-child {
  border-radius: 5px !important;
}
```

### Bold causes layout shift

`font-weight: 600` or `font-family: main-font-bold` on selected buttons changes text width, shifting adjacent buttons. Never use bold on selected button state — the filled background is sufficient visual indicator.

### !important usage

- **KEEP** where overriding upstream Bootstrap/Domoticz
- **REMOVE** where our own rules fight each other
- **KEEP** on `margin-left: 0` for btn-group first/last children (beats Bootstrap's `margin: 0 0 0 -1px !important` shorthand)

---

## Visual Companions

These HTML files illustrate the contract. Open in a browser for interactive previews.

- [`style-guide.html`](style-guide.html) — Full visual reference with light/dark toggle
- [`button-reference.html`](button-reference.html) — Interactive button catalog with all states and hover behaviors
- [`wcag-color-comparison.html`](wcag-color-comparison.html) — Current vs proposed WCAG color comparison

When these conflict with this document, this document wins.
