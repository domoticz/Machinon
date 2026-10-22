var dzDefaultsSnap = null;
function cacheThemeSettings() {
if (typeof dzDiagRefreshGate === "function") { dzDiagRefreshGate(true); }
var key = dzSettingsCacheKey();
if (key) localStorage.setItem(key, JSON.stringify(theme));
}
function dzSettingsCacheKey() {
var suffix = dzAccountSuffix(dzAccount);
return suffix === null ? null : themeFolder + ".themeSettings" + suffix;
}
function readCachedThemeSettings() {
var key = dzSettingsCacheKey();
var value = key ? localStorage.getItem(key) : null;
return value ? JSON.parse(value) : null;
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
var dzSettingsFromDefaults = false;
function loadSettings() {
if (typeof Storage !== "undefined") {
var cacheKey = dzSettingsCacheKey();
if (!cacheKey || localStorage.getItem(cacheKey) === null) {
dzSettingsFromDefaults = true;
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
scheme: t.scheme, scheme_base: t.scheme_base, scheme_mode: t.scheme_mode, color_scheme: t.color_scheme,
card_min_width: t.card_min_width, card_max_width: t.card_max_width,
logo: t.logo, background_img: t.background_img, background_type: t.background_type,
button_name: t.button_name
});
}
function reconcileDomoticzSettingsInPlace() {
var before = JSON.parse(JSON.stringify(theme));
var run = dzConfirmAccount().then(function() {
return dzMergeStoredSettings(before, (dzSettingsFromDefaults && !!window.__dzEarlyPaint) || dzAccountLoading);
}).then(function() {
dzAccountLoading = false;
}).catch(function(e) {
dzAccountLoading = false;
dzApplyColorMode();
throw e;
});
dzAccountWork = run.catch(function() {});
return run;
}
function dzMergeStoredSettings(before, forcePaint) {
return checkUserVariableThemeSettings().then(function() {
if (typeof migrateRetiredScheme === "function") { return migrateRetiredScheme(); }
return false;
}).then(function() {
applyThemeDeltaInPlace(before);
dzApplyColorMode(dzPaintInputs(before) !== dzPaintInputs(theme) || forcePaint === true);
});
}
var dzAccountWork = Promise.resolve();
function dzWatchAccount($rootScope) {
$rootScope.$on("permissionsChanged", function() { dzAccountMaybeChanged(); });
}
function dzAccountMaybeChanged(known) {
var run = dzAccountWork.then(function() {
return known !== undefined ? known : dzFetchAccount();
}).then(function(account) {
if (account === undefined) return;
if (account === dzAccount) {
if (dzAccountRights !== undefined && dzLastAuthRights !== undefined && dzAccountRights !== dzLastAuthRights &&
typeof dzHubDiscard === "function") {
dzHubDiscard();
if (typeof dzHubRemount === "function") dzHubRemount();
}
if (dzLastAuthRights !== undefined) dzAccountRights = dzLastAuthRights;
return;
}
var before = JSON.parse(JSON.stringify(theme));
return dzAdoptAccount(account).then(function(adopted) {
if (adopted) return dzMergeStoredSettings(before, true);
}).then(dzAccountLoaded, function(e) {
dzAccountLoaded();
throw e;
});
});
dzAccountWork = run.catch(function(e) {
if (typeof dzLog === "function") dzLog("settings", "account_change_failed", { error: String(e && e.message || e) });
});
return dzAccountWork;
}
function dzAccountLoaded() {
dzAccountLoading = false;
if (typeof dzHubRemount === "function") dzHubRemount();
}
function dzAdoptAccount(account) {
if (account !== undefined) dzRememberAccount(account);
if (account === null) {
dzAccount = null;
dzForgetAccountState();
return Promise.resolve(false);
}
dzAccountLoading = true;
return fetch("styles/" + themeFolder + "/theme.json", { cache: "no-cache", credentials: "include" })
.then(function(r) { return r.json(); })
.then(function(shipped) {
theme = JSON.parse(JSON.stringify(shipped));
themeName = theme.name;
dzDefaultsSnap = dzSettingsSnapshot(shipped);
dzAccount = account;
dzAccountRights = dzLastAuthRights;
dzForgetAccountState();
dzForgetUnkeyedState(account);
return true;
}, function() {
location.reload();
return false;
});
}
function dzForgetAccountState() {
dzApiState.perUser = false;
dzApiState.noIdentity = false;
dzApiState.instanceSnap = null;
dzApiState.userSnap = null;
dzApiState.tokens = { instance: "", user: "" };
if (typeof dzForgetColorMemory === "function") dzForgetColorMemory();
if (typeof dzHubDiscard === "function") dzHubDiscard();
}
var DZ_SHARED_USED_KEY = "dzPaintShared";
function dzForgetUnkeyedState(account) {
try {
if (account === "*") {
localStorage.setItem(DZ_SHARED_USED_KEY, "1");
return;
}
if (dzAccountSuffix(account) === null || localStorage.getItem(DZ_SHARED_USED_KEY) === "1") return;
localStorage.removeItem(themeFolder + ".themeSettings");
localStorage.removeItem("dzPaintRecord");
localStorage.removeItem(themeFolder + ".colorOverride");
} catch (e) { }
}
function dzTakeAccount(account) {
var changed = account !== dzAccount;
dzAccount = account;
dzRememberAccount(account);
if (dzAccountRights === undefined || changed) dzAccountRights = dzLastAuthRights;
dzForgetUnkeyedState(account);
}
var DZ_ACCOUNT_BOOT_TRIES = 3;
var DZ_ACCOUNT_RETRY_MS = 500;
function dzConfirmAccount() {
var early = window.__dzEarlyAccount;
function ask(tries) {
return dzAskAccount(DZ_ACCOUNT_PATIENT_MS).then(function(result) {
if (result.outcome !== "error" || tries <= 1) return result.account;
return new Promise(function(resolve) { setTimeout(resolve, DZ_ACCOUNT_RETRY_MS); }).then(function() {
return ask(tries - 1);
});
});
}
var answer = early && typeof early === "object" && early.key !== undefined
? Promise.resolve(early.key) : ask(DZ_ACCOUNT_BOOT_TRIES);
return answer.then(function(account) {
if (account !== undefined && (account === dzAccount || dzAccount === undefined)) {
dzTakeAccount(account);
return;
}
if (account === undefined && dzAccount === undefined) return;
return dzAdoptAccount(account);
});
}
function dzPaintInputs(t) {
var f = t.features || {};
return JSON.stringify({
scheme: t.scheme, scheme_base: t.scheme_base, color_scheme: t.color_scheme,
user_schemes: t.user_schemes,
custom: !!(f.custom_color_scheme && f.custom_color_scheme.enabled === true),
dark: !!(f.dark_theme && f.dark_theme.enabled === true)
});
}
function applyThemeDeltaInPlace(before) {
if (!before || isEmptyObject(theme)) return;
if (themeSettingsFingerprint(before) === themeSettingsFingerprint(theme)) return;
var reloadNeeded = false;
if (before.features && theme.features) {
$.each(theme.features, function(key, feature) {
if (key === "dark_theme") return;
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
applyCardWidths();
setLogo();
dzApplyCustomPageLabel();
applyBackground();
applyNavbarIconsText();
dzSyncModeToggles();
dzDiagRefreshGate(true);
}
function dzClearThemeCache() {
try {
var key = dzSettingsCacheKey();
if (key) localStorage.removeItem(key);
} catch (e) { }
if (typeof dzForgetPaint === "function") { dzForgetPaint(); }
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
dzClearThemeCache();
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
