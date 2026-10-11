var BUILTIN_SCHEMES = null;
function loadBuiltinSchemes() {
if (BUILTIN_SCHEMES) return Promise.resolve(BUILTIN_SCHEMES);
var base = "styles/" + themeFolder + "/schemes/";
return fetch(base + "index.json", { credentials: "include" })
.then(function(r) { return r.json(); })
.then(function(slugs) {
return Promise.all(slugs.map(function(slug) {
return fetch(base + slug + ".json", { credentials: "include" })
.then(function(r) { return r.json(); })
.then(function(scheme) { scheme.slug = slug; return scheme; });
}));
})
.then(function(schemes) {
BUILTIN_SCHEMES = {};
schemes.forEach(function(s) { BUILTIN_SCHEMES[s.slug] = s; });
return BUILTIN_SCHEMES;
})
.catch(function(e) {
console.log(themeName + " - failed to load built-in schemes:", e);
BUILTIN_SCHEMES = {};
return BUILTIN_SCHEMES;
});
}
var DZ_SCHEME_MIGRATIONS = {
"blue-ui-light": "light",
"blue-ui-dark": "dark",
"e-ink": "paper-light",
"catppuccin-latte": "light",
"catppuccin-mocha": "dark",
"tokyo-night": "dark",
"dracula": "dark",
"terra": "dark",
"golden-hour": "dark",
"nightfall": "dark",
"ultraviolet": "dark",
"ember": "dark",
"high-contrast": "dark",
"nord": "dark",
"solarized-light": "light"
};
var DZ_BASE_PAIR = { light: "dark", dark: "light" };
function dzFindPairMate(slug, schemes, userSchemes) {
if (!slug) { return null; }
if (DZ_BASE_PAIR[slug]) { return DZ_BASE_PAIR[slug]; }
if (slug.indexOf("user:") === 0) {
var rest = slug.substring(5);
var mine = null, variant;
(userSchemes || []).forEach(function (p) {
if (p.name === rest) { mine = p; }
});
if (mine) {
variant = mine.variant;
} else {
var bar = rest.lastIndexOf("|");
if (bar === -1) { return null; }
var name = rest.substring(0, bar);
variant = rest.substring(bar + 1);
(userSchemes || []).forEach(function (p) {
if (p.name === name && p.variant === variant) { mine = p; }
});
}
if (!mine || !mine.pair) { return null; }
var mate = null;
(userSchemes || []).forEach(function (p) {
if (p.pair === mine.pair && p.variant !== variant) { mate = p; }
});
return mate ? "user:" + mate.name + "|" + mate.variant : null;
}
var self = schemes && schemes[slug];
if (!self || !self.pair) { return null; }
var found = null;
Object.keys(schemes).forEach(function (other) {
var s = schemes[other];
if (other !== slug && s.pair === self.pair && s.variant !== self.variant) {
found = other;
}
});
return found;
}
var DZ_PAIR_SEQ = 0;
function dzNewPairId(name) {
DZ_PAIR_SEQ += 1;
var slug = String(name || "theme").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 20);
return "u:" + slug + "-" + Date.now().toString(36) + "-" + DZ_PAIR_SEQ;
}
function dzSaveGeneratedPair(name, seed, pairColors) {
name = (name || "").trim().slice(0, 40);
if (!name) { return null; }
var pairId = dzNewPairId(name);
theme.user_schemes = (theme.user_schemes || []).filter(function (p) {
return p.name !== name;
});
["light", "dark"].forEach(function (variant) {
theme.user_schemes.push({
name: name, variant: variant, pair: pairId, base: variant,
seed: { accent: seed.accent, surface: seed.surface || null, look: seed.look },
colors: Object.assign({}, pairColors[variant])
});
});
var wantDark = theme.scheme_base === "dark";
var slug = "user:" + name + "|" + (wantDark ? "dark" : "light");
applyScheme(slug);
renderSchemePicker();
if (typeof dzHubSyncSchemeSwatches === "function") { dzHubSyncSchemeSwatches(); }
return slug;
}
function migrateRetiredScheme() {
var target = DZ_SCHEME_MIGRATIONS[theme.scheme];
if (!target) return Promise.resolve(false);
console.log(themeName + " - scheme '" + theme.scheme + "' was retired, migrating to '" + target + "'");
return applyScheme(target).then(function() { return true; });
}
function persistSchemeChoice() {
if (typeof dzHubPersist === "function") {
dzHubPersist();
return;
}
if (typeof storeUserVariableThemeSettings === "function") {
storeUserVariableThemeSettings("update");
}
}
function contrastRatio(hexA, hexB) {
function lum(hex) {
var c = hexToRGB(hex, true).split(",").map(function(v) {
v = Number(v) / 255;
return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
});
return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
var a = lum(hexA), b = lum(hexB);
return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
function schemeContrastFailures(cs) {
var fails = [];
if (cs.main_text && cs.background) {
var body = contrastRatio(cs.main_text, cs.background);
if (body < 4.5) { fails.push(dzT("hub.schemes.wcag_body", { ratio: body.toFixed(1) })); }
}
if (cs.alt_text && cs.background) {
var alt = contrastRatio(cs.alt_text, cs.background);
if (alt < 4.5) { fails.push(dzT("hub.schemes.wcag_alt", { ratio: alt.toFixed(1) })); }
}
if (cs.main_color) {
var onAcc = contrastRatio(cs.accent_text || "#ffffff", cs.main_color);
if (onAcc < 3.0) { fails.push(dzT("hub.schemes.wcag_accent", { ratio: onAcc.toFixed(1) })); }
}
return fails;
}
function warnIfContrastFails(cs, what) {
var fails = schemeContrastFailures(cs);
if (fails.length && typeof generate_noty === "function") {
generate_noty('warning', dzT("toasts.wcag_fails", { what: what, failures: fails.join("; ") }), 8000);
}
return fails;
}
function dzSchemeNameError(name) {
if ((name || "").indexOf("|") !== -1) {
return dzT("toasts.name_pipe");
}
return null;
}
function saveCurrentColorsAsScheme(name) {
name = (name || "").trim().slice(0, 40);
if (!name) return;
var nameError = dzSchemeNameError(name);
if (nameError) {
if (typeof generate_noty === "function") { generate_noty("warning", nameError, 5000); }
return;
}
theme.user_schemes = (theme.user_schemes || []).filter(function(p) { return p.name !== name; });
theme.user_schemes.push({
name: name,
base: theme.scheme_base === "dark" ? "dark" : "light",
colors: Object.assign({}, theme.color_scheme)
});
theme.scheme = "user:" + name;
cacheThemeSettings();
persistSchemeChoice();
renderSchemePicker();
warnIfContrastFails(theme.color_scheme, dzT("hub.schemes.wcag_what_preset", { name: name }));
}
function deleteUserScheme(name, variant) {
var all = theme.user_schemes || [];
var target = null;
all.forEach(function (p) {
if (p.name === name && (variant === undefined || p.variant === variant)) { target = p; }
});
var removed = [];
theme.user_schemes = all.filter(function (p) {
var goesAway = target && target.pair ? p.pair === target.pair : p.name === name;
if (goesAway) { removed.push(p); }
return !goesAway;
});
var removedSlugs = removed.map(function (p) {
return p.variant ? "user:" + p.name + "|" + p.variant : "user:" + p.name;
});
if (removedSlugs.indexOf(theme.scheme) !== -1) {
theme.scheme = "custom";
}
cacheThemeSettings();
persistSchemeChoice();
renderSchemePicker();
}
function dzActiveSchemeSlug() {
if (theme.scheme) return theme.scheme;
var f = theme.features || {};
if (f.custom_color_scheme && f.custom_color_scheme.enabled === true) return "custom";
if (f.dark_theme && f.dark_theme.enabled === true) return "dark";
return "light";
}
function applyScheme(slug) {
if (slug === "light" || slug === "dark") {
theme.scheme = slug;
theme.scheme_base = slug;
theme.features.custom_color_scheme.enabled = false;
setDarkFeature(slug === "dark");
setColorScheme();
cacheThemeSettings();
persistSchemeChoice();
return Promise.resolve();
}
if (slug === "custom") {
theme.scheme = "custom";
theme.features.custom_color_scheme.enabled = true;
setColorScheme();
cacheThemeSettings();
persistSchemeChoice();
return Promise.resolve();
}
if (slug.indexOf("user:") === 0) {
var rest = slug.substring(5);
var preset = (theme.user_schemes || []).filter(function (p) {
return p.name === rest;
})[0];
if (!preset) {
var bar = rest.lastIndexOf("|");
if (bar !== -1) {
var wantName = rest.substring(0, bar);
var wantVariant = rest.substring(bar + 1);
preset = (theme.user_schemes || []).filter(function (p) {
return p.name === wantName && p.variant === wantVariant;
})[0];
}
}
if (!preset) return Promise.resolve();
theme.scheme = slug;
theme.scheme_base = preset.base === "dark" ? "dark" : "light";
theme.color_scheme = Object.assign({}, preset.colors);
theme.features.custom_color_scheme.enabled = true;
setDarkFeature(false);
setColorScheme();
cacheThemeSettings();
persistSchemeChoice();
return Promise.resolve();
}
return loadBuiltinSchemes().then(function(schemes) {
var scheme = schemes[slug];
if (!scheme) return;
theme.scheme = slug;
theme.scheme_base = scheme.base === "dark" ? "dark" : "light";
theme.color_scheme = Object.assign({}, scheme.colors);
theme.features.custom_color_scheme.enabled = true;
setDarkFeature(false);
setColorScheme();
cacheThemeSettings();
persistSchemeChoice();
});
}
function setDarkFeature(enabled) {
var was = theme.features.dark_theme.enabled === true;
theme.features.dark_theme.enabled = enabled;
if (enabled && !was) { loadThemeFeatureFiles("dark_theme"); }
if (!enabled && was) { unloadThemeFeatureFiles("dark_theme"); }
}
var DZ_COLOR_SCHEME_FIELDS = [
{ suffix: "bg", field: "background" },
{ suffix: "navbar", field: "navbar" },
{ suffix: "item", field: "item" },
{ suffix: "main_color", field: "main_color" },
{ suffix: "text", field: "main_text" },
{ suffix: "alt_text", field: "alt_text" },
{ suffix: "disabled", field: "disabled" }
];
var DZ_SCHEME_PICKER_CONTAINER_IDS = [];
function registerSchemePickerContainer(id) {
if (id && DZ_SCHEME_PICKER_CONTAINER_IDS.indexOf(id) === -1) {
DZ_SCHEME_PICKER_CONTAINER_IDS.push(id);
}
}
function renderSchemePicker() {
var containers = DZ_SCHEME_PICKER_CONTAINER_IDS
.map(function(id) { return document.getElementById(id); })
.filter(function(el) { return !!el; });
if (!containers.length) return;
loadBuiltinSchemes().then(function(schemes) {
var SWATCH_KEYS = ["background", "navbar", "item", "main_color", "main_text", "alt_text", "disabled"];
var cards = [
{ slug: "light", name: dzT("hub.schemes.builtin.light.name"), pair: "machinon", desc: dzT("hub.schemes.builtin.light.desc"), colors: { background: "#f4f8fc", navbar: "#e9f2fb", item: "#ffffff", main_color: "#396d9e", main_text: "#1b2b3a", alt_text: "#3e5568", disabled: "#8ca0b3" } },
{ slug: "dark", name: dzT("hub.schemes.builtin.dark.name"), pair: "machinon", desc: dzT("hub.schemes.builtin.dark.desc"), colors: { background: "#0f1620", navbar: "#0a0f16", item: "#18202b", main_color: "#98ccfd", main_text: "#dce6f0", alt_text: "#9db2c6", disabled: "#5e7183" } }
];
Object.keys(schemes).forEach(function(slug) {
var s = schemes[slug];
cards.push({ slug: slug, name: s.name, pair: s.pair, desc: s.description, colors: s.colors || {} });
});
(theme.user_schemes || []).forEach(function(p) {
var slug = p.variant ? "user:" + p.name + "|" + p.variant : "user:" + p.name;
var label = p.variant
? dzT("hub.schemes.pair_label", {
name: p.name,
variant: p.variant === "dark" ? dzT("hub.schemes.dark") : dzT("hub.schemes.light")
})
: p.name;
cards.push({ slug: slug, name: label, pair: p.pair, variant: p.variant,
presetName: p.name, deletable: true, colors: p.colors || {} });
});
cards.push({ slug: "custom", name: dzT("hub.schemes.builtin.custom.name"), desc: dzT("hub.schemes.builtin.custom.desc"), colors: null });
var active = dzActiveSchemeSlug();
containers.forEach(function(container) {
container.textContent = "";
container.setAttribute("role", "group");
container.setAttribute("aria-label", dzT("hub.schemes.group_label"));
cards.forEach(function(card, i) {
var el = document.createElement("div");
el.className = "scheme-card" + (active === card.slug ? " selected" : "");
el.setAttribute("data-scheme", card.slug);
var pick = document.createElement("button");
pick.type = "button";
pick.className = "scheme-pick";
pick.setAttribute("aria-label", card.name);
pick.setAttribute("aria-pressed", active === card.slug ? "true" : "false");
el.appendChild(pick);
var swatches = document.createElement("div");
swatches.className = "swatches";
var cs = card.colors || theme.color_scheme || {};
SWATCH_KEYS.forEach(function(key) {
var sw = document.createElement("span");
if (cs[key]) sw.style.backgroundColor = cs[key];
swatches.appendChild(sw);
});
el.appendChild(swatches);
var label = document.createElement("div");
label.className = "scheme-name";
label.textContent = card.name;
el.appendChild(label);
if (card.desc) {
var desc = document.createElement("div");
desc.className = "scheme-desc";
desc.id = container.id + "-desc-" + i;
desc.textContent = card.desc;
el.appendChild(desc);
pick.setAttribute("aria-describedby", desc.id);
}
if (card.deletable) {
var del = document.createElement("button");
del.type = "button";
del.className = "scheme-delete";
del.textContent = "×";
del.title = dzT("hub.schemes.delete_preset");
del.setAttribute("aria-label", dzT("hub.schemes.delete_named", { name: card.name }));
del.addEventListener("click", function(e) {
e.stopPropagation();
deleteUserScheme(card.presetName || card.name, card.variant);
});
el.appendChild(del);
}
el.addEventListener("click", function() {
applyScheme(card.slug).then(function() {
container.querySelectorAll(".scheme-card").forEach(function(c) {
c.classList.remove("selected");
c.querySelector(".scheme-pick").setAttribute("aria-pressed", "false");
});
el.classList.add("selected");
pick.setAttribute("aria-pressed", "true");
if (typeof dzHubSyncSchemeSwatches === "function") { dzHubSyncSchemeSwatches(); }
});
});
container.appendChild(el);
});
});
if (typeof dzHubSyncSchemeSwatches === "function") { dzHubSyncSchemeSwatches(); }
});
}
