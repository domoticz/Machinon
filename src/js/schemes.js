var BUILTIN_SCHEMES = null;
var BUILTIN_SCHEMES_P = null;
function loadBuiltinSchemes() {
if (BUILTIN_SCHEMES) return Promise.resolve(BUILTIN_SCHEMES);
if (BUILTIN_SCHEMES_P) return BUILTIN_SCHEMES_P;
var base = "styles/" + themeFolder + "/schemes/";
BUILTIN_SCHEMES_P = fetch(base + "index.json", { credentials: "include" })
.then(function(r) { return r.json(); })
.then(function(slugs) {
return Promise.all(slugs.map(function(slug) {
return fetch(base + slug + ".json", { credentials: "include" })
.then(function(r) { return r.json(); })
.then(function(scheme) { scheme.slug = slug; return scheme; });
}));
})
.then(function(schemes) {
var all = {};
schemes.forEach(function(s) { all[s.slug] = s; });
BUILTIN_SCHEMES = all;
BUILTIN_SCHEMES_P = null;
if (typeof dzRefreshPaintRecord === "function") { dzRefreshPaintRecord(); }
return all;
})
.catch(function(e) {
BUILTIN_SCHEMES_P = null;
if (typeof dzLog === "function") { dzLog("schemes", "load_failed", { error: String(e) }); }
return {};
});
return BUILTIN_SCHEMES_P;
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
var fam = dzFamilyOf("user:" + name + "|light", dzSchemeFamilies(theme.user_schemes));
var slug = fam && !fam.single
? dzSavedMemberFor(fam, theme.scheme_mode, dzDeviceDark())
: "user:" + name + "|light";
applyScheme(slug);
renderSchemePicker();
if (typeof dzHubSyncSchemeSwatches === "function") { dzHubSyncSchemeSwatches(); }
return slug;
}
function migrateRetiredScheme() {
var target = DZ_SCHEME_MIGRATIONS[theme.scheme];
if (!target) return Promise.resolve(false);
if (typeof dzLog === "function") { dzLog("schemes", "retired_migrated", { from: theme.scheme, to: target }); }
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
dzApplyColorMode();
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
dzApplyColorMode();
}
function dzActiveSchemeSlug() {
if (theme.scheme) return theme.scheme;
var f = theme.features || {};
if (f.custom_color_scheme && f.custom_color_scheme.enabled === true) return "custom";
if (f.dark_theme && f.dark_theme.enabled === true) return "dark";
return "light";
}
function dzUserPresetFor(slug) {
var rest = slug.substring(5);
var all = theme.user_schemes || [];
var preset = all.filter(function (p) { return p.name === rest; })[0];
if (preset) return preset;
var bar = rest.lastIndexOf("|");
if (bar === -1) return undefined;
var wantName = rest.substring(0, bar);
var wantVariant = rest.substring(bar + 1);
return all.filter(function (p) {
return p.name === wantName && p.variant === wantVariant;
})[0];
}
function dzSaveSchemeModel(slug) {
var found;
if (slug === "light" || slug === "dark") {
theme.scheme = slug;
theme.scheme_base = slug;
theme.features.custom_color_scheme.enabled = false;
setDarkFeature(slug === "dark");
found = Promise.resolve(true);
} else if (slug === "custom") {
theme.scheme = "custom";
theme.features.custom_color_scheme.enabled = true;
found = Promise.resolve(true);
} else if (slug.indexOf("user:") === 0) {
found = Promise.resolve(dzSaveSchemeColors(slug, dzUserPresetFor(slug)));
} else {
found = loadBuiltinSchemes().then(function (schemes) {
return dzSaveSchemeColors(slug, schemes[slug]);
});
}
return found.then(function (ok) {
if (ok) {
cacheThemeSettings();
persistSchemeChoice();
}
return ok;
});
}
function dzSaveSchemeColors(slug, scheme) {
if (!scheme) return false;
theme.scheme = slug;
theme.scheme_base = scheme.base === "dark" ? "dark" : "light";
theme.color_scheme = Object.assign({}, scheme.colors);
theme.features.custom_color_scheme.enabled = true;
setDarkFeature(false);
return true;
}
function applyScheme(slug) {
return dzSaveSchemeModel(slug).then(function (ok) {
if (ok) return dzApplyColorMode(true);
});
}
function setDarkFeature(enabled) {
theme.features.dark_theme.enabled = enabled;
}
var DZ_DARK_FILE = "dark_theme.css";
var dzDarkFileLoaded = false;
var dzDarkFileLink = null;
function dzSetDarkFile(on) {
on = on === true;
if (on === dzDarkFileLoaded) return;
if (on) {
var own = "styles/" + themeFolder + "/css/" + DZ_DARK_FILE;
var links = document.getElementsByTagName("link");
for (var i = 0; i < links.length && !dzDarkFileLink; i++) {
var path = (links[i].getAttribute("href") || "").split("?")[0];
if (path === own || path.slice(-own.length - 1) === "/" + own) { dzDarkFileLink = links[i]; }
}
if (!dzDarkFileLink) {
var link = document.createElement("link");
link.setAttribute("rel", "stylesheet");
link.setAttribute("type", "text/css");
link.setAttribute("href", "styles/" + themeFolder + "/css/" + DZ_DARK_FILE + dzFeatureFileQuery());
document.getElementsByTagName("head")[0].appendChild(link);
dzDarkFileLink = link;
}
} else if (dzDarkFileLink) {
if (dzDarkFileLink.parentNode) { dzDarkFileLink.parentNode.removeChild(dzDarkFileLink); }
dzDarkFileLink = null;
}
dzDarkFileLoaded = on;
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
var DZ_SCHEME_SWATCH_KEYS = ["background", "item", "main_color", "main_text"];
var DZ_MACHINON_SWATCHES = {
light: { background: "#f4f8fc", item: "#ffffff", main_color: "#396d9e", main_text: "#1b2b3a" },
dark: { background: "#0f1620", item: "#18202b", main_color: "#98ccfd", main_text: "#dce6f0" }
};
var DZ_SCHEME_MODE_ORDER = ["light", "dark", "auto"];
function dzSchemeModeLabel(mode) {
if (mode === "dark") { return dzT("hub.schemes.mode_dark"); }
if (mode === "auto") { return dzT("hub.schemes.mode_auto"); }
return dzT("hub.schemes.mode_light");
}
function dzSchemeCardModel(fam, schemes, userSchemes, customColors) {
var card = { id: fam.id, name: fam.id, desc: null, single: fam.single,
deletable: fam.deletable, presetName: fam.presetName,
presetVariant: undefined, light: null, dark: null };
var presets = Array.isArray(userSchemes) ? userSchemes.filter(function (p) {
return p && typeof p === "object" && p.name === fam.presetName;
}) : [];
if (fam.kind === "machinon") {
card.name = dzT("hub.schemes.builtin.machinon.name");
card.desc = dzT("hub.schemes.builtin.machinon.desc");
card.light = DZ_MACHINON_SWATCHES.light;
card.dark = DZ_MACHINON_SWATCHES.dark;
} else if (fam.kind === "builtin") {
var all = schemes || {};
var light = Object.prototype.hasOwnProperty.call(all, fam.light) ? all[fam.light] : null;
var dark = Object.prototype.hasOwnProperty.call(all, fam.dark) ? all[fam.dark] : null;
var either = light || dark;
if (either) {
card.name = either.family_name || either.name || fam.id;
card.desc = either.family_description || either.description || null;
}
card.light = light ? light.colors : null;
card.dark = dark ? dark.colors : null;
} else if (fam.kind === "custom") {
card.name = dzT("hub.schemes.builtin.custom.name");
card.desc = dzT("hub.schemes.builtin.custom.desc");
card.light = customColors || null;
} else if (fam.kind === "legacy") {
card.name = fam.presetName;
var legacy = presets.filter(function (p) { return p.pair === undefined; })[0];
card.light = legacy ? legacy.colors : null;
} else {
card.name = fam.presetName;
var pairId = fam.id.substring("user-pair:".length);
presets.forEach(function (p) {
if (p.pair !== pairId || (p.variant !== "light" && p.variant !== "dark")) { return; }
if (!card[p.variant]) { card[p.variant] = p.colors; }
if (card.presetVariant === undefined) { card.presetVariant = p.variant; }
});
}
if (card.single) {
card.light = card.light || card.dark;
card.dark = null;
}
return card;
}
function dzSchemePickerState(families, saved, mode, override, deviceDark) {
var fam = dzFamilyOf(saved, families);
var single = !!(fam && fam.single);
var ov = dzCleanOverride(override);
if (ov && !dzOverrideStillValid(ov, mode, deviceDark)) { ov = null; }
if (ov && ov.variant === dzWantedVariant(mode, null, deviceDark)) { ov = null; }
var variant = dzWantedVariant(mode, ov, deviceDark);
if (!variant) { variant = fam && !single && saved === fam.dark ? "dark" : "light"; }
var note = null;
if (single) {
note = "single";
} else if (mode === "auto" && !ov) {
note = deviceDark ? "auto_dark" : "auto_light";
}
return { selected: fam ? fam.id : null, single: single, mode: mode, variant: variant,
override: single || !ov ? null : ov.variant, note: note };
}
var DZ_SCHEME_PICKER_CONTAINER_IDS = [];
var dzSchemePickerDataKey = null;
var dzSchemePickerArmed = false;
function registerSchemePickerContainer(id) {
if (id && DZ_SCHEME_PICKER_CONTAINER_IDS.indexOf(id) === -1) {
DZ_SCHEME_PICKER_CONTAINER_IDS.push(id);
}
}
function dzSchemePickerContainers() {
return DZ_SCHEME_PICKER_CONTAINER_IDS
.map(function (id) { return document.getElementById(id); })
.filter(function (el) { return !!el; });
}
function dzSchemePickerData() {
try {
return JSON.stringify(theme.user_schemes || []);
} catch (e) {
return "";
}
}
function dzArmSchemePicker() {
if (dzSchemePickerArmed) { return; }
dzSchemePickerArmed = true;
document.addEventListener("dz:colormode", function () { dzUpdateSchemePickers(); });
try {
var mq = window.matchMedia ? window.matchMedia(DZ_DEVICE_DARK_QUERY) : null;
if (mq && mq.addEventListener) {
mq.addEventListener("change", function () { dzUpdateSchemePickers(); });
} else if (mq && mq.addListener) {
mq.addListener(function () { dzUpdateSchemePickers(); });
}
} catch (e) {
if (typeof dzLog === "function") { dzLog("schemes", "picker_listen_failed", { error: String(e) }); }
}
}
function renderSchemePicker() {
if (!dzSchemePickerContainers().length) return;
dzArmSchemePicker();
dzSchemePickerDataKey = dzSchemePickerData();
loadBuiltinSchemes().then(function (schemes) {
var cards = dzSchemeFamilies(theme.user_schemes).map(function (fam) {
return dzSchemeCardModel(fam, schemes, theme.user_schemes, theme.color_scheme);
});
dzSchemePickerContainers().forEach(function (container) {
dzBuildSchemePicker(container, cards);
});
dzUpdateSchemePickers();
if (typeof dzHubSyncSchemeSwatches === "function") { dzHubSyncSchemeSwatches(); }
}).catch(function (e) {
if (typeof dzLog === "function") { dzLog("schemes", "picker_build_failed", { error: String(e) }); }
});
}
function dzSchemeSwatchStrip(colors) {
var strip = document.createElement("div");
strip.className = "swatches";
DZ_SCHEME_SWATCH_KEYS.forEach(function (key) {
var sw = document.createElement("span");
if (colors && typeof colors[key] === "string") { sw.style.backgroundColor = colors[key]; }
strip.appendChild(sw);
});
return strip;
}
function dzBuildSchemePicker(container, cards) {
container.textContent = "";
container.removeAttribute("role");
container.removeAttribute("aria-label");
var modeWrap = document.createElement("div");
modeWrap.className = "scheme-mode-wrap";
var group = document.createElement("div");
group.className = "scheme-mode";
group.setAttribute("role", "group");
group.setAttribute("aria-label", dzT("hub.schemes.mode_label"));
var note = document.createElement("p");
note.className = "scheme-mode-note";
note.id = container.id + "-mode-note";
note.hidden = true;
var noticeText = document.createElement("span");
noticeText.className = "scheme-override-text";
noticeText.id = container.id + "-override-note";
DZ_SCHEME_MODE_ORDER.forEach(function (mode) {
var btn = document.createElement("button");
btn.type = "button";
btn.className = "scheme-mode-btn";
btn.setAttribute("data-mode", mode);
btn.setAttribute("aria-pressed", "false");
btn.setAttribute("aria-describedby", note.id + " " + noticeText.id);
btn.textContent = dzSchemeModeLabel(mode);
btn.addEventListener("click", function () {
dzSetSchemeMode(mode).then(dzUpdateSchemePickers);
});
group.appendChild(btn);
});
modeWrap.appendChild(group);
modeWrap.appendChild(note);
var notice = document.createElement("div");
notice.className = "scheme-override";
notice.hidden = true;
notice.appendChild(noticeText);
var clear = document.createElement("button");
clear.type = "button";
clear.className = "btn btn-default btn-small scheme-override-clear";
clear.addEventListener("click", function () {
dzSetColorOverride(null);
dzApplyColorMode().then(dzUpdateSchemePickers);
});
notice.appendChild(clear);
modeWrap.appendChild(notice);
container.appendChild(modeWrap);
var list = document.createElement("div");
list.className = "scheme-cards";
list.setAttribute("role", "group");
list.setAttribute("aria-label", dzT("hub.schemes.group_label"));
cards.forEach(function (card, i) {
var el = document.createElement("div");
el.className = "scheme-card" + (card.single ? " is-single" : "") + (card.deletable ? " is-deletable" : "");
el.setAttribute("data-family", card.id);
var pick = document.createElement("button");
pick.type = "button";
pick.className = "scheme-pick";
pick.setAttribute("aria-label", card.name);
pick.setAttribute("aria-pressed", "false");
el.appendChild(pick);
var preview = document.createElement("div");
preview.className = "scheme-preview";
(card.single ? ["light"] : ["light", "dark"]).forEach(function (variant) {
var half = document.createElement("div");
half.className = "scheme-half";
half.setAttribute("data-variant", variant);
half.appendChild(dzSchemeSwatchStrip(card[variant]));
var marker = document.createElement("div");
marker.className = "scheme-marker";
half.appendChild(marker);
preview.appendChild(half);
});
el.appendChild(preview);
var text = document.createElement("div");
text.className = "scheme-text";
var label = document.createElement("div");
label.className = "scheme-name";
label.textContent = card.name;
text.appendChild(label);
if (card.desc) {
var desc = document.createElement("div");
desc.className = "scheme-desc";
desc.id = container.id + "-desc-" + i;
desc.textContent = card.desc;
text.appendChild(desc);
pick.setAttribute("aria-describedby", desc.id);
}
el.appendChild(text);
if (card.deletable) {
var del = document.createElement("button");
del.type = "button";
del.className = "scheme-delete";
del.textContent = "×";
del.title = dzT("hub.schemes.delete_preset");
del.setAttribute("aria-label", card.single
? dzT("hub.schemes.delete_named", { name: card.name })
: dzT("hub.schemes.delete_pair_named", { name: card.name }));
del.addEventListener("click", function (e) {
e.stopPropagation();
deleteUserScheme(card.presetName, card.presetVariant);
});
el.appendChild(del);
}
el.addEventListener("click", function () {
dzPickFamily(card.id).then(function () {
dzUpdateSchemePickers();
if (typeof dzHubSyncSchemeSwatches === "function") { dzHubSyncSchemeSwatches(); }
});
});
list.appendChild(el);
});
container.appendChild(list);
}
function dzUpdateSchemePickers() {
var containers = dzSchemePickerContainers();
if (!containers.length) { return; }
if (dzSchemePickerDataKey !== null && dzSchemePickerData() !== dzSchemePickerDataKey) {
renderSchemePicker();
return;
}
var families = dzSchemeFamilies(theme.user_schemes);
var state = dzSchemePickerState(families, dzActiveSchemeSlug(), theme.scheme_mode,
dzColorOverride(), dzDeviceDark());
containers.forEach(function (container) { dzUpdateSchemePicker(container, state); });
}
function dzUpdateSchemePicker(container, state) {
var group = container.querySelector(".scheme-mode");
if (!group) { return; }
group.setAttribute("aria-disabled", state.single ? "true" : "false");
Array.prototype.forEach.call(group.querySelectorAll(".scheme-mode-btn"), function (btn) {
var on = !state.single && btn.getAttribute("data-mode") === state.mode;
btn.disabled = state.single;
btn.setAttribute("aria-pressed", on ? "true" : "false");
});
var selectedName = "";
Array.prototype.forEach.call(container.querySelectorAll(".scheme-card"), function (el) {
var selected = el.getAttribute("data-family") === state.selected;
var single = el.classList.contains("is-single");
el.classList.toggle("selected", selected);
var pick = el.querySelector(".scheme-pick");
if (pick) { pick.setAttribute("aria-pressed", selected ? "true" : "false"); }
if (selected) {
var name = el.querySelector(".scheme-name");
selectedName = name ? name.textContent : "";
}
Array.prototype.forEach.call(el.querySelectorAll(".scheme-half"), function (half) {
var active = single || state.single || half.getAttribute("data-variant") === state.variant;
var strip = half.querySelector(".swatches");
var marker = half.querySelector(".scheme-marker");
if (strip) { strip.classList.toggle("is-dimmed", !active); }
if (marker) { marker.classList.toggle("is-active", selected && active); }
});
if (el.getAttribute("data-family") === "custom") {
var cs = theme.color_scheme || {};
Array.prototype.forEach.call(el.querySelectorAll(".swatches span"), function (sw, i) {
var value = cs[DZ_SCHEME_SWATCH_KEYS[i]];
sw.style.backgroundColor = typeof value === "string" ? value : "";
});
}
});
var note = container.querySelector(".scheme-mode-note");
if (note) {
var text = "";
if (state.note === "single") {
text = dzT("hub.schemes.note_single", { name: selectedName });
} else if (state.note === "auto_dark") {
text = dzT("hub.schemes.note_auto_dark");
} else if (state.note === "auto_light") {
text = dzT("hub.schemes.note_auto_light");
}
note.textContent = text;
note.hidden = !text;
}
var notice = container.querySelector(".scheme-override");
if (notice) {
notice.hidden = !state.override;
notice.querySelector(".scheme-override-text").textContent = state.override
? dzT("hub.schemes.note_override", { variant: dzSchemeModeLabel(state.override) }) : "";
if (state.override) {
notice.querySelector(".scheme-override-clear").textContent =
dzT("hub.schemes.clear_override", { mode: dzSchemeModeLabel(state.mode) });
}
}
}
