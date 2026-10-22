var DZ_BUILTIN_PAIRS = {
"light": { pair: "machinon", variant: "light" },
"dark": { pair: "machinon", variant: "dark" },
"magenta-light": { pair: "magenta", variant: "light" },
"magenta-dark": { pair: "magenta", variant: "dark" },
"paper-light": { pair: "paper", variant: "light" },
"paper-dark": { pair: "paper", variant: "dark" },
"gruvbox-light": { pair: "gruvbox", variant: "light" },
"gruvbox-dark": { pair: "gruvbox", variant: "dark" }
};
function dzMakeFamily(id, kind, light, dark, single, deletable, presetName) {
return {
id: id, kind: kind, light: light, dark: dark, single: single,
deletable: deletable, presetName: presetName
};
}
function dzSchemeFamilies(userSchemes) {
var families = [];
var builtin = Object.create(null);
Object.keys(DZ_BUILTIN_PAIRS).forEach(function (slug) {
var entry = DZ_BUILTIN_PAIRS[slug];
var fam = builtin[entry.pair];
if (!fam) {
fam = dzMakeFamily(entry.pair, entry.pair === "machinon" ? "machinon" : "builtin",
null, null, false, false, null);
builtin[entry.pair] = fam;
families.push(fam);
}
fam[entry.variant] = slug;
});
var pairs = Object.create(null);
var slots = [];
(Array.isArray(userSchemes) ? userSchemes : []).forEach(function (p) {
if (!p || typeof p !== "object" || typeof p.name !== "string") { return; }
if (p.pair === undefined) {
var legacy = "user:" + p.name;
slots.push(dzMakeFamily(legacy, "legacy", legacy, legacy, true, true, p.name));
return;
}
if (typeof p.pair !== "string") { return; }
if (p.variant !== "light" && p.variant !== "dark") { return; }
var group = pairs[p.pair];
if (!group) {
group = pairs[p.pair] = { id: "user-pair:" + p.pair, name: p.name, light: null, dark: null };
slots.push(group);
}
if (!group[p.variant]) { group[p.variant] = "user:" + p.name + "|" + p.variant; }
});
slots.forEach(function (entry) {
if (entry.kind) { families.push(entry); return; }
var both = !!(entry.light && entry.dark);
var only = entry.light || entry.dark;
families.push(dzMakeFamily(entry.id, "user",
both ? entry.light : only, both ? entry.dark : only,
!both, true, entry.name));
});
families.push(dzMakeFamily("custom", "custom", "custom", "custom", true, false, null));
return families;
}
function dzFamilyOf(slug, families) {
if (typeof slug !== "string" || !families) { return null; }
var i, fam;
for (i = 0; i < families.length; i++) {
fam = families[i];
if (fam.single && fam.light === slug) { return fam; }
}
for (i = 0; i < families.length; i++) {
fam = families[i];
if (!fam.single && (fam.light === slug || fam.dark === slug)) { return fam; }
}
return null;
}
function dzCleanOverride(raw) {
if (!raw || typeof raw !== "object") { return null; }
if (raw.variant !== "light" && raw.variant !== "dark") { return null; }
if (typeof raw.deviceDark !== "boolean") { return null; }
return { variant: raw.variant, deviceDark: raw.deviceDark };
}
function dzOverrideStillValid(override, mode, deviceDark) {
if (!override) { return false; }
if (mode === "light" || mode === "dark") { return true; }
if (mode === "auto") { return override.deviceDark === !!deviceDark; }
return false;
}
function dzWantedVariant(mode, override, deviceDark) {
if (mode !== "light" && mode !== "dark" && mode !== "auto") { return null; }
var ov = dzCleanOverride(override);
if (ov && dzOverrideStillValid(ov, mode, deviceDark)) { return ov.variant; }
if (mode === "auto") { return deviceDark ? "dark" : "light"; }
return mode;
}
function dzResolvePaintSlug(slug, mode, override, deviceDark, families) {
var fam = dzFamilyOf(slug, families);
if (!fam || fam.single) { return slug; }
var wanted = dzWantedVariant(mode, override, deviceDark);
if (wanted === "dark") { return fam.dark || slug; }
if (wanted === "light") { return fam.light || slug; }
return slug;
}
function dzSavedMemberFor(fam, mode, deviceDark) {
if (fam.single) { return fam.light; }
var dark = mode === "dark" || (mode !== "light" && !!deviceDark);
return (dark ? fam.dark : fam.light) || fam.light || fam.dark;
}
function dzStateForSlug(slug, families, sources) {
if (slug === sources.savedSlug) { return sources.savedState; }
var fam = dzFamilyOf(slug, families);
if (!fam || fam.single) { return null; }
var variant = slug === fam.dark ? "dark" : "light";
if (fam.kind === "machinon") {
return { slug: slug, attr: variant === "dark" ? "dark" : null, colors: null, darkFile: variant === "dark" };
}
var colors = null;
var base = variant;
if (fam.kind === "user") {
var pairId = fam.id.substring("user-pair:".length);
var preset = (Array.isArray(sources.userSchemes) ? sources.userSchemes : []).filter(function (p) {
return p && p.pair === pairId && p.variant === variant;
})[0];
if (preset) {
colors = preset.colors;
base = preset.base === "dark" ? "dark" : "light";
}
} else if (sources.builtinColors &&
Object.prototype.hasOwnProperty.call(sources.builtinColors, slug)) {
colors = sources.builtinColors[slug];
} else if (sources.record && sources.record.family === fam.id && sources.record[variant]) {
var half = sources.record[variant];
return { slug: slug, attr: half.attr, colors: null,
tokens: Object.assign({}, half.tokens), darkFile: half.darkFile };
}
if (!colors || typeof colors !== "object") { return null; }
return { slug: slug, attr: base === "dark" ? "dark" : "custom",
colors: Object.assign({}, colors), darkFile: false };
}
var DZ_PAINT_RECORD_KEY = "dzPaintRecord";
var DZ_TOKEN_NAME = /^--dz-[a-z0-9-]+$/;
var DZ_TOKEN_EXTRA_NAMES = ["--secondary-text-color"];
var DZ_TOKEN_VALUE = /^(rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+)\s*)?\)|\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}|#[0-9a-fA-F]{6})$/;
var DZ_FOLDER_NAME = /^[A-Za-z0-9_-]+$/;
function dzTokenNameOk(name) {
return DZ_TOKEN_NAME.test(name) || DZ_TOKEN_EXTRA_NAMES.indexOf(name) !== -1;
}
function dzCleanTokens(raw) {
if (!raw || typeof raw !== "object" || Array.isArray(raw)) { return null; }
var out = {};
Object.keys(raw).forEach(function (name) {
var value = raw[name];
if (dzTokenNameOk(name) && typeof value === "string" && DZ_TOKEN_VALUE.test(value)) {
out[name] = value;
}
});
return out;
}
function dzCleanPaintHalf(raw, fallback) {
if (!raw || typeof raw !== "object" || Array.isArray(raw)) { return null; }
if (raw.attr !== null && raw.attr !== "dark" && raw.attr !== "custom") { return null; }
if (typeof raw.dark_file !== "boolean") { return null; }
var tokens = dzCleanTokens(raw.tokens);
if (!tokens) { return null; }
var version = Object.prototype.hasOwnProperty.call(raw, "version") ? raw.version : fallback;
return { attr: raw.attr, darkFile: raw.dark_file,
version: typeof version === "string" ? version : null, tokens: tokens };
}
function dzParsePaintRecord(raw) {
if (typeof raw !== "string") { return null; }
var rec;
try {
rec = JSON.parse(raw);
} catch (e) {
return null;
}
if (!rec || typeof rec !== "object" || rec.v !== 1) { return null; }
if (typeof rec.folder !== "string" || !DZ_FOLDER_NAME.test(rec.folder)) { return null; }
if (typeof rec.family !== "string") { return null; }
if (rec.mode !== "light" && rec.mode !== "dark" && rec.mode !== "auto") { return null; }
var version = typeof rec.version === "string" ? rec.version : null;
return { folder: rec.folder, family: rec.family, saved: rec.saved, mode: rec.mode,
version: version,
light: dzCleanPaintHalf(rec.light, version), dark: dzCleanPaintHalf(rec.dark, version) };
}
function dzReadPaintRecord(raw, deviceDark, override) {
var rec = dzParsePaintRecord(raw);
if (!rec) { return null; }
var variant = dzWantedVariant(rec.mode, override, deviceDark);
var half = variant ? rec[variant] : null;
if (!half) { return null; }
return { folder: rec.folder, family: rec.family, variant: variant,
attr: half.attr, darkFile: half.darkFile, tokens: half.tokens };
}
function dzBuildPaintRecord(input) {
if (!input || typeof input !== "object") { return null; }
if (typeof input.folder !== "string" || !DZ_FOLDER_NAME.test(input.folder)) { return null; }
if (typeof input.family !== "string" || typeof input.saved !== "string") { return null; }
if (input.mode !== "light" && input.mode !== "dark" && input.mode !== "auto") { return null; }
var rec = { v: 1, folder: input.folder, family: input.family, saved: input.saved, mode: input.mode };
if (typeof input.version === "string") { rec.version = input.version; }
["light", "dark"].forEach(function (variant) {
var half = input[variant];
if (!half) { return; }
rec[variant] = {
attr: half.attr === "dark" || half.attr === "custom" ? half.attr : null,
dark_file: half.darkFile === true,
tokens: dzCleanTokens(half.tokens) || {}
};
if (typeof half.version === "string") { rec[variant].version = half.version; }
});
return rec;
}
var dzPaintedSlug = null;
var dzLastColorMode = null;
var dzColorModeSeq = 0;
var dzColorModeArmed = false;
var dzPaintRecordDue = true;
var dzOverrideMemory;
var DZ_DEVICE_DARK_QUERY = "(prefers-color-scheme: dark)";
function dzDeviceDark() {
try {
return !!(window.matchMedia && window.matchMedia(DZ_DEVICE_DARK_QUERY).matches);
} catch (e) {
return false;
}
}
function dzColorOverrideKey() {
return themeFolder + ".colorOverride";
}
function dzColorOverride() {
if (dzOverrideMemory !== undefined) { return dzOverrideMemory; }
try {
return dzCleanOverride(JSON.parse(localStorage.getItem(dzColorOverrideKey())));
} catch (e) {
return null;
}
}
function dzSetColorOverride(variant) {
var clean = dzCleanOverride({ variant: variant, deviceDark: dzDeviceDark() });
dzOverrideMemory = clean;
try {
if (clean) {
localStorage.setItem(dzColorOverrideKey(), JSON.stringify(clean));
} else {
localStorage.removeItem(dzColorOverrideKey());
}
} catch (e) {
if (typeof dzLog === "function") { dzLog("colormode", "override_store_failed", { error: String(e) }); }
}
}
function dzForgetPaint() {
dzOverrideMemory = undefined;
try {
localStorage.removeItem(DZ_PAINT_RECORD_KEY);
localStorage.removeItem(dzColorOverrideKey());
} catch (e) {
if (typeof dzLog === "function") { dzLog("colormode", "forget_paint_failed", { error: String(e) }); }
}
}
function dzSyncBuiltinColors() {
return dzBuiltinColorsOf(BUILTIN_SCHEMES);
}
function dzBuiltinColorsOf(schemes) {
var out = Object.create(null);
Object.keys(schemes || {}).forEach(function (slug) {
if (schemes[slug] && schemes[slug].colors) { out[slug] = schemes[slug].colors; }
});
return out;
}
function dzLoadAnyPaintRecord() {
try {
return dzParsePaintRecord(localStorage.getItem(DZ_PAINT_RECORD_KEY));
} catch (e) {
return null;
}
}
function dzCurrentPaintRecord(rec) {
if (!rec || typeof theme.version !== "string") { return null; }
var out = Object.assign({}, rec);
["light", "dark"].forEach(function (variant) {
if (out[variant] && out[variant].version !== theme.version) { out[variant] = null; }
});
return out;
}
function dzLoadPaintRecord() {
return dzCurrentPaintRecord(dzLoadAnyPaintRecord());
}
function dzPaintTokenNames() {
var names = DZ_CUSTOM_TOKENS.concat(DZ_REPAIR_IDENTITY);
DZ_REPAIR_STATUS.forEach(function (name) {
names.push("--dz-status-" + name + "-values", "--dz-toast-severity-" + name);
});
return names.filter(dzTokenNameOk);
}
function dzStyleTokens(el) {
var out = {};
dzPaintTokenNames().forEach(function (name) {
var value = String(el.style.getPropertyValue(name) || "").trim();
if (value) { out[name] = value; }
});
return out;
}
function dzRecordHalf(state) {
var tokens = {};
if (state.colors) {
var probe = document.createElement("div");
applyCustomColorScheme(state.colors, probe);
tokens = dzStyleTokens(probe);
} else if (state.tokens) {
tokens = state.tokens;
}
return { attr: state.attr, darkFile: state.darkFile === true, version: theme.version, tokens: tokens };
}
function dzWritePaintRecord(families, keepPainted) {
dzPaintRecordDue = false;
var state = dzLastPaintState;
if (!state) { return; }
var fam = dzFamilyOf(state.slug, families);
var stored = dzLoadAnyPaintRecord();
if (stored && (!fam || stored.family !== fam.id)) { stored = null; }
var prev = dzCurrentPaintRecord(stored);
var rec = null;
if (fam) {
var variant = !fam.single && state.slug === fam.dark ? "dark" : "light";
var input = { folder: themeFolder, family: fam.id, saved: dzActiveSchemeSlug(),
mode: theme.scheme_mode, version: theme.version, light: null, dark: null };
var painted = keepPainted === true && prev ? prev[variant] : null;
if (!painted) {
painted = { attr: state.attr, darkFile: state.darkFile === true, version: theme.version,
tokens: dzStyleTokens(document.documentElement) };
}
if (fam.single) {
input.light = input.dark = painted;
} else {
var other = variant === "dark" ? "light" : "dark";
var mate = dzStateForSlug(fam[other], families, {
savedSlug: dzActiveSchemeSlug(), savedState: dzSavedPaintState(),
userSchemes: theme.user_schemes, builtinColors: dzSyncBuiltinColors(), record: prev
});
input[variant] = painted;
input[other] = mate ? dzRecordHalf(mate) : stored ? stored[other] : null;
}
rec = dzBuildPaintRecord(input);
}
try {
if (rec) {
localStorage.setItem(DZ_PAINT_RECORD_KEY, JSON.stringify(rec));
} else {
localStorage.removeItem(DZ_PAINT_RECORD_KEY);
}
} catch (e) {
if (typeof dzLog === "function") { dzLog("colormode", "paint_record_store_failed", { error: String(e) }); }
}
}
function dzRefreshPaintRecord() {
if (!dzLastPaintState) { return; }
dzWritePaintRecord(dzSchemeFamilies(theme.user_schemes), true);
}
function dzDispatchColorMode(slug, families) {
var fam = dzFamilyOf(slug, families);
var single = !fam || fam.single;
var detail = { slug: slug, variant: single ? null : (slug === fam.dark ? "dark" : "light"), single: single };
dzLastColorMode = detail;
try {
document.dispatchEvent(new CustomEvent("dz:colormode", { detail: detail }));
} catch (e) {
if (typeof dzLog === "function") { dzLog("colormode", "dispatch_failed", { error: String(e) }); }
}
}
function dzPaintedVariant() {
return dzLastColorMode ? dzLastColorMode.variant : null;
}
function dzApplyColorMode(force) {
var seq = ++dzColorModeSeq;
var forced = force === true || dzLastPaintState === null;
var families = null;
return new Promise(function (resolve) {
var mode = theme.scheme_mode;
var deviceDark = dzDeviceDark();
families = dzSchemeFamilies(theme.user_schemes);
var override = dzColorOverride();
if (override && !dzOverrideStillValid(override, mode, deviceDark)) {
dzSetColorOverride(null);
override = null;
}
var saved = dzActiveSchemeSlug();
var slug = dzResolvePaintSlug(saved, mode, override, deviceDark, families);
if (slug === dzPaintedSlug && !forced) { resolve(null); return; }
var sources = { savedSlug: saved, savedState: dzSavedPaintState(),
userSchemes: theme.user_schemes, builtinColors: dzSyncBuiltinColors(),
record: dzLoadPaintRecord() };
var state = dzStateForSlug(slug, families, sources);
if (state) { resolve(state); return; }
resolve(loadBuiltinSchemes().then(function (schemes) {
sources.builtinColors = dzBuiltinColorsOf(schemes);
var fetched = dzStateForSlug(slug, families, sources);
if (fetched) { return fetched; }
if (typeof dzLog === "function") { dzLog("colormode", "variant_unavailable", { slug: slug }); }
return slug === dzPaintedSlug ? null : sources.savedState;
}));
}).then(function (state) {
if (seq !== dzColorModeSeq) { return; }
var painted = false;
if (state && (state.slug !== dzPaintedSlug || forced)) {
dzPaintState(state);
dzPaintedSlug = state.slug;
painted = true;
}
if (painted || dzPaintRecordDue) { dzWritePaintRecord(families); }
if (!dzLastColorMode || dzLastColorMode.slug !== dzPaintedSlug) {
dzDispatchColorMode(dzPaintedSlug, families);
}
}).catch(function (e) {
if (typeof dzLog === "function") { dzLog("colormode", "apply_failed", { error: String(e) }); }
});
}
function dzSeedPaintedSlug() {
var early = window.__dzEarlyPaint;
if (!early) {
dzPaintedSlug = dzActiveSchemeSlug();
return;
}
var fam = dzSchemeFamilies(theme.user_schemes).filter(function (f) { return f.id === early.family; })[0];
dzPaintedSlug = fam ? (fam.single ? fam.light : fam[early.variant]) || null : null;
if (early.darkFile === true) { dzSetDarkFile(true); }
}
function dzArmColorModeListener() {
if (dzColorModeArmed) { return; }
var mq = null;
try {
mq = window.matchMedia ? window.matchMedia(DZ_DEVICE_DARK_QUERY) : null;
} catch (e) {
mq = null;
}
if (!mq) { return; }
var onChange = function () {
if (theme.scheme_mode !== "auto" && !dzColorOverride()) { return; }
dzApplyColorMode();
};
if (mq.addEventListener) {
mq.addEventListener("change", onChange);
} else if (mq.addListener) {
mq.addListener(onChange);
}
dzColorModeArmed = true;
}
function dzSetSchemeMode(mode) {
if (typeof mode !== "string" || DZ_SCHEME_MODES[mode] !== true) { return Promise.resolve(false); }
theme.scheme_mode = mode;
dzSetColorOverride(null);
var fam = dzFamilyOf(dzActiveSchemeSlug(), dzSchemeFamilies(theme.user_schemes));
var paired = !!(fam && !fam.single);
var saved = paired
? dzSaveSchemeModel(dzSavedMemberFor(fam, mode, dzDeviceDark()))
: Promise.resolve(false);
return saved.then(function (ok) {
if (!ok) {
if (paired && typeof dzLog === "function") { dzLog("colormode", "mode_member_unsaved", { mode: mode }); }
cacheThemeSettings();
persistSchemeChoice();
}
return dzApplyColorMode();
}).then(function () { return true; });
}
function dzPickFamily(familyId) {
var fam = dzSchemeFamilies(theme.user_schemes).filter(function (f) { return f.id === familyId; })[0];
if (!fam) { return Promise.resolve(); }
return applyScheme(dzSavedMemberFor(fam, theme.scheme_mode, dzDeviceDark()));
}
