/* Color scheme and sizing tokens: applies the user's scheme and card widths
   as --dz-* overrides on <html>. Everything here goes through setProperty
   (never a composed <style> element), so untrusted settings values cannot
   inject CSS rules. */

function setColorScheme() {
    var html = document.documentElement;
    if (theme.features.custom_color_scheme && theme.features.custom_color_scheme.enabled === true) {
        clearCustomColorScheme();
        applyCustomColorScheme(theme.color_scheme);
        /* theme.scheme_base picks the token UNDERLAY beneath the overrides:
           "dark" keeps dark.css active for every token the scheme does not
           set (shadows, panel backgrounds); anything else sits on the light
           base. Built-in schemes (src/js/schemes.js) set it; hand-built
           custom colors historically ran on the light base, which the
           undefined fallback preserves. */
        html.setAttribute('data-dz-scheme', theme.scheme_base === 'dark' ? 'dark' : 'custom');
    } else {
        clearCustomColorScheme();
        if (theme.features.dark_theme && theme.features.dark_theme.enabled) {
            html.setAttribute('data-dz-scheme', 'dark');
        } else {
            html.removeAttribute('data-dz-scheme');
        }
    }
    repairFixedColors();
}

/* The theme's FIXED colours are chosen per light/dark base and measured against
   the schemes that ship. A theme the user builds is not measured, and cannot be
   by any file-walking guard, so they are checked here against the surface they
   actually land on and repaired only if they fail. src/js/color-repair.js
   carries the reasoning and the numbers; this function only reads tokens and
   writes results.

   Runs for EVERY scheme, not just custom ones, because "is this a built-in"
   is the wrong question - the right one is "does this colour clear its floor
   on the card in front of us". A shipped scheme answers yes to all ten and
   costs one contrast comparison each: measured in Chromium, 0.04ms for the
   whole pass, so there is nothing to gate on.

   Values are written with setProperty and every one of them comes out of
   dzOklchToHex, so nothing user-supplied reaches the CSSOM as text. */
var DZ_REPAIR_STATUS = ['timeout', 'lowbat', 'protected'];
var DZ_REPAIR_IDENTITY = [
    '--dz-widget-amber', '--dz-widget-energy-export', '--dz-widget-energy-gas',
    '--dz-widget-energy-water', '--dz-widget-energy-price',
    '--dz-sun-color', '--dz-moon-color'
];

function repairFixedColors() {
    if (typeof dzRepairAgainstSurface !== 'function') { return; }
    var html = document.documentElement;
    var cs = getComputedStyle(html);
    var read = function (t) { return cs.getPropertyValue(t).trim(); };
    var card = dzCssColorToHex(read('--dz-widget-bg'));
    var menu = dzCssColorToHex(read('--dz-nav-bg'));
    if (!card) { return; }

    /* Status colours are stored as an "r, g, b" triplet because the glow
       recipes wrap them in rgba(); the glyph and the toast tile read the same
       token. */
    for (var i = 0; i < DZ_REPAIR_STATUS.length; i++) {
        var name = DZ_REPAIR_STATUS[i];
        var base = dzCssColorToHex('rgb(' + read('--dz-status-' + name + '-values-base') + ')');
        if (!base) { continue; }
        var forCard = dzRepairAgainstSurface(base, card, DZ_REPAIR_TARGET_STATUS);
        html.style.setProperty('--dz-status-' + name + '-values', dzHexToTriplet(forCard));
        /* The toast tile is a DIFFERENT surface: the severity mixed 15% into
           the navbar, so it needs its own value. One value cannot serve both -
           measured, impossible in 473 of 1032 card/navbar combinations. */
        if (menu) {
            var forTile = dzRepairAgainstTile(base, menu, DZ_REPAIR_TARGET_TILE);
            html.style.setProperty('--dz-toast-severity-' + name, forTile);
        }
    }

    for (var j = 0; j < DZ_REPAIR_IDENTITY.length; j++) {
        var token = DZ_REPAIR_IDENTITY[j];
        var value = dzCssColorToHex(read(token));
        if (!value) { continue; }
        html.style.setProperty(token, dzRepairAgainstSurface(value, card, DZ_REPAIR_TARGET_IDENTITY));
    }
}

/* Computed tokens come back as "rgb(r, g, b)" or already as a hex literal.
   Returns "" for anything else (an unset token, or a form we do not model)
   so the caller can skip rather than repair a colour it misread. */
function dzCssColorToHex(value) {
    if (!value) { return ''; }
    var v = value.trim();
    if (v.charAt(0) === '#' && (v.length === 7 || v.length === 4)) {
        if (v.length === 4) {
            return '#' + v[1] + v[1] + v[2] + v[2] + v[3] + v[3];
        }
        return v;
    }
    var m = v.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/);
    if (!m) { return ''; }
    var out = '#';
    for (var i = 1; i <= 3; i++) {
        var n = Math.round(parseFloat(m[i]));
        n = Math.max(0, Math.min(255, n));
        out += (n < 16 ? '0' : '') + n.toString(16);
    }
    return out;
}

function dzHexToTriplet(hex) {
    return [
        parseInt(hex.substr(1, 2), 16),
        parseInt(hex.substr(3, 2), 16),
        parseInt(hex.substr(5, 2), 16)
    ].join(', ');
}

// Read the current base scheme's DEFAULT palette straight from the --dz-* tokens (single source of
// truth in dz-tokens.css / dark.css), so the theme-settings "reset scheme" button no longer needs a
// duplicated JS colour map. Temporarily strips any active custom-colour override and forces the base
// (light/dark) scheme attribute, reads the resolved tokens, then restores the real scheme via
// setColorScheme(). All synchronous, so no repaint happens between - the user sees no flicker.
function getSchemeDefaults() {
    var html = document.documentElement;
    clearCustomColorScheme();
    if (theme.features.dark_theme && theme.features.dark_theme.enabled) {
        html.setAttribute('data-dz-scheme', 'dark');
    } else {
        html.removeAttribute('data-dz-scheme');
    }
    var cs = getComputedStyle(html);
    var v = function (t) { return cs.getPropertyValue(t).trim(); };
    var defaults = {
        bg:       v('--dz-body-bg'),
        main:     v('--dz-accent-color'),
        navbar:   v('--dz-nav-bg'),
        item:     v('--dz-widget-bg'),
        text:     v('--dz-body-text'),
        alt_text: v('--secondary-text-color'),
        disabled: v('--dz-status-disabled')
    };
    setColorScheme();
    return defaults;
}

/* Tokens a CUSTOM scheme may set inline on <html>, and which
   clearCustomColorScheme() must therefore remove when switching away.

   This array is about what may be set INLINE, not about what the colour picker
   exposes. Those are different lists: the picker is a separate hardcoded set of
   swatches in src/js/theme-hub.js and never reads this array, so adding a token
   here does not add a swatch there.

   The energy identity colours are NOT offered in the picker, because a user does
   not choose "what colour is water": they are defined once per base in
   dz-tokens.css / dark.css and a scheme inherits them through its scheme_base
   underlay. But a scheme MAY override them in its own JSON when its identity
   demands it (schemes/paper-*.json does), and applyCustomColorScheme then sets
   them inline. So they must be listed here, or switching away from Paper leaves
   its muted values pinned to every scheme chosen afterwards.

   --dz-sun-color and --dz-moon-color ARE here, because they predate that
   decision and schemes may still carry `sun` / `moon` keys (schemes/paper-*.json
   uses both deliberately). */
var DZ_CUSTOM_TOKENS = [
    '--dz-body-bg', '--dz-body-text', '--dz-nav-bg', '--dz-widget-bg', '--dz-widget-text',
    '--dz-accent-color', '--dz-input-border', '--dz-status-disabled', '--dz-accent-red',
    '--dz-btn-success-bg', '--dz-btn-warning-bg', '--secondary-text-color', '--dz-accent-values',
    '--dz-accent-text', '--dz-sun-color', '--dz-moon-color', '--dz-accent-red-values',
    '--dz-widget-amber', '--dz-widget-energy-export', '--dz-widget-energy-gas',
    '--dz-widget-energy-water', '--dz-widget-energy-price'
];

// Apply the user's custom colours as --dz-* overrides on <html> via setProperty.
// setProperty validates the value and cannot break out of the property, and hexToRGB reduces
// input to a numeric rgb(n,n,n), so untrusted theme.color_scheme values (settings -> DB) cannot
// inject CSS rules. Never compose a <style> element's text from these values.
function applyCustomColorScheme(cs) {
    var s = document.documentElement.style;
    var set = function (token, val) { if (val) { s.setProperty(token, hexToRGB(val)); } };
    set('--dz-body-bg', cs.background);
    set('--dz-body-text', cs.main_text);
    set('--dz-nav-bg', cs.navbar);
    set('--dz-widget-bg', cs.item);
    set('--dz-widget-text', cs.main_text);
    set('--dz-accent-color', cs.main_color);
    set('--dz-input-border', cs.border);
    set('--dz-status-disabled', cs.disabled);
    set('--dz-accent-red', cs.error);
    set('--dz-btn-success-bg', cs.success);
    set('--dz-btn-warning-bg', cs.warning);
    set('--secondary-text-color', cs.alt_text);
    /* Text on accent surfaces; schemes with a light accent set a dark value
       (default token: white). */
    set('--dz-accent-text', cs.accent_text);
    /* Sunrise/sunset sun icon; semantic default #8c730e light / #fad232 dark unless a scheme says otherwise */
    set('--dz-sun-color', cs.sun);
    /* Dynamic Dashboard sunset/moon icon, the sun's counterpart; semantic default #567ac6 light / #8ba4d8 dark unless a scheme says otherwise */
    set('--dz-moon-color', cs.moon);
    /* Energy identity colours. Same contract as sun above: the base defines
       them, a scheme overrides only when its identity demands it. Paper is the
       only one that does (monochrome). `set` is a no-op for a missing key, so
       every other scheme falls through to the base underlay. */
    set('--dz-widget-amber', cs.energy_import);
    set('--dz-widget-energy-export', cs.energy_export);
    set('--dz-widget-energy-gas', cs.energy_gas);
    set('--dz-widget-energy-water', cs.energy_water);
    set('--dz-widget-energy-price', cs.energy_price);
    if (cs.main_color) { s.setProperty('--dz-accent-values', hexToRGB(cs.main_color, true)); }
    /* danger-button tints derive from this triplet; without it schemes kept
       the base red's rgba tints under their own error colour */
    if (cs.error) { s.setProperty('--dz-accent-red-values', hexToRGB(cs.error, true)); }
}

function clearCustomColorScheme() {
    var s = document.documentElement.style;
    for (var i = 0; i < DZ_CUSTOM_TOKENS.length; i++) { s.removeProperty(DZ_CUSTOM_TOKENS[i]); }
    /* The repaired fixed colours are inline too and are NOT in DZ_CUSTOM_TOKENS
       (no scheme sets them), so they have to be cleared here as well. Without
       this, switching from a custom palette back to a built-in scheme leaves
       that palette's repaired status colours behind, and the next repair pass
       reads its own previous output as the starting value. The identity tokens
       are already in DZ_CUSTOM_TOKENS because applyCustomColorScheme can set
       them; clearing them twice is harmless. */
    for (var j = 0; j < DZ_REPAIR_STATUS.length; j++) {
        s.removeProperty('--dz-status-' + DZ_REPAIR_STATUS[j] + '-values');
        s.removeProperty('--dz-toast-severity-' + DZ_REPAIR_STATUS[j]);
    }
    for (var k = 0; k < DZ_REPAIR_IDENTITY.length; k++) { s.removeProperty(DZ_REPAIR_IDENTITY[k]); }
}

// Apply the user's card width settings as --dz-card-* overrides on <html> (consumed by the
// auto-fill grids in css/cards.css). parseInt reduces the stored value to a number before it
// reaches setProperty, so a non-numeric setting cannot inject CSS. Values are clamped to the
// same ranges as the settings inputs (the input min/max attributes do not stop typed or
// imported values); a non-numeric value falls back to the dz-tokens.css defaults by removing
// the override, and max is raised to min so the pair can never invert.
function applyCardWidths() {
    var s = document.documentElement.style;
    var clamp = function (v, lo, hi) {
        v = parseInt(v, 10);
        return isNaN(v) ? NaN : Math.min(Math.max(v, lo), hi);
    };
    var min = clamp(theme.card_min_width, 200, 800);
    var max = clamp(theme.card_max_width, 250, 1200);
    if (!isNaN(min) && !isNaN(max) && max < min) { max = min; }
    if (min > 0) { s.setProperty("--dz-card-min-width", min + "px"); } else { s.removeProperty("--dz-card-min-width"); }
    if (max > 0) { s.setProperty("--dz-card-max-width", max + "px"); } else { s.removeProperty("--dz-card-max-width"); }
}

function hexToRGB(h, values_only) {
    // Handle undefined or invalid input
    if (!h || typeof h !== 'string') {
        return values_only ? "0,0,0" : "rgb(0,0,0)";
    }

    let r = 0, g = 0, b = 0;

    // 3 digits
    if (h.length == 4) {
        r = "0x" + h[1] + h[1];
        g = "0x" + h[2] + h[2];
        b = "0x" + h[3] + h[3];

    // 6 digits
    } else if (h.length == 7) {
        r = "0x" + h[1] + h[2];
        g = "0x" + h[3] + h[4];
        b = "0x" + h[5] + h[6];
    }

    if (values_only === true)
        return +r + "," + +g + "," + +b;
    else
        return "rgb("+ +r + "," + +g + "," + +b + ")";
}
