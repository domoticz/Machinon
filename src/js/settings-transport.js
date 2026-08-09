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

/* window.my_config (userrights, dzIsAdmin's only source) is set
   asynchronously by core's Angular permissions bootstrap
   (app/app.permissions.js setPermissions()), which races the synchronous
   jQuery boot chain the theme runs on -- the same root cause custom.js's
   checkAngular poll already documents ("core owns Angular, so there is no
   event a theme can subscribe to before it has booted"). dzApiSaveSettings'
   dzIsAdmin() check fires long after boot (a user-triggered save), so it
   never meets an unset my_config; this seeding path runs automatically at
   cold-boot time instead, and an instant read of dzIsAdmin() here reliably
   loses that race (confirmed via TDD: task-4 harness, brief Step 1),
   silently skipping the whole migration with no log and no retry (theme
   stays on factory defaults for the session instead of the legacy-loaded
   values). Poll
   briefly instead of trusting the instant read, same bounded-setInterval
   idiom as checkAngular: ~3s is generous against a real Angular bootstrap
   but still resolves promptly for a genuinely anonymous/non-admin viewer
   once my_config never shows up. Never rejects. */
function dzWaitForAdminKnown() {
    if (window.my_config) return Promise.resolve(dzIsAdmin());
    return new Promise(function(resolve) {
        var attempts = 0;
        var poll = setInterval(function() {
            attempts++;
            if (window.my_config || attempts >= 30) {
                clearInterval(poll);
                resolve(dzIsAdmin());
            }
        }, 100);
    });
}

/* API core, no native rows yet: if this session may write the instance
   layer and legacy uservariables exist, migrate them once into the
   instance defaults. The legacy loader (dzThemeSettingsLoad) already
   applies onto theme, so a full snapshot afterwards IS the migrated
   single-layer state. Legacy variables are left in place, frozen (the
   downgrade story, spec): a core rolled back to a version without the
   native API still finds its uservariables untouched. Fail closed
   (task-3 review carry-forward): dzThemeSettingsLoad and
   dzApiWriteInstanceFull never reject on their own (traced: the ajax/fetch
   layers underneath both resolve tri-state/ok-flag outcomes rather than
   rejecting), but the synchronous cacheThemeSettings()/JSON.stringify call
   in between can still throw (e.g. localStorage quota in private
   browsing), and a throw inside a .then callback becomes a rejection of
   this promise. The outer .catch is the backstop: log and stop, keep the
   legacy-loaded values already painted onto theme for this session, and
   retry the migration on a future load. Never rejects. */
function dzSeedFromLegacyIfPossible() {
    return dzWaitForAdminKnown().then(function(isAdmin) {
        if (!isAdmin) return;
        return dzThemeSettingsLoad().then(function(outcome) {
            if (outcome !== DZ_LOAD_LOADED) return; /* no legacy vars or unreachable: nothing to seed */
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

/* ---- Native ThemeSettings transport: writes (setdefault/set, promote,
   resets, conflict retry). ---- */

function dzApiPost(params) {
    var body = new URLSearchParams(params); body.set("type", "command");
    return fetch("json.htm", { method: "POST", credentials: "include", body: body })
        .then(function(r) { return r.json(); })
        .catch(function() { return { status: "ERR", error: "unreachable" }; });
}

/* One write with one conflict retry: re-read layers, rebuild via buildFn
   (so the retry applies the change on top of the fresh state), resend. */
function dzApiWrite(param, layer, buildFn) {
    function attempt() {
        var payload = { param: param, theme: themeFolder,
                        value: JSON.stringify(buildFn()), lastupdate: dzApiState.tokens[layer] || "" };
        return dzApiPost(payload);
    }
    return attempt().then(function(d) {
        if (d.status === "OK") { dzApiState.tokens[layer] = d.lastupdate || ""; return { ok: true }; }
        if (d.error === "conflict") {
            return dzApiLoad().then(attempt).then(function(d2) {
                if (d2.status === "OK") { dzApiState.tokens[layer] = d2.lastupdate || ""; return { ok: true }; }
                return dzApiFail(d2);
            });
        }
        return dzApiFail(d);
    });
}

function dzApiFail(d) {
    var err = (d && d.error) || "unknown";
    if (err === "no_identity") dzApiState.noIdentity = true;
    console.warn("machinon_themesettings", "write_failed", "error=" + err, (d && d.message) || "");
    if (typeof ShowNotify === "function") ShowNotify("Theme settings could not be saved (" + err + ")", 4000);
    return { ok: false, error: err };
}

/* dzDefaultsSnap (settings-store.js) is populated on a cold boot only: the
   warm-boot branch of loadSettings paints from the localStorage cache and
   never re-fetches theme.json, so on a warm boot it stays null for the
   entire page lifetime unless something asks for it. dzBuildInstanceWrite's
   fallback base needs the real factory snapshot, not a null one, whenever
   there is no instance row to fall back to yet -- a null base would make it
   throw on the "features"/"values" index (or, if guarded loosely, write a
   partial row that silently drops every factory default). Resolves the same
   theme.json the boot path reads, normalized through the same
   dzSettingsSnapshot the boot path uses, so a warm-boot write ends up with
   an identical baseline to what a cold boot would have captured. Memoized:
   once resolved, dzDefaultsSnap stays set for the rest of the page's life,
   same as the cold-boot capture. */
function dzEnsureDefaultsSnap() {
    if (dzDefaultsSnap) return Promise.resolve(dzDefaultsSnap);
    return fetch("styles/" + themeFolder + "/theme.json", { cache: "no-cache", credentials: "include" })
        .then(function(r) { return r.json(); })
        .then(function(localJson) { dzDefaultsSnap = dzSettingsSnapshot(localJson); return dzDefaultsSnap; });
}

/* Base for instance writes: last-read instance row, else factory defaults.
   Patch only the given scope's keys from the current theme so an instance
   write never absorbs the admin's personal per-user values (spec: promote
   is deliberate, house edits patch house keys only). Callers that may need
   the factory-defaults fallback (dzApiState.instanceSnap null) must resolve
   dzEnsureDefaultsSnap() first; this stays a plain synchronous function so
   dzApiWrite's conflict retry can keep calling it as a buildFn, rebuilding
   the patch on top of whatever dzApiLoad's retry just refreshed. */
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
        /* Single shared identity (nowwwpwd / trusted network): one layer. */
        return dzApiWrite("themesettings_setdefault", "instance",
            function() { return dzSettingsSnapshot(theme); })
            .then(function(res) { if (res.ok) dzApiState.instanceSnap = dzSettingsSnapshot(theme); return res; });
    }
    var jobs = [dzApiWrite("themesettings_set", "user",
        function() { return dzSnapshotSubset(dzSettingsSnapshot(theme), "user"); })
        .then(function(res) { if (res.ok) dzApiState.userSnap = dzSnapshotSubset(dzSettingsSnapshot(theme), "user"); return res; })];
    if (dzIsAdmin()) jobs.push(dzApiSaveHouseIfChanged());
    return Promise.all(jobs).then(function(all) {
        return all.every(function(r) { return r.ok; }) ? { ok: true } : all.find(function(r) { return !r.ok; });
    });
}

/* House-scope half of an admin save. dzBuildInstanceWrite needs the
   factory-defaults fallback whenever dzApiState.instanceSnap is null (a
   theme that has never had an instance row written yet), so this resolves
   dzEnsureDefaultsSnap() first (a no-op once it is already populated). */
function dzApiSaveHouseIfChanged() {
    return dzEnsureDefaultsSnap().then(function() {
        var patched = dzBuildInstanceWrite("house");
        /* Identity check on same-shaped builds (both sides are produced by
           dzBuildInstanceWrite/dzApiState.instanceSnap, not semantic
           diffing): skips a no-op instance write when nothing house-scoped
           actually changed. */
        if (JSON.stringify(patched) === JSON.stringify(dzApiState.instanceSnap)) return { ok: true };
        return dzApiWrite("themesettings_setdefault", "instance",
            function() { return dzBuildInstanceWrite("house"); })
            .then(function(res) { if (res.ok) dzApiState.instanceSnap = dzBuildInstanceWrite("house"); return res; });
    }).catch(function() {
        return dzApiFail({ error: "defaults_unreachable", message: "theme.json unreachable for the instance write baseline" });
    });
}

function dzApiWriteInstanceFull(snap) {
    return dzApiWrite("themesettings_setdefault", "instance", function() { return snap; })
        .then(function(res) { if (res.ok) dzApiState.instanceSnap = snap; return res; });
}

function dzApiPromote() {
    return dzEnsureDefaultsSnap().then(function() {
        return dzApiWrite("themesettings_setdefault", "instance", function() { return dzBuildInstanceWrite("user"); })
            .then(function(res) { if (res.ok) dzApiState.instanceSnap = dzBuildInstanceWrite("user"); return res; });
    }).catch(function() {
        return dzApiFail({ error: "defaults_unreachable", message: "theme.json unreachable for the instance write baseline" });
    });
}

function dzApiReset(param) {
    return dzApiPost({ param: param, theme: themeFolder, reset: "true" }).then(function(d) {
        if (d.status === "OK") return { ok: true };
        return dzApiFail(d);
    });
}
function dzApiResetUser() { return dzApiReset("themesettings_set").then(function(r) { if (r.ok) { dzApiState.userSnap = null; dzApiState.tokens.user = ""; } return r; }); }
function dzApiResetHouse() { return dzApiReset("themesettings_setdefault").then(function(r) { if (r.ok) { dzApiState.instanceSnap = null; dzApiState.tokens.instance = ""; } return r; }); }

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
