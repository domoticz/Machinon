var DZ_SETTINGS_SCHEMA_VERSION = 3;
function dzModeFromStoredBase(base, darkFeatureOn) {
if (base === "dark" || base === "light") return base;
return darkFeatureOn === true ? "dark" : "light";
}
var DZ_SCHEME_MODES = { light: true, dark: true, auto: true };
function dzNormaliseSchemeMode(t) {
if (DZ_SCHEME_MODES[t.scheme_mode] === true) return;
var f = t.features && t.features.dark_theme;
t.scheme_mode = dzModeFromStoredBase(t.scheme_base, !!(f && f.enabled === true));
}
var DZ_SETTINGS_MIGRATIONS = [
function (snap) {
if (!snap.features || !("notification" in snap.features)) return;
var was = snap.features.notification === true;
if (!("warn_timeout" in snap.features)) snap.features.warn_timeout = was;
if (!("warn_battery" in snap.features)) snap.features.warn_battery = was;
delete snap.features.notification;
},
function (snap) {
if (!snap.values || typeof snap.values !== "object" || Array.isArray(snap.values)) snap.values = {};
if (DZ_SCHEME_MODES[snap.values.scheme_mode] === true) return;
snap.values.scheme_mode = dzModeFromStoredBase(snap.values.scheme_base,
snap.features && snap.features.dark_theme);
}
];
function dzMigrateSnapshot(snap) {
if (!snap || typeof snap !== "object" || Array.isArray(snap)) return snap;
var v = typeof snap.schemaVersion === "number" && snap.schemaVersion >= 1 ? snap.schemaVersion : 1;
while (v < DZ_SETTINGS_SCHEMA_VERSION) {
DZ_SETTINGS_MIGRATIONS[v - 1](snap);
v++;
}
snap.schemaVersion = v;
return snap;
}
function dzCloneValue(v) {
return (v && typeof v === "object") ? JSON.parse(JSON.stringify(v)) : v;
}
function dzSettingsSnapshot(t) {
var features = {};
if (t.features) {
for (var k in t.features) {
if (Object.prototype.hasOwnProperty.call(t.features, k)) {
features[k] = t.features[k] && t.features[k].enabled === true;
}
}
}
return {
schemaVersion: DZ_SETTINGS_SCHEMA_VERSION,
features: features,
values: {
standby_after: t.standby_after, button_name: t.button_name,
custom_url: t.custom_url, logo: t.logo, icons: dzCloneValue(t.icons),
background_img: t.background_img, background_type: t.background_type,
scheme: t.scheme, scheme_base: t.scheme_base, scheme_mode: t.scheme_mode,
user_schemes: dzCloneValue(t.user_schemes), color_scheme: dzCloneValue(t.color_scheme),
card_min_width: t.card_min_width, card_max_width: t.card_max_width,
dashboard_camera_refresh: t.dashboard_camera_refresh, warn_repeat: t.warn_repeat
}
};
}
function dzApplySnapshot(t, snap) {
if (!snap) return;
if (snap.features && t.features) {
for (var k in t.features) {
if (Object.prototype.hasOwnProperty.call(t.features, k) &&
Object.prototype.hasOwnProperty.call(snap.features, k)) {
t.features[k].enabled = snap.features[k] === true;
}
}
}
if (snap.values) {
Object.keys(dzSettingsSnapshot({}).values).forEach(function(v) {
if (Object.prototype.hasOwnProperty.call(snap.values, v) &&
snap.values[v] !== undefined) {
t[v] = dzCloneValue(snap.values[v]);
}
});
}
}
function dzMergeSettingsLayers(defaultsSnap, storedSnap, perUserSnap) {
var out = { schemaVersion: DZ_SETTINGS_SCHEMA_VERSION, features: {}, values: {} };
[defaultsSnap, storedSnap, perUserSnap].forEach(function(layer) {
if (!layer) return;
if (layer.features) {
for (var f in layer.features) {
if (Object.prototype.hasOwnProperty.call(layer.features, f)) {
out.features[f] = layer.features[f];
}
}
}
if (layer.values) {
for (var v in layer.values) {
if (Object.prototype.hasOwnProperty.call(layer.values, v) &&
layer.values[v] !== undefined) {
out.values[v] = dzCloneValue(layer.values[v]);
}
}
}
});
return out;
}
function dzSnapshotSubset(snap, scope) {
var out = { schemaVersion: snap.schemaVersion, features: {}, values: {} };
Object.keys(snap.features || {}).forEach(function(k) {
if (dzSettingScope(k) === scope) out.features[k] = snap.features[k];
});
Object.keys(snap.values || {}).forEach(function(k) {
if (dzSettingScope(k) === scope) out.values[k] = dzCloneValue(snap.values[k]);
});
return out;
}
var DZ_ACCOUNT_POINTER_KEY = "dzPaintAccount";
function dzAccountKeyOf(auth) {
if (!auth || typeof auth !== "object" || auth.status !== "OK") return undefined;
if (typeof auth.user !== "string" || auth.user === "") return null;
return auth.canlogout === true ? "u:" + auth.user : "*";
}
function dzAccountSuffix(account) {
if (account === "*") return "";
if (typeof account !== "string" || account.indexOf("u:") !== 0 || account.length < 3) return null;
try {
return "@" + encodeURIComponent(account.substring(2));
} catch (e) {
return null;
}
}
var dzAccountAtLoad = (function() {
try {
var last = typeof localStorage !== "undefined" ? localStorage.getItem(DZ_ACCOUNT_POINTER_KEY) : null;
if (last === "*" || dzAccountSuffix(last) !== null) return last;
} catch (e) { }
return undefined;
})();
var dzAccount = (function() {
window.__dzEarlyClosed = true;
var early = window.__dzEarlyAccount;
if (early && typeof early === "object") return early.key;
return dzAccountAtLoad;
})();
var dzAccountRights;
var dzLastAuthRights;
var dzAccountLoading = false;
var DZ_ACCOUNT_TIMEOUT_MS = 5000;
var DZ_ACCOUNT_PATIENT_MS = 20000;
function dzAskAccount(timeoutMs) {
var settled = false;
var timer = null;
var abort = typeof AbortController === "function" ? new AbortController() : null;
var late = new Promise(function(resolve) {
timer = setTimeout(function() {
if (abort) abort.abort();
resolve({ account: undefined, outcome: "timeout" });
}, typeof timeoutMs === "number" ? timeoutMs : DZ_ACCOUNT_TIMEOUT_MS);
});
var init = { credentials: "include" };
if (abort) init.signal = abort.signal;
var asked = fetch("json.htm?type=command&param=getauth", init)
.then(function(r) { return r.json(); })
.then(function(auth) {
var account = dzAccountKeyOf(auth);
if (!settled && account !== undefined) {
dzLastAuthRights = typeof auth.rights === "number" ? auth.rights : undefined;
}
return { account: account, outcome: "answer" };
})
.catch(function() { return { account: undefined, outcome: "error" }; });
return Promise.race([asked, late]).then(function(result) {
settled = true;
clearTimeout(timer);
return result;
});
}
function dzFetchAccount(timeoutMs) {
return dzAskAccount(timeoutMs).then(function(result) { return result.account; });
}
function dzRememberAccount(account) {
try {
if (typeof account === "string") localStorage.setItem(DZ_ACCOUNT_POINTER_KEY, account);
else localStorage.removeItem(DZ_ACCOUNT_POINTER_KEY);
} catch (e) {
if (typeof dzLog === "function") dzLog("settings", "account_store_failed", { error: String(e) });
}
}
var dzApiState = { capable: null, perUser: false, tokens: { instance: "", user: "" },
instanceSnap: null, userSnap: null, noIdentity: false };
function dzIsAdmin() { return !!(window.my_config && window.my_config.userrights === 2); }
function dzSettingsMode() {
return { api: dzApiState.capable === true, perUser: dzApiState.perUser,
admin: dzIsAdmin(), noIdentity: dzApiState.noIdentity };
}
function dzProbeThemeSettingsAPI() {
if (window.__dzForceNoApi) { dzApiState.capable = false; return Promise.resolve(false); }
if (dzApiState.capable !== null) return Promise.resolve(dzApiState.capable);
return fetch("json.htm?type=command&param=getversion", { credentials: "include" })
.then(function(r) { return r.json(); })
.then(function(d) {
dzApiState.capable = d && d.ThemeSettingsAPI === 1;
if (d && typeof d.version === "string") { dzApiState.domoticzVersion = d.version; }
return dzApiState.capable;
})
.catch(function() { dzApiState.capable = false; return false; });
}
function dzApiFetchLayers() {
return fetch("json.htm?type=command&param=themesettings_get&theme=" + encodeURIComponent(themeFolder),
{ credentials: "include" })
.then(function(r) { return r.json(); })
.then(function(d) {
if (!d || d.status !== "OK") return DZ_LOAD_FAILED;
dzApiState.perUser = d.PerUser === true;
dzApiState.instanceSnap = (d.instance && d.instance.present) ? d.instance.value : null;
dzApiState.userSnap = (d.user && d.user.present) ? d.user.value : null;
dzApiState.tokens.instance = (d.instance && d.instance.present) ? d.instance.lastupdate : "";
dzApiState.tokens.user = (d.user && d.user.present) ? d.user.lastupdate : "";
if (!dzApiState.instanceSnap && !dzApiState.userSnap) return DZ_LOAD_EMPTY;
return DZ_LOAD_LOADED;
})
.catch(function() {
console.warn("machinon_themesettings", "load_unreachable", "keeping current values");
return DZ_LOAD_FAILED;
});
}
function dzApiLoad() {
return dzApiFetchLayers().then(function(outcome) {
if (outcome !== DZ_LOAD_LOADED) return outcome;
if (dzApiState.instanceSnap) dzMigrateSnapshot(dzApiState.instanceSnap);
if (dzApiState.userSnap) dzMigrateSnapshot(dzApiState.userSnap);
if (dzApiState.instanceSnap) dzApplySnapshot(theme, dzApiState.instanceSnap);
if (dzApiState.userSnap) dzApplySnapshot(theme, dzSnapshotSubset(dzApiState.userSnap, "user"));
dzNormaliseSchemeMode(theme);
try {
cacheThemeSettings();
} catch (e) {
console.warn("machinon_themesettings", "cache_write_failed", "continuing uncached: " + ((e && e.message) || e));
}
return DZ_LOAD_LOADED;
});
}
function dzWaitForAdminKnown() {
if (window.my_config) return Promise.resolve(dzIsAdmin());
return new Promise(function(resolve) {
var attempts = 0;
var poll = setInterval(function() {
attempts++;
if (window.my_config || attempts >= 50) {
clearInterval(poll);
resolve(dzIsAdmin());
}
}, 100);
});
}
function dzSeedFromLegacyIfPossible() {
return dzWaitForAdminKnown().then(function(isAdmin) {
if (!isAdmin) return;
return dzThemeSettingsLoad().then(function(outcome) {
if (outcome !== DZ_LOAD_LOADED) return;
cacheThemeSettings();
return dzApiWriteInstanceFull(dzSettingsSnapshot(theme)).then(function(res) {
if (res.ok) console.log(themeName + " - legacy theme settings migrated to native instance defaults");
else console.warn("machinon_themesettings", "seed_failed", "error=" + res.error, "will retry next load");
});
});
}).catch(function(e) {
console.warn("machinon_themesettings", "seed_failed", "error=" + ((e && e.message) || "unexpected"), "will retry next load");
});
}
function dzApiPost(params) {
var body = new URLSearchParams(params); body.set("type", "command");
return fetch("json.htm", { method: "POST", credentials: "include", body: body })
.then(function(r) { return r.json(); })
.catch(function() { return { status: "ERR", error: "unreachable" }; });
}
var dzWriteChain = Promise.resolve();
function dzEnqueueWrite(job) {
var run = dzWriteChain.then(job, job);
dzWriteChain = run.then(function() {}, function() {});
return run;
}
function dzApiLayerSnap(layer) {
return layer === "user" ? dzApiState.userSnap : dzApiState.instanceSnap;
}
function dzMergeConflict(baseSnap, intendedSnap, freshSnap, emptyBase) {
if (!freshSnap) return intendedSnap;
if (emptyBase && dzSnapIsEmpty(freshSnap)) freshSnap = emptyBase;
var out = dzMigrateSnapshot(JSON.parse(JSON.stringify(freshSnap)));
out.schemaVersion = intendedSnap.schemaVersion || DZ_SETTINGS_SCHEMA_VERSION;
["features", "values"].forEach(function(part) {
var intended = intendedSnap[part] || {};
var base = (baseSnap && baseSnap[part]) || {};
if (!out[part]) out[part] = {};
Object.keys(intended).forEach(function(k) {
if (JSON.stringify(intended[k]) !== JSON.stringify(base[k])) out[part][k] = dzCloneValue(intended[k]);
});
});
return out;
}
function dzApiWrite(param, layer, buildFn, asked, duringLoad) {
if (arguments.length < 4) asked = dzAccount;
return dzEnqueueWrite(function() {
return dzWithSameAccount(asked, duringLoad === true, function() { return dzApiWriteNow(param, layer, buildFn); });
});
}
function dzWithSameAccount(asked, duringLoad, job) {
if ((dzAccountLoading && !duringLoad) || asked !== dzAccount) {
return Promise.resolve(dzRefuseWrite(dzAccount === null ? null : "elsewhere", false));
}
return dzFetchAccount(DZ_ACCOUNT_PATIENT_MS).then(function(account) {
if (account !== undefined && account !== null && account === asked && account === dzAccount &&
(duringLoad || !dzAccountLoading)) {
return job();
}
return dzRefuseWrite(account, true, asked === undefined);
});
}
var dzLastRefusalAt = 0;
function dzRefuseWrite(account, fresh, unconfirmed) {
var reason = account === undefined ? "account_unknown" : account === null ? "logged_out" : "account_changed";
if (typeof dzLog === "function") dzLog("settings", "write_refused", { reason: reason });
if (account === undefined) return dzApiFail({ error: "unreachable" });
var now = Date.now();
if (now - dzLastRefusalAt > 2000 && typeof ShowNotify === "function") {
ShowNotify(dzT(account === null ? "toasts.save_refused_logged_out"
: unconfirmed === true ? "toasts.save_refused_unconfirmed" : "toasts.save_refused_account"), 6000);
}
dzLastRefusalAt = now;
if (fresh && typeof dzAccountMaybeChanged === "function") dzAccountMaybeChanged(account);
return { ok: false, error: reason };
}
function dzApiWriteNow(param, layer, buildFn, overwrite) {
var baseSnap = dzApiLayerSnap(layer);
var intended = buildFn();
var outcome = null;
function send(snap) {
return dzApiPost({ param: param, theme: themeFolder,
value: JSON.stringify(snap), lastupdate: dzApiState.tokens[layer] || "" });
}
return send(intended).then(function(d) {
if (d.status === "OK") { dzApiState.tokens[layer] = d.lastupdate || ""; return { ok: true, snap: intended }; }
if (d.error !== "conflict") return dzApiFail(d);
return dzApiFetchLayers().then(function(o) {
outcome = o;
var fresh = dzApiLayerSnap(layer);
var needDefaults = o !== DZ_LOAD_FAILED && overwrite !== true && layer === "instance" && dzSnapIsEmpty(fresh) && !!fresh;
return needDefaults ? dzEnsureDefaultsSnap().catch(function() { return null; }) : null;
}).then(function(emptyBase) {
var merged = (outcome === DZ_LOAD_FAILED || overwrite === true) ? intended
: dzMergeConflict(baseSnap, intended, dzApiLayerSnap(layer), emptyBase);
return send(merged).then(function(d2) {
if (d2.status === "OK") { dzApiState.tokens[layer] = d2.lastupdate || ""; return { ok: true, snap: merged }; }
return dzApiFail(d2);
});
});
});
}
function dzApiFail(d) {
var err = (d && d.error) || "unknown";
if (err === "no_identity") dzApiState.noIdentity = true;
console.warn("machinon_themesettings", "write_failed", "error=" + err, (d && d.message) || "");
if (typeof ShowNotify === "function") ShowNotify(dzT("toasts.save_failed", { error: err }), 4000);
return { ok: false, error: err };
}
if (typeof dzDiagRegister === "function") {
dzDiagRegister("mode", function() {
var mode = dzSettingsMode();
return {
admin: mode.admin === true,
per_user: mode.perUser === true,
no_identity: mode.noIdentity === true,
transport: dzApiState.capable === true ? "native"
: (dzApiState.capable === false ? "legacy" : "unresolved")
};
});
}
function dzSettingsClock() {
return (typeof dzDiagNow === "function") ? dzDiagNow() : 0;
}
function dzSettingsLoadLayer() {
if (dzApiState.instanceSnap && dzApiState.userSnap) return "instance+user";
if (dzApiState.instanceSnap) return "instance";
if (dzApiState.userSnap) return "user";
return "none";
}
function dzSettingsSaveLayer() {
if (!dzApiState.perUser) return "instance";
return dzIsAdmin() ? "user+instance" : "user";
}
function dzSettingsChangedKeys(current, stored) {
if (!current || !stored) return null;
var changed = 0;
["features", "values"].forEach(function(part) {
var mine = current[part] || {};
var theirs = stored[part] || {};
Object.keys(mine).forEach(function(k) {
if (JSON.stringify(mine[k]) !== JSON.stringify(theirs[k])) changed += 1;
});
});
return changed;
}
function dzSettingsLogLoad(transport, outcome, startedAt) {
if (typeof dzLog !== "function") return;
try {
dzLog("settings", "load", {
outcome: String(outcome),
transport: transport,
layer: (transport === "native") ? dzSettingsLoadLayer()
: (outcome === DZ_LOAD_LOADED ? "uservars" : "none"),
duration_ms: Math.round(dzDiagNow() - startedAt)
});
} catch (e) { }
}
function dzSettingsLogSave(transport, res, startedAt) {
if (typeof dzLog !== "function") return;
try {
var entry = {
outcome: (res && res.ok === false) ? ("error:" + (res.error || "unknown")) : "ok",
transport: transport,
layer: (transport === "native") ? dzSettingsSaveLayer() : "uservars",
duration_ms: Math.round(dzDiagNow() - startedAt)
};
if (transport === "native" && typeof dzLogOn !== "undefined" && dzLogOn) {
var changed = dzSettingsChangedKeys(dzSettingsSnapshot(theme), dzApiState.instanceSnap);
if (changed !== null) entry.keys_changed = changed;
}
dzLog("settings", "save", entry);
} catch (e) { }
}
function dzEnsureDefaultsSnap() {
if (dzDefaultsSnap) return Promise.resolve(dzDefaultsSnap);
return fetch("styles/" + themeFolder + "/theme.json", { cache: "no-cache", credentials: "include" })
.then(function(r) { return r.json(); })
.then(function(localJson) { dzDefaultsSnap = dzSettingsSnapshot(localJson); return dzDefaultsSnap; });
}
function dzSnapIsEmpty(snap) {
return !snap || (Object.keys(snap.features || {}).length === 0 && Object.keys(snap.values || {}).length === 0);
}
function dzBuildInstanceWrite(scopeToPatch) {
var base = !dzSnapIsEmpty(dzApiState.instanceSnap) ? JSON.parse(JSON.stringify(dzApiState.instanceSnap))
: JSON.parse(JSON.stringify(dzDefaultsSnap));
var current = dzSettingsSnapshot(theme);
["features", "values"].forEach(function(part) {
Object.keys(current[part]).forEach(function(k) {
if (dzSettingScope(k) === scopeToPatch) base[part][k] = current[part][k];
});
});
return base;
}
function dzApiSaveSettings() {
if (dzApiState.noIdentity) return Promise.resolve({ ok: false, error: "no_identity" });
var asked = dzAccount;
if (!dzApiState.perUser) {
return dzApiWrite("themesettings_setdefault", "instance",
function() { return dzSettingsSnapshot(theme); }, asked)
.then(function(res) { if (res.ok) dzApiState.instanceSnap = res.snap; return res; });
}
var jobs = [dzApiWrite("themesettings_set", "user",
function() { return dzSnapshotSubset(dzSettingsSnapshot(theme), "user"); }, asked)
.then(function(res) { if (res.ok) dzApiState.userSnap = res.snap; return res; })];
if (dzIsAdmin()) jobs.push(dzApiSaveHouseIfChanged(asked));
return Promise.all(jobs).then(function(all) {
return all.every(function(r) { return r.ok; }) ? { ok: true } : all.find(function(r) { return !r.ok; });
});
}
function dzApiSaveHouseIfChanged(asked) {
if (arguments.length < 1) asked = dzAccount;
return dzEnsureDefaultsSnap().then(function() {
var patched = dzBuildInstanceWrite("house");
if (JSON.stringify(patched) === JSON.stringify(dzApiState.instanceSnap)) return { ok: true };
return dzApiWrite("themesettings_setdefault", "instance",
function() { return dzBuildInstanceWrite("house"); }, asked)
.then(function(res) { if (res.ok) dzApiState.instanceSnap = res.snap; return res; });
}).catch(function() {
return dzApiFail({ error: "defaults_unreachable", message: "theme.json unreachable for the instance write baseline" });
});
}
function dzApiWriteInstanceFull(snap) {
return dzApiWrite("themesettings_setdefault", "instance", function() { return snap; }, dzAccount, true)
.then(function(res) { if (res.ok) dzApiState.instanceSnap = res.snap; return res; });
}
function dzApiPromote() {
var asked = dzAccount;
return dzEnsureDefaultsSnap().then(function() {
return dzApiWrite("themesettings_setdefault", "instance", function() { return dzBuildInstanceWrite("user"); }, asked)
.then(function(res) { if (res.ok) dzApiState.instanceSnap = res.snap; return res; });
}).catch(function() {
return dzApiFail({ error: "defaults_unreachable", message: "theme.json unreachable for the instance write baseline" });
});
}
function dzApiReset(param) {
var asked = dzAccount;
return dzEnqueueWrite(function() {
return dzWithSameAccount(asked, false, function() {
return dzApiPost({ param: param, theme: themeFolder, reset: "true" }).then(function(d) {
if (d.status === "OK") return { ok: true };
return dzApiFail(d);
});
});
});
}
function dzApiResetUser() { return dzApiReset("themesettings_set").then(function(r) { if (r.ok) { dzApiState.userSnap = null; dzApiState.tokens.user = ""; } return r; }); }
function dzApiResetHouse() {
var asked = dzAccount;
var empty = { schemaVersion: DZ_SETTINGS_SCHEMA_VERSION, features: {}, values: {} };
return dzEnqueueWrite(function() {
return dzWithSameAccount(asked, false, function() {
return dzApiWriteNow("themesettings_setdefault", "instance", function() { return empty; }, true);
});
}).then(function(r) { if (r.ok) dzApiState.instanceSnap = r.snap; return r; });
}
var unableCreateUserVariable = false;
function dzUnableToCreateUserVariable() { return unableCreateUserVariable; }
var DZ_LOAD_LOADED = "loaded";
var DZ_LOAD_EMPTY = "empty";
var DZ_LOAD_FAILED = "failed";
function dzThemeSettingsLoad() {
return new Promise(function(resolve) {
$.ajax({
url: "json.htm?type=command&param=getuservariables",
async: true, dataType: "json",
success: function(data) {
if (data.status == "ERR") {
$.get("json.htm?type=command&param=addlogmessage&message=Theme Error - The theme was unable to load your preferences from Domoticz.");
resolve(DZ_LOAD_FAILED); return;
}
if (data.status != "OK") { resolve(DZ_LOAD_FAILED); return; }
var had = false, pending = [];
dzLegacyLoaded = { list: null, watermark: undefined, mode: undefined, custom: false };
var featuresVarName = "theme-" + themeFolder + "-features";
var customVarName = "theme-" + themeFolder + "-custom";
var colorsVarName = "theme-" + themeFolder + "-colors";
$.each(data.result, function(i, value) {
if (value.Name == featuresVarName) { console.log(themeName + " - found theme feature settings in Domoticz database (user variable Idx: " + value.idx + ")"); had = true; theme.userfeaturesvariable = value.idx; pending.push(getFeatureThemeSettings(value.idx)); }
if (value.Name == customVarName) { console.log(themeName + " - found theme custom settings in Domoticz database (user variable Idx: " + value.idx + ")"); had = true; theme.usercustomsvariable = value.idx; pending.push(getCustomThemeSettings(value.idx)); }
if (value.Name == colorsVarName) { console.log(themeName + " - found theme colors settings in Domoticz database (user variable Idx: " + value.idx + ")"); had = true; theme.usercolorsvariable = value.idx; pending.push(getColorsThemeSettings(value.idx)); }
});
if (!had) { resolve(DZ_LOAD_EMPTY); return; }
Promise.all(pending).then(dzApplyLegacyFeatures).then(dzApplyLegacySchemeMode).catch(function(e) {
if (typeof dzLog === "function") {
dzLog("settings", "legacy_features_failed", { error: String(e && e.message || e) });
}
}).then(function() { resolve(DZ_LOAD_LOADED); });
},
error: function() {
console.warn(themeName + " - could not reach Domoticz to load theme settings (permission, login, or connection); keeping current values");
resolve(DZ_LOAD_FAILED);
}
});
});
}
function dzThemeSettingsSave(action) {
return dzEnqueueWrite(function() { return dzThemeSettingsSaveNow(action); });
}
function dzThemeSettingsSaveNow(action) {
if (themeFolder === "undefined") return Promise.resolve();
var settings = [];
$.each(theme.features, function(key, feature) { if (feature.enabled === true) settings.push(feature.id); });
var custom = [
theme.standby_after, theme.button_name, theme.custom_url,
theme.logo, theme.icons, theme.background_img, theme.background_type,
theme.scheme, theme.scheme_base, theme.user_schemes,
theme.card_min_width, theme.card_max_width, theme.dashboard_camera_refresh,
theme.warn_repeat, dzLegacyFeatureWatermark(theme.features),
theme.scheme_mode
];
function saveVariable(varName, value) {
var body = new URLSearchParams();
body.set("type", "command");
body.set("param", action + "uservariable");
body.set("vname", varName);
body.set("vtype", "2");
body.set("vvalue", value);
function notifyFailed() {
if (typeof generate_noty === "function") {
generate_noty("error", dzT("toasts.save_failed_local"), 6000);
}
}
return fetch("json.htm", { method: "POST", credentials: "include", body: body })
.then(function(r) {
if (!r.ok) {
console.warn(themeName + " - HTTP " + r.status + " saving theme settings uservariable (" + varName + "), values kept in this browser only");
notifyFailed();
return null;
}
return r.json();
})
.then(function(data) {
if (!data) return;
if (data.status == "ERR") {
console.warn(themeName + " - unable to create or update theme settings uservariable (" + varName + "), values kept in this browser only");
if (varName.indexOf("-features") !== -1) unableCreateUserVariable = true;
notifyFailed();
}
if (data.status == "OK") {
console.log(themeName + " - theme settings uservariable is updated");
}
})
.catch(function() {
console.warn(themeName + " - ajax error saving theme settings uservariable (" + varName + ")");
notifyFailed();
});
}
return Promise.all([
saveVariable("theme-" + themeFolder + "-features", JSON.stringify(settings)),
saveVariable("theme-" + themeFolder + "-custom", JSON.stringify(custom)),
saveVariable("theme-" + themeFolder + "-colors", JSON.stringify(theme.color_scheme))
]);
}
function getThemeUserVar(idx, settingType, applyFn) {
return new Promise(function(resolve) {
$.ajax({
url: "json.htm?type=command&param=getuservariable&idx=" + idx,
async: true, dataType: "json",
success: function(data) {
if (data.status == "ERR") {
console.log(themeName + " - Although they seem to exist, there was an error loading theme preferences from Domoticz");
$.get("json.htm?type=command&param=addlogmessage&message=Theme Error - The theme was unable to load your user variable.");
}
if (data.status == "OK") {
try { applyFn(JSON.parse(data.result[0].Value)); cacheThemeSettings(); }
catch (e) { console.warn(themeName + " - stored " + settingType + " settings in user variable #" + idx + " are not valid JSON, keeping current values: " + e.message); }
}
resolve();
},
error: function() {
console.warn(themeName + " - error reading " + settingType + " settings from Domoticz user variable #" + idx);
resolve();
}
});
});
}
var DZ_LEGACY_UNMARKED_KNOWN_MAX = 48;
var DZ_LEGACY_NOTIFICATION_ID = 29;
function dzLegacyWatermarkValid(w) {
return typeof w === "number" && isFinite(w) && w >= 0 && Math.floor(w) === w;
}
function dzLegacyFeatureStates(list, watermark, features, defaults) {
var marked = dzLegacyWatermarkValid(watermark);
var known = marked ? watermark : DZ_LEGACY_UNMARKED_KNOWN_MAX;
var has = function(id) { return list.indexOf(id) > -1; };
var out = {};
Object.keys(features).forEach(function(key) {
var id = features[key].id;
out[key] = id > known ? defaults[key] === true : has(id);
});
if (!marked) {
var timeout = features.warn_timeout, battery = features.warn_battery;
if (has(DZ_LEGACY_NOTIFICATION_ID)) {
if (timeout) out.warn_timeout = true;
if (battery) out.warn_battery = true;
if (features.rgbw_popup) out.rgbw_popup = defaults.rgbw_popup === true;
} else if (timeout && battery && !has(timeout.id) && !has(battery.id)) {
out.warn_timeout = defaults.warn_timeout === true;
out.warn_battery = defaults.warn_battery === true;
}
}
return out;
}
function dzLegacyFeatureWatermark(features) {
var max = 0;
Object.keys(features).forEach(function(key) {
if (typeof features[key].id === "number" && features[key].id > max) max = features[key].id;
});
return max;
}
var dzLegacyLoaded = { list: null, watermark: undefined, mode: undefined, custom: false };
function getFeatureThemeSettings(idx) {
return getThemeUserVar(idx, "feature", function(enabledFeatureIds) {
if (Array.isArray(enabledFeatureIds)) dzLegacyLoaded.list = enabledFeatureIds;
});
}
function dzApplyLegacyFeatures() {
if (!dzLegacyLoaded.list) return Promise.resolve();
var list = dzLegacyLoaded.list, watermark = dzLegacyLoaded.watermark;
return dzEnsureDefaultsSnap().catch(function() { return null; }).then(function(snap) {
var defaults = {};
$.each(theme.features, function(key, feature) {
defaults[key] = snap && snap.features && Object.prototype.hasOwnProperty.call(snap.features, key)
? snap.features[key] === true : feature.enabled === true;
});
var states = dzLegacyFeatureStates(list, watermark, theme.features, defaults);
$.each(theme.features, function(key, feature) { feature.enabled = states[key]; });
cacheThemeSettings();
});
}
function dzApplyLegacySchemeMode() {
if (dzLegacyLoaded.custom) { theme.scheme_mode = dzLegacyLoaded.mode; }
dzNormaliseSchemeMode(theme);
cacheThemeSettings();
}
function getCustomThemeSettings(idx) {
return getThemeUserVar(idx, "custom", function(c) {
dzLegacyLoaded.custom = true;
theme.standby_after = c[0]; theme.button_name = c[1]; theme.custom_url = c[2];
theme.logo = c[3]; theme.icons = c[4]; theme.background_img = c[5]; theme.background_type = c[6];
if (c.length > 8) { theme.scheme = c[7]; theme.scheme_base = c[8]; }
if (c.length > 9 && Array.isArray(c[9])) { theme.user_schemes = c[9]; }
if (c.length > 11) { if (c[10] !== undefined) theme.card_min_width = c[10]; if (c[11] !== undefined) theme.card_max_width = c[11]; }
if (c.length > 12 && c[12] !== undefined) theme.dashboard_camera_refresh = c[12];
if (c.length > 13 && c[13] !== undefined) theme.warn_repeat = c[13];
if (c.length > 14) dzLegacyLoaded.watermark = c[14];
if (c.length > 15) dzLegacyLoaded.mode = c[15];
});
}
function getColorsThemeSettings(idx) {
return getThemeUserVar(idx, "colors", function(colorScheme) { theme.color_scheme = colorScheme; });
}
