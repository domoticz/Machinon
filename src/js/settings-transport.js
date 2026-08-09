/* Settings persistence seam + per-user readiness primitives. Everything that
   talks to Domoticz about theme settings lives here; settings-store.js owns
   the in-memory theme object and the appliers. Store is three uservariables
   (theme-<folder>-features/-custom/-colors): safe and isolated, cannot clobber
   core preferences. Native ThemeSettings storage was rejected (storesettings
   rewrites the whole settings form and blanks absent fields; see
   dz-themesettings-probe.js and the upstream issue). Per-user readiness:
   consumers resolve settings through dzMergeSettingsLayers(defaults, stored,
   perUser); perUser is null until core ships per-user storage, at which point
   it becomes a third layer here without touching callers. */

var DZ_SETTINGS_SCHEMA_VERSION = 1;

/* Deep-clone reference-typed values (icons array, user_schemes array,
   color_scheme object) so every snapshot owns its own copy. The overlay
   (Task 3) keeps several snapshots alive at once (defaults, stored, per-user);
   sharing a nested reference between them would let an in-place mutation of one
   silently leak into another. Scalars pass through untouched. The three
   reference-typed values are JSON-serializable, so a JSON round-trip is a safe
   and cheap deep clone. */
function dzCloneValue(v) {
    return (v && typeof v === "object") ? JSON.parse(JSON.stringify(v)) : v;
}

/* In-memory keyed snapshot. Feature enables are key->bool (not the on-disk
   positional id array): the hub page and the overlay merge want names, not
   ids. card_min_width/card_max_width are included although the legacy custom
   array never stored them (cache-only until now, a settings-do-not-follow-you
   gap this closes by appending them at positions 10/11 on save). */
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
            dashboard_camera_refresh: t.dashboard_camera_refresh
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
        for (var v in snap.values) {
            if (Object.prototype.hasOwnProperty.call(snap.values, v) &&
                snap.values[v] !== undefined) {
                /* Clone so the theme object never shares the snapshot's nested
                   references (see dzCloneValue). */
                t[v] = dzCloneValue(snap.values[v]);
            }
        }
    }
}

/* Ordered overlay: later non-null layers win per key. Today the call is
   dzMergeSettingsLayers(defaultsSnap, storedSnap, null). */
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
                    /* Clone so the merged result never aliases an input layer's
                       nested references (see dzCloneValue). */
                    out.values[v] = dzCloneValue(layer.values[v]);
                }
            }
        }
    });
    return out;
}

/* Filter a snapshot to one scope. The overlay writes ONLY the "user" subset,
   so house keys structurally cannot be overridden per user (spec). */
function dzSnapshotSubset(snap, scope) {
    var out = { schemaVersion: snap.schemaVersion, features: {}, values: {} };
    Object.keys(snap.features).forEach(function(k) {
        if (dzSettingScope(k) === scope) out.features[k] = snap.features[k];
    });
    Object.keys(snap.values).forEach(function(k) {
        if (dzSettingScope(k) === scope) out.values[k] = dzCloneValue(snap.values[k]);
    });
    return out;
}

/* ---- Native ThemeSettings transport (core ThemeSettingsAPI: 1). Wiki:
   core docs/Theming.wiki "Theme settings storage". Legacy uservariable
   transport below remains the store for cores without the API. ---- */

var dzApiState = { capable: null, perUser: false, tokens: { instance: "", user: "" },
                   instanceSnap: null, userSnap: null, noIdentity: false };

function dzIsAdmin() { return !!(window.my_config && window.my_config.userrights === 2); }

function dzSettingsMode() {
    return { api: dzApiState.capable === true, perUser: dzApiState.perUser,
             admin: dzIsAdmin(), noIdentity: dzApiState.noIdentity };
}

function dzProbeThemeSettingsAPI() {
    /* Test hook (same pattern as the rig's DZ_FAULT env-var injections, but
       set via page.addInitScript since it must be visible before any theme
       script runs): forces the legacy uservariable path so the harness can
       assert the fallback without needing a core that lacks the API. */
    if (window.__dzForceNoApi) { dzApiState.capable = false; return Promise.resolve(false); }
    if (dzApiState.capable !== null) return Promise.resolve(dzApiState.capable);
    return fetch("json.htm?type=command&param=getversion", { credentials: "include" })
        .then(function(r) { return r.json(); })
        .then(function(d) { dzApiState.capable = d && d.ThemeSettingsAPI === 1; return dzApiState.capable; })
        .catch(function() { dzApiState.capable = false; return false; });
}

/* Reads both layers + tokens, applies instance then user onto the theme
   object (which already holds theme.json defaults, so this IS the
   three-layer merge). Fail closed: FAILED keeps current values. */
function dzApiLoad() {
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
            if (dzApiState.instanceSnap) dzApplySnapshot(theme, dzApiState.instanceSnap);
            if (dzApiState.userSnap) dzApplySnapshot(theme, dzApiState.userSnap);
            cacheThemeSettings();
            return DZ_LOAD_LOADED;
        })
        .catch(function() {
            console.warn("machinon_themesettings", "load_unreachable", "keeping current values");
            return DZ_LOAD_FAILED;
        });
}

/* Task 4 stub: the real first-visit migration (copy a legacy uservariable
   profile into the native store) lands in the seeding task. This name only
   needs to exist now so checkUserVariableThemeSettings' DZ_LOAD_EMPTY branch
   (settings-store.js) is runnable ahead of that task. */
function dzSeedFromLegacyIfPossible() { return Promise.resolve(); } /* replaced in the seeding task */

/* ---- uservariable transport (moved verbatim from settings-store.js, with
   the two documented changes: card widths appended to the custom array, and
   bootbox.alert replaced by structured console.warn per the fail-closed
   rule). The three getters, getThemeUserVar, and the store body live here
   now; settings-store.js keeps only the thin public wrappers. ---- */

var unableCreateUserVariable = false;

/* Getter so settings-store.js does not reach across files for the raw flag;
   both are global-script scope at runtime, but the getter keeps the read
   explicit at the call site (task-3-brief.md Step 2). */
function dzUnableToCreateUserVariable() { return unableCreateUserVariable; }

/* Tri-state load outcome, shared by dzApiLoad above (native transport) and
   dzThemeSettingsLoad below (legacy transport). Each caller must tell a
   genuine first visit (DZ_LOAD_EMPTY: the request succeeded and nothing is
   stored yet, so seed it) apart from a transient failure (DZ_LOAD_FAILED:
   server ERR/non-OK or an ajax error, where the store may well already exist
   and a blind write would be an active write on failure). Collapsing both
   into a single false, as the boolean version did, made the first-visit seed
   fire on every network blip, contradicting the fail-closed contract. */
var DZ_LOAD_LOADED = "loaded"; /* at least one theme var found and read */
var DZ_LOAD_EMPTY = "empty";   /* request OK, but no theme vars present (true first visit) */
var DZ_LOAD_FAILED = "failed"; /* server error or unreachable; state unknown, do not write */

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
    if (themeFolder === "undefined") return Promise.resolve();
    var settings = [];
    $.each(theme.features, function(key, feature) { if (feature.enabled === true) settings.push(feature.id); });

    /* Positional contract: readers index into this array, APPEND ONLY. 0-6
       original; 7/8 scheme + base; 9 saved colour presets; 10/11 card widths
       (previously cache-only); 12 camera refresh seconds, closing the
       cache-only gap like 10/11 did for card widths. getCustomThemeSettings
       tolerates short arrays via length guards. */
    var custom = [
        theme.standby_after, theme.button_name, theme.custom_url,
        theme.logo, theme.icons, theme.background_img, theme.background_type,
        theme.scheme, theme.scheme_base, theme.user_schemes,
        theme.card_min_width, theme.card_max_width, theme.dashboard_camera_refresh
    ];

    function saveVariable(varName, value) {
        var url = "json.htm?type=command&param=" + action + "uservariable&vname=" + varName + "&vtype=2&vvalue=" + encodeURIComponent(value);
        return fetch(url, { credentials: "include" })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.status == "ERR") {
                    console.warn(themeName + " - unable to create or update theme settings uservariable (" + varName + "), values kept in this browser only");
                    if (varName.indexOf("-features") !== -1) unableCreateUserVariable = true;
                }
                if (data.status == "OK") {
                    console.log(themeName + " - theme settings uservariable is updated");
                }
            })
            .catch(function() { console.warn(themeName + " - ajax error saving theme settings uservariable (" + varName + ")"); });
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
                    /* Malformed stored JSON must not throw past resolve() or the
                       load barrier hangs forever. */
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
    });
}

function getColorsThemeSettings(idx) {
    return getThemeUserVar(idx, "colors", function(colorScheme) { theme.color_scheme = colorScheme; });
}
