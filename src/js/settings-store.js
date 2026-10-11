var dzDefaultsSnap = null;
function cacheThemeSettings() {
if (typeof dzDiagRefreshGate === "function") { dzDiagRefreshGate(true); }
localStorage.setItem(themeFolder + ".themeSettings", JSON.stringify(theme));
}
function readCachedThemeSettings() {
var value = localStorage.getItem(themeFolder + ".themeSettings");
return value && JSON.parse(value);
}
function isEmptyObject(obj) {
for (var prop in obj) {
if (Object.prototype.hasOwnProperty.call(obj, prop)) {
return false;
}
}
return true;
}
function dzThemeFromCache(cached, shipped) {
if (!shipped || typeof shipped !== "object" || !shipped.features) {
return dzThemeFromCacheOffline(cached);
}
var t = JSON.parse(JSON.stringify(shipped));
Object.keys(cached).forEach(function(key) {
if (key !== "features" && !Object.prototype.hasOwnProperty.call(t, key)) {
t[key] = cached[key];
}
});
dzApplySnapshot(t, dzCacheSnapshot(cached));
dzDeriveLegacyScheme(t);
return t;
}
function dzCacheSnapshot(cached) {
var snap = dzSettingsSnapshot(cached);
snap.schemaVersion = 1;
return dzMigrateSnapshot(snap);
}
function dzThemeFromCacheOffline(cached) {
var t = cached;
t.features = t.features || {};
dzManifestAllEntries().forEach(function(entry) {
if (entry.control === "toggle" && entry.storageKey && !t.features[entry.storageKey]) {
t.features[entry.storageKey] = { enabled: false, files: [] };
}
});
var snap = dzCacheSnapshot(t);
Object.keys(t.features).forEach(function(key) {
if (!Object.prototype.hasOwnProperty.call(snap.features, key)) delete t.features[key];
});
dzApplySnapshot(t, snap);
dzDeriveLegacyScheme(t);
return t;
}
function dzDeriveLegacyScheme(t) {
if (!t.features || t.scheme) return;
t.scheme = t.features.custom_color_scheme && t.features.custom_color_scheme.enabled ? "custom"
: (t.features.dark_theme && t.features.dark_theme.enabled ? "dark" : "light");
t.scheme_base = t.features.dark_theme && t.features.dark_theme.enabled ? "dark" : "light";
}
function loadSettings() {
if (typeof Storage !== "undefined") {
if (localStorage.getItem(themeFolder + ".themeSettings") === null) {
return fetch("styles/" + themeFolder + "/theme.json", { cache: "no-cache", credentials: "include" })
.then(function(response) { return response.json(); })
.then(function(localJson) {
theme = localJson;
themeName = theme.name;
dzDefaultsSnap = dzSettingsSnapshot(theme);
if (isEmptyObject(theme) === false) {
cacheThemeSettings();
}
console.log(themeName + " - local theme settingsfile loaded and saved to localStorage");
})
.catch(function(error) {
console.log("Machinon - failed to load theme.json:", error);
});
} else {
var cached = readCachedThemeSettings();
return fetch("styles/" + themeFolder + "/theme.json", { cache: "no-cache", credentials: "include" })
.then(function(response) { return response.json(); })
.catch(function(error) {
console.log("Machinon - theme.json unreadable, keeping the cached settings:", error);
return null;
})
.then(function(shipped) {
theme = dzThemeFromCache(cached, shipped);
themeName = theme.name;
if (shipped && shipped.features) { dzDefaultsSnap = dzSettingsSnapshot(shipped); }
console.log(themeName + " - theme settings was already found in the browser.");
});
}
}
return Promise.resolve();
}
function checkUserVariableThemeSettings() {
var startedAt = dzSettingsClock();
return dzProbeThemeSettingsAPI().then(function(capable) {
if (!capable) return checkUserVariableThemeSettingsLegacy(startedAt);
return dzApiLoad().then(function(outcome) {
dzSettingsLogLoad("native", outcome, startedAt);
if (outcome === DZ_LOAD_EMPTY) return dzSeedFromLegacyIfPossible();
return undefined;
}, function(e) {
dzSettingsLogLoad("native", "rejected", startedAt);
throw e;
});
});
}
function checkUserVariableThemeSettingsLegacy(startedAt) {
if (typeof startedAt !== "number") startedAt = dzSettingsClock();
var defaults = dzSettingsSnapshot(theme);
return dzThemeSettingsLoad().then(function(outcome) {
dzSettingsLogLoad("legacy", outcome, startedAt);
if (outcome === DZ_LOAD_LOADED) {
var stored = dzSettingsSnapshot(theme);
dzApplySnapshot(theme, dzMergeSettingsLayers(defaults, stored, null));
cacheThemeSettings();
return;
}
if (outcome === DZ_LOAD_EMPTY) {
return storeUserVariableThemeSettings(dzUnableToCreateUserVariable() ? "update" : "add");
}
});
}
function storeUserVariableThemeSettings(action) {
var startedAt = dzSettingsClock();
var transport = (dzApiState.capable === true) ? "native" : "legacy";
var save = (transport === "native") ? dzApiSaveSettings() : dzThemeSettingsSave(action);
return save.then(function(res) {
dzSettingsLogSave(transport, res, startedAt);
return res;
}, function(e) {
dzSettingsLogSave(transport, { ok: false, error: "rejected" }, startedAt);
throw e;
});
}
function themeSettingsFingerprint(t) {
if (!t) return "";
var feats = {};
if (t.features) {
for (var k in t.features) {
if (Object.prototype.hasOwnProperty.call(t.features, k)) {
feats[k] = t.features[k] && t.features[k].enabled === true;
}
}
}
return JSON.stringify({
features: feats,
scheme: t.scheme, scheme_base: t.scheme_base, color_scheme: t.color_scheme,
card_min_width: t.card_min_width, card_max_width: t.card_max_width,
logo: t.logo, background_img: t.background_img, background_type: t.background_type,
button_name: t.button_name
});
}
function reconcileDomoticzSettingsInPlace() {
var before = JSON.parse(JSON.stringify(theme));
return checkUserVariableThemeSettings().then(function() {
if (typeof migrateRetiredScheme === "function") { return migrateRetiredScheme(); }
return false;
}).then(function(migrated) {
if (migrated && before.features && theme.features && theme.features.dark_theme) {
before.features.dark_theme.enabled = theme.features.dark_theme.enabled;
}
applyThemeDeltaInPlace(before);
});
}
function applyThemeDeltaInPlace(before) {
if (!before || isEmptyObject(theme)) return;
if (themeSettingsFingerprint(before) === themeSettingsFingerprint(theme)) return;
var reloadNeeded = false;
if (before.features && theme.features) {
$.each(theme.features, function(key, feature) {
var was = !!(before.features[key] && before.features[key].enabled === true);
var now = feature.enabled === true;
if (was === now) return;
var files = feature.files || [];
var hasJs = files.some(function(f) { return f.split(".").pop() === "js"; });
if (now && !was) {
if (files.length) { loadThemeFeatureFiles(key); }
} else if (hasJs) {
reloadNeeded = true;
} else if (files.length) {
unloadThemeFeatureFiles(key);
}
});
}
if (reloadNeeded) { location.reload(); return; }
setColorScheme();
applyCardWidths();
setLogo();
dzApplyCustomPageLabel();
applyBackground();
applyNavbarIconsText();
dzDiagRefreshGate(true);
}
function resetTheme() {
var deletePromises = [];
function deleteVariable(idx, settingType) {
return fetch("json.htm?type=command&param=deleteuservariable&idx=" + idx, { credentials: "include" })
.then(function(r) { return r.json(); })
.then(function(data) {
console.log(themeName + " - server responded " + data.status + " while deleting user variable that stored " + settingType + " settings");
})
.catch(function() {
console.log(themeName + " - The theme was unable to delete the user variable in Domoticz that holds the theme " + settingType + " settings");
});
}
if (typeof theme.userfeaturesvariable !== "undefined") {
deletePromises.push(deleteVariable(theme.userfeaturesvariable, "feature"));
}
if (typeof theme.usercustomsvariable !== "undefined") {
deletePromises.push(deleteVariable(theme.usercustomsvariable, "custom"));
}
if (typeof theme.usercolorsvariable !== "undefined") {
deletePromises.push(deleteVariable(theme.usercolorsvariable, "colors"));
}
Promise.all(deletePromises).then(function() {
if (typeof Storage !== "undefined") {
localStorage.removeItem(themeFolder + ".themeSettings");
}
$.get("json.htm?type=command&param=addlogmessage&message=" + themeFolder + " theme reset to defaults");
location.reload();
});
}
if (typeof dzDiagRegister === "function") {
dzDiagRegister("build", function() {
return {
theme_version: (theme && theme.version) || "unknown",
theme_folder: themeFolder || "unknown",
domoticz_version: (typeof dzApiState !== "undefined" && dzApiState.domoticzVersion) || "unknown"
};
});
dzDiagRegister("view", function() {
return {
route: (typeof location !== "undefined" ? location.hash : ""),
width: window.innerWidth,
height: window.innerHeight,
phone: !!isMobile,
scheme: (window.theme && theme.scheme) || "unknown",
base: (document.documentElement.getAttribute("data-theme")) || "light",
engine: (typeof dzDiagEngine === "function" && typeof navigator !== "undefined")
? dzDiagEngine(navigator.userAgent) : "unknown"
};
});
dzDiagRegister("features", function() {
var on = [];
try {
Object.keys((theme && theme.features) || {}).forEach(function(k) {
if (theme.features[k] && theme.features[k].enabled === true) { on.push(k); }
});
} catch (e) { }
return { enabled: on };
});
}
