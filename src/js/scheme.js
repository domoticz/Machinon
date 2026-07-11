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

// --dz-* tokens the custom colour scheme may override (used to clear them on a scheme switch).
var DZ_CUSTOM_TOKENS = [
    '--dz-body-bg', '--dz-body-text', '--dz-nav-bg', '--dz-widget-bg', '--dz-widget-text',
    '--dz-accent-color', '--dz-input-border', '--dz-status-disabled', '--dz-accent-red',
    '--dz-btn-success-bg', '--dz-btn-warning-bg', '--secondary-text-color', '--dz-accent-values',
    '--dz-accent-text'
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
    if (cs.main_color) { s.setProperty('--dz-accent-values', hexToRGB(cs.main_color, true)); }
}

function clearCustomColorScheme() {
    var s = document.documentElement.style;
    for (var i = 0; i < DZ_CUSTOM_TOKENS.length; i++) { s.removeProperty(DZ_CUSTOM_TOKENS[i]); }
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
