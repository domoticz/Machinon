var DZ_SETTINGS_SCHEMA_VERSION = 2;
var DZ_SETTINGS_MIGRATIONS = [
function (snap) {
if (!snap.features || !("notification" in snap.features)) return;
var was = snap.features.notification === true;
if (!("warn_timeout" in snap.features)) snap.features.warn_timeout = was;
if (!("warn_battery" in snap.features)) snap.features.warn_battery = was;
delete snap.features.notification;
}
];
function dzMigrateSnapshot(snap) {
if (!snap) return snap;
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
scheme: t.scheme, scheme_base: t.scheme_base,
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
function dzMergeConflict(baseSnap, intendedSnap, freshSnap) {
if (!freshSnap) return intendedSnap;
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
function dzApiWrite(param, layer, buildFn) {
return dzEnqueueWrite(function() { return dzApiWriteNow(param, layer, buildFn); });
}
function dzApiWriteNow(param, layer, buildFn) {
var baseSnap = dzApiLayerSnap(layer);
var intended = buildFn();
function send(snap) {
return dzApiPost({ param: param, theme: themeFolder,
value: JSON.stringify(snap), lastupdate: dzApiState.tokens[layer] || "" });
}
return send(intended).then(function(d) {
if (d.status === "OK") { dzApiState.tokens[layer] = d.lastupdate || ""; return { ok: true, snap: intended }; }
if (d.error !== "conflict") return dzApiFail(d);
return dzApiFetchLayers().then(function(outcome) {
var merged = (outcome === DZ_LOAD_FAILED) ? intended
: dzMergeConflict(baseSnap, intended, dzApiLayerSnap(layer));
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
function dzBuildInstanceWrite(scopeToPatch) {
var base = dzApiState.instanceSnap ? JSON.parse(JSON.stringify(dzApiState.instanceSnap))
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
if (!dzApiState.perUser) {
return dzApiWrite("themesettings_setdefault", "instance",
function() { return dzSettingsSnapshot(theme); })
.then(function(res) { if (res.ok) dzApiState.instanceSnap = res.snap; return res; });
}
var jobs = [dzApiWrite("themesettings_set", "user",
function() { return dzSnapshotSubset(dzSettingsSnapshot(theme), "user"); })
.then(function(res) { if (res.ok) dzApiState.userSnap = res.snap; return res; })];
if (dzIsAdmin()) jobs.push(dzApiSaveHouseIfChanged());
return Promise.all(jobs).then(function(all) {
return all.every(function(r) { return r.ok; }) ? { ok: true } : all.find(function(r) { return !r.ok; });
});
}
function dzApiSaveHouseIfChanged() {
return dzEnsureDefaultsSnap().then(function() {
var patched = dzBuildInstanceWrite("house");
if (JSON.stringify(patched) === JSON.stringify(dzApiState.instanceSnap)) return { ok: true };
return dzApiWrite("themesettings_setdefault", "instance",
function() { return dzBuildInstanceWrite("house"); })
.then(function(res) { if (res.ok) dzApiState.instanceSnap = res.snap; return res; });
}).catch(function() {
return dzApiFail({ error: "defaults_unreachable", message: "theme.json unreachable for the instance write baseline" });
});
}
function dzApiWriteInstanceFull(snap) {
return dzApiWrite("themesettings_setdefault", "instance", function() { return snap; })
.then(function(res) { if (res.ok) dzApiState.instanceSnap = res.snap; return res; });
}
function dzApiPromote() {
return dzEnsureDefaultsSnap().then(function() {
return dzApiWrite("themesettings_setdefault", "instance", function() { return dzBuildInstanceWrite("user"); })
.then(function(res) { if (res.ok) dzApiState.instanceSnap = res.snap; return res; });
}).catch(function() {
return dzApiFail({ error: "defaults_unreachable", message: "theme.json unreachable for the instance write baseline" });
});
}
function dzApiReset(param) {
return dzEnqueueWrite(function() {
return dzApiPost({ param: param, theme: themeFolder, reset: "true" }).then(function(d) {
if (d.status === "OK") return { ok: true };
return dzApiFail(d);
});
});
}
function dzApiResetUser() { return dzApiReset("themesettings_set").then(function(r) { if (r.ok) { dzApiState.userSnap = null; dzApiState.tokens.user = ""; } return r; }); }
function dzApiResetHouse() { return dzApiReset("themesettings_setdefault").then(function(r) { if (r.ok) { dzApiState.instanceSnap = null; dzApiState.tokens.instance = ""; } return r; }); }
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
var featuresVarName = "theme-" + themeFolder + "-features";
var customVarName = "theme-" + themeFolder + "-custom";
var colorsVarName = "theme-" + themeFolder + "-colors";
$.each(data.result, function(i, value) {
if (value.Name == featuresVarName) { console.log(themeName + " - found theme feature settings in Domoticz database (user variable Idx: " + value.idx + ")"); had = true; theme.userfeaturesvariable = value.idx; pending.push(getFeatureThemeSettings(value.idx)); }
if (value.Name == customVarName) { console.log(themeName + " - found theme custom settings in Domoticz database (user variable Idx: " + value.idx + ")"); had = true; theme.usercustomsvariable = value.idx; pending.push(getCustomThemeSettings(value.idx)); }
if (value.Name == colorsVarName) { console.log(themeName + " - found theme colors settings in Domoticz database (user variable Idx: " + value.idx + ")"); had = true; theme.usercolorsvariable = value.idx; pending.push(getColorsThemeSettings(value.idx)); }
});
if (!had) { resolve(DZ_LOAD_EMPTY); return; }
Promise.all(pending).then(function() { resolve(DZ_LOAD_LOADED); });
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
theme.warn_repeat
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
function getFeatureThemeSettings(idx) {
return getThemeUserVar(idx, "feature", function(enabledFeatureIds) {
$.each(theme.features, function(key, feature) { feature.enabled = $.inArray(feature.id, enabledFeatureIds) > -1; });
});
}
function getCustomThemeSettings(idx) {
return getThemeUserVar(idx, "custom", function(c) {
theme.standby_after = c[0]; theme.button_name = c[1]; theme.custom_url = c[2];
theme.logo = c[3]; theme.icons = c[4]; theme.background_img = c[5]; theme.background_type = c[6];
if (c.length > 8) { theme.scheme = c[7]; theme.scheme_base = c[8]; }
if (c.length > 9 && Array.isArray(c[9])) { theme.user_schemes = c[9]; }
if (c.length > 11) { if (c[10] !== undefined) theme.card_min_width = c[10]; if (c[11] !== undefined) theme.card_max_width = c[11]; }
if (c.length > 12 && c[12] !== undefined) theme.dashboard_camera_refresh = c[12];
if (c.length > 13 && c[13] !== undefined) theme.warn_repeat = c[13];
});
}
function getColorsThemeSettings(idx) {
return getThemeUserVar(idx, "colors", function(colorScheme) { theme.color_scheme = colorScheme; });
}
