var dzLastPaintState = null;
function dzSavedPaintState() {
var f = theme.features || {};
var slug = typeof dzActiveSchemeSlug === 'function' ? dzActiveSchemeSlug() : theme.scheme;
var darkFile = !!(f.dark_theme && f.dark_theme.enabled);
if (f.custom_color_scheme && f.custom_color_scheme.enabled === true) {
return {
slug: slug, attr: theme.scheme_base === 'dark' ? 'dark' : 'custom',
colors: Object.assign({}, theme.color_scheme), darkFile: darkFile
};
}
return { slug: slug, attr: darkFile ? 'dark' : null, colors: null, darkFile: darkFile };
}
function dzPaintState(state) {
var html = document.documentElement;
clearCustomColorScheme();
if (state.colors) {
applyCustomColorScheme(state.colors);
} else if (state.tokens) {
Object.keys(state.tokens).forEach(function (name) { html.style.setProperty(name, state.tokens[name]); });
}
if (state.attr === 'dark' || state.attr === 'custom') {
html.setAttribute('data-dz-scheme', state.attr);
} else {
html.removeAttribute('data-dz-scheme');
}
dzSetDarkFile(state.darkFile === true);
repairFixedColors();
dzLastPaintState = state;
}
function setColorScheme() {
var state = dzSavedPaintState();
dzPaintState(state);
dzPaintedSlug = state.slug;
}
var DZ_REPAIR_STATUS = ['timeout', 'lowbat', 'protected'];
var DZ_REPAIR_IDENTITY = [
'--dz-widget-amber', '--dz-widget-energy-export', '--dz-widget-energy-gas',
'--dz-widget-energy-water', '--dz-widget-energy-price', '--dz-widget-energy-grid',
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
for (var i = 0; i < DZ_REPAIR_STATUS.length; i++) {
var name = DZ_REPAIR_STATUS[i];
var base = dzCssColorToHex('rgb(' + read('--dz-status-' + name + '-values-base') + ')');
if (!base) { continue; }
var forCard = dzRepairAgainstSurface(base, card, DZ_REPAIR_TARGET_STATUS);
html.style.setProperty('--dz-status-' + name + '-values', dzHexToTriplet(forCard));
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
bg: v('--dz-body-bg'),
main: v('--dz-accent-color'),
navbar: v('--dz-nav-bg'),
item: v('--dz-widget-bg'),
text: v('--dz-body-text'),
alt_text: v('--secondary-text-color'),
disabled: v('--dz-status-disabled')
};
dzPaintState(dzLastPaintState || dzSavedPaintState());
return defaults;
}
var DZ_CUSTOM_TOKENS = [
'--dz-body-bg', '--dz-body-text', '--dz-nav-bg', '--dz-widget-bg', '--dz-widget-text',
'--dz-accent-color', '--dz-input-border', '--dz-status-disabled', '--dz-accent-red',
'--dz-btn-success-bg', '--dz-btn-warning-bg', '--secondary-text-color', '--dz-accent-values',
'--dz-accent-text', '--dz-sun-color', '--dz-moon-color', '--dz-accent-red-values',
'--dz-widget-amber', '--dz-widget-energy-export', '--dz-widget-energy-gas',
'--dz-widget-energy-water', '--dz-widget-energy-price', '--dz-widget-energy-grid'
];
function applyCustomColorScheme(cs, target) {
var s = (target || document.documentElement).style;
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
set('--dz-accent-text', cs.accent_text);
set('--dz-sun-color', cs.sun);
set('--dz-moon-color', cs.moon);
set('--dz-widget-amber', cs.energy_import);
set('--dz-widget-energy-export', cs.energy_export);
set('--dz-widget-energy-gas', cs.energy_gas);
set('--dz-widget-energy-water', cs.energy_water);
set('--dz-widget-energy-price', cs.energy_price);
set('--dz-widget-energy-grid', cs.energy_grid);
if (cs.main_color) { s.setProperty('--dz-accent-values', hexToRGB(cs.main_color, true)); }
if (cs.error) { s.setProperty('--dz-accent-red-values', hexToRGB(cs.error, true)); }
}
function clearCustomColorScheme() {
var s = document.documentElement.style;
for (var i = 0; i < DZ_CUSTOM_TOKENS.length; i++) { s.removeProperty(DZ_CUSTOM_TOKENS[i]); }
for (var j = 0; j < DZ_REPAIR_STATUS.length; j++) {
s.removeProperty('--dz-status-' + DZ_REPAIR_STATUS[j] + '-values');
s.removeProperty('--dz-toast-severity-' + DZ_REPAIR_STATUS[j]);
}
for (var k = 0; k < DZ_REPAIR_IDENTITY.length; k++) { s.removeProperty(DZ_REPAIR_IDENTITY[k]); }
}
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
if (!h || typeof h !== 'string') {
return values_only ? "0,0,0" : "rgb(0,0,0)";
}
var r = 0, g = 0, b = 0;
if (h.length == 4) {
r = "0x" + h[1] + h[1];
g = "0x" + h[2] + h[2];
b = "0x" + h[3] + h[3];
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
