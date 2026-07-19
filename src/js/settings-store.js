/* Settings persistence: the theme object's round-trip between the browser
   (localStorage cache) and Domoticz (three theme-<folder>-* user variables,
   so settings follow the user across browsers). UI wiring lives in
   settings-ui.js; feature file loading in feature-loader.js. */

/* The theme object's localStorage cache. Plain functions instead of the old
   Storage.prototype monkey-patch: no global prototype pollution, and every
   caller stores the same thing, so the key/value pair lives here once. */
function cacheThemeSettings() {
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

function loadSettings() {
    if (typeof Storage !== "undefined") {
        if (localStorage.getItem(themeFolder + ".themeSettings") === null) {
            return fetch("styles/" + themeFolder + "/theme.json", { cache: "no-cache", credentials: "include" })
                .then(function(response) { return response.json(); })
                .then(function(localJson) {
                    theme = localJson;
                    themeName = theme.name;
                    if (isEmptyObject(theme) === false) {
                        cacheThemeSettings();
                    }
                    /* Perf-report F3 (task-9-perf-report.md 2.2): this branch used to
                       schedule setTimeout(location.reload, 3000) after caching the
                       defaults, so the Domoticz-stored settings could paint on a second
                       full boot. That doubled a ~11s mobile load to ~19-20s and opened a
                       visible race: defaults paint, then the async DB merge + delayed
                       reload swap the settled state in mid-window (task-2-report.md
                       "pre-existing settings race"). The defaults paint now stands and
                       reconcileDomoticzSettingsInPlace() applies the DB delta live. */
                    console.log(themeName + " - local theme settingsfile loaded and saved to localStorage");
                })
                .catch(function(error) {
                    console.log("Machinon - failed to load theme.json:", error);
                });
        } else {
            theme = readCachedThemeSettings();
            themeName = theme.name;
            console.log(themeName + " - theme settings was already found in the browser.");
            // Features added after a user's settings were cached: seed a default instead of
            // hitting the unknown-feature reset prompt in loadSettingsHTML.
            if (theme.features && !theme.features.hide_logo) {
                theme.features.hide_logo = { id: 42, enabled: false, files: [] };
            }
            if (theme.features && !theme.features.log_plot_bands) {
                theme.features.log_plot_bands = { id: 43, enabled: true, files: ["log_ranges.js"] };
            }
            // Settings cached before the scheme picker existed: derive the
            // selection from the legacy feature flags.
            if (theme.features && !theme.scheme) {
                theme.scheme = theme.features.custom_color_scheme && theme.features.custom_color_scheme.enabled ? "custom"
                    : (theme.features.dark_theme && theme.features.dark_theme.enabled ? "dark" : "light");
                theme.scheme_base = theme.features.dark_theme && theme.features.dark_theme.enabled ? "dark" : "light";
            }
        }
    }
    return Promise.resolve();
}

var unableCreateUserVariable = false;

/* Fetch the theme's Domoticz-stored settings and merge them into the in-memory
   theme object. Resolves once every present user variable has been read (or on
   any failure, so the barrier never hangs). Fail closed: a failed fetch leaves
   the theme.json defaults in place, and the resolved promise carries no error
   so the caller simply finds no delta to apply. */
function checkUserVariableThemeSettings() {
    return new Promise(function(resolve) {
        $.ajax({
            url: "json.htm?type=command&param=getuservariables",
            async: true,
            dataType: "json",
            success: function(data) {
                if (data.status == "ERR") {
                    $.get("json.htm?type=command&param=addlogmessage&message=Theme Error - The theme was unable to load your preferences from Domoticz.");
                    resolve();
                    return;
                }
                if (data.status != "OK") {
                    resolve();
                    return;
                }
                var didDomoticzHaveSettings = false;
                var pending = [];
                var featuresVarName = "theme-" + themeFolder + "-features";
                var customVarName = "theme-" + themeFolder + "-custom";
                var colorsVarName = "theme-" + themeFolder + "-colors";
                $.each(data.result, function(variable, value) {
                    if (value.Name == featuresVarName) {
                        console.log(themeName + " - found theme feature settings in Domoticz database (user variable Idx: " + value.idx + ")");
                        didDomoticzHaveSettings = true;
                        theme.userfeaturesvariable = value.idx;
                        pending.push(getFeatureThemeSettings(value.idx));
                    }
                    if (value.Name == customVarName) {
                        console.log(themeName + " - found theme custom settings in Domoticz database (user variable Idx: " + value.idx + ")");
                        didDomoticzHaveSettings = true;
                        theme.usercustomsvariable = value.idx;
                        pending.push(getCustomThemeSettings(value.idx));
                    }
                    if (value.Name == colorsVarName) {
                        console.log(themeName + " - found theme colors settings in Domoticz database (user variable Idx: " + value.idx + ")");
                        didDomoticzHaveSettings = true;
                        theme.usercolorsvariable = value.idx;
                        pending.push(getColorsThemeSettings(value.idx));
                    }
                });
                if (didDomoticzHaveSettings === false) {
                    /* First-ever visit: persist the current (default) theme so future
                       visits have a profile. Nothing to reconcile, DB == what painted. */
                    if (unableCreateUserVariable == false) {
                        storeUserVariableThemeSettings("add");
                    } else {
                        storeUserVariableThemeSettings("update");
                    }
                    resolve();
                    return;
                }
                Promise.all(pending).then(function() { resolve(); });
            },
            error: function() {
                console.log("The theme was unable to check if Domoticz had theme settings. Permission denied? Still on login page? No connection? Stopping..");
                resolve();
            }
        });
    });
}

function storeUserVariableThemeSettings(action) {
    if (themeFolder === "undefined") return Promise.resolve();

    var settings = [];
    $.each(theme.features, function(key, feature) {
        if (feature.enabled === true) {
            settings.push(feature.id);
        }
    });

    /* Positional contract: readers index into this array, so only APPEND.
       7 and 8 (scheme picker selection + its token underlay) and 9 (saved
       colour presets) arrived after the first seven; older stored arrays
       simply lack them. */
    var custom = [
        theme.standby_after, theme.button_name, theme.custom_url,
        theme.logo, theme.icons, theme.background_img, theme.background_type,
        theme.scheme, theme.scheme_base, theme.user_schemes
    ];

    function saveVariable(varName, value) {
        var url = "json.htm?type=command&param=" + action + "uservariable&vname=" + varName + "&vtype=2&vvalue=" + encodeURIComponent(value);
        return fetch(url, { credentials: "include" })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.status == "ERR") {
                    bootbox.alert("Unable to create or update theme settings uservariable, Try to reset the theme");
                    if (varName.indexOf("-features") !== -1) unableCreateUserVariable = true;
                }
                if (data.status == "OK") {
                    console.log(themeName + " - theme settings uservariable is updated");
                }
            })
            .catch(function() {
                console.log(themeName + " - Ajax error while creating or updating user variable in Domoticz.");
            });
    }

    return Promise.all([
        saveVariable("theme-" + themeFolder + "-features", JSON.stringify(settings)),
        saveVariable("theme-" + themeFolder + "-custom", JSON.stringify(custom)),
        saveVariable("theme-" + themeFolder + "-colors", JSON.stringify(theme.color_scheme))
    ]);
}

/* Fetch one theme settings user variable and hand its parsed JSON value to
   applyFn; caching the merged theme to localStorage happens here, so appliers
   only mutate the in-memory theme object. Resolves when the read completes (or
   fails), so reconcileDomoticzSettingsInPlace can wait for all reads before it
   diffs and applies the delta. */
function getThemeUserVar(idx, settingType, applyFn) {
    return new Promise(function(resolve) {
        $.ajax({
            url: "json.htm?type=command&param=getuservariable" + "&idx=" + idx,
            async: true,
            dataType: "json",
            success: function(data) {
                if (data.status == "ERR") {
                    console.log(themeName + " - Although they seem to exist, there was an error loading theme preferences from Domoticz");
                    $.get("json.htm?type=command&param=addlogmessage&message=Theme Error - The theme was unable to load your user variable.");
                }
                if (data.status == "OK") {
                    /* Malformed stored JSON (hand-edited user variable) must not
                       throw past resolve(): a dangling promise would leave the
                       reconcile barrier waiting forever. Catch, warn, and fall
                       through to resolve so fail-closed stays airtight. */
                    try {
                        applyFn(JSON.parse(data.result[0].Value));
                        cacheThemeSettings();
                    } catch (e) {
                        console.warn(themeName + " - stored " + settingType + " settings in user variable #" + idx + " are not valid JSON, keeping current values: " + e.message);
                    }
                }
                resolve();
            },
            error: function() {
                console.log(themeName + " - ERROR reading " + settingType + " settings from Domoticz for theme " + theme.name + " from user variable #" + idx);
                resolve();
            }
        });
    });
}

function getFeatureThemeSettings(idx) {
    return getThemeUserVar(idx, "feature", function(enabledFeatureIds) {
        $.each(theme.features, function(key, feature) {
            feature.enabled = $.inArray(feature.id, enabledFeatureIds) > -1;
        });
    });
}

function getCustomThemeSettings(idx) {
    return getThemeUserVar(idx, "custom", function(customThemeSettings) {
        theme.standby_after = customThemeSettings[0];
        theme.button_name = customThemeSettings[1];
        theme.custom_url = customThemeSettings[2];
        theme.logo = customThemeSettings[3];
        theme.icons = customThemeSettings[4];
        theme.background_img = customThemeSettings[5];
        theme.background_type = customThemeSettings[6];
        /* Arrays stored before the scheme picker have no 7/8/9; keep the
           derived values from loadSettings in that case. */
        if (customThemeSettings.length > 8) {
            theme.scheme = customThemeSettings[7];
            theme.scheme_base = customThemeSettings[8];
        }
        if (customThemeSettings.length > 9 && Array.isArray(customThemeSettings[9])) {
            theme.user_schemes = customThemeSettings[9];
        }
    });
}

function getColorsThemeSettings(idx) {
    return getThemeUserVar(idx, "colors", function(colorScheme) {
        theme.color_scheme = colorScheme;
    });
}

/* Fingerprint of only the settings that drive visible state. The in-place
   reconcile compares before/after to decide whether the Domoticz-stored
   settings actually differ from what the defaults/cache already painted, and
   skips re-applying when they match, so the common case (DB == what is on
   screen) never re-flashes the page. */
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
        logo: t.logo, background_img: t.background_img, background_type: t.background_type
    });
}

/* Perf-report F3 (task-9-perf-report.md 2.2): the replacement for the
   first-visit setTimeout(location.reload). init_theme's ready block has already
   painted the defaults (cold) or the cache (warm); this merges the
   Domoticz-stored settings and applies ONLY the delta to the live document, so
   a first visit is a single boot instead of two (~11s saved on Fast-3G mobile)
   and the defaults->DB swap no longer needs a reload to become visible.
   Fail closed: checkUserVariableThemeSettings resolves without error on a failed
   fetch, so the defaults simply stand (no retry, no half-applied state). */
function reconcileDomoticzSettingsInPlace() {
    /* Snapshot the state the ready block just applied, before the DB merge
       mutates the theme object in place. */
    var before = JSON.parse(JSON.stringify(theme));
    return checkUserVariableThemeSettings().then(function() {
        applyThemeDeltaInPlace(before);
    });
}

function applyThemeDeltaInPlace(before) {
    if (!before || isEmptyObject(theme)) return;
    /* No visible setting changed between what painted and the DB merge: nothing
       to re-apply, so nothing re-flashes. */
    if (themeSettingsFingerprint(before) === themeSettingsFingerprint(theme)) return;

    /* Feature files must be diffed precisely: loading a file twice would stack a
       duplicate <link>/requirejs entry, and an already-executed feature script
       cannot be un-executed (feature-loader.js header). */
    var reloadNeeded = false;
    if (before.features && theme.features) {
        $.each(theme.features, function(key, feature) {
            var was = !!(before.features[key] && before.features[key].enabled === true);
            var now = feature.enabled === true;
            if (was === now) return;
            var files = feature.files || [];
            var hasJs = files.some(function(f) { return f.split(".").pop() === "js"; });
            if (now && !was) {
                /* Newly enabled by the stored profile: load its files in place. */
                if (files.length) { loadThemeFeatureFiles(key); }
            } else if (hasJs) {
                /* The ONE residual reload (task-9-perf-report.md F3): a JS-backed
                   feature the defaults enable but the stored profile disables.
                   An executed script cannot be unloaded, so only a document boot
                   truly turns it off. Reached solely on a first visit from a
                   browser with an empty cache while the account already stored a
                   profile with such a feature turned off; a warm visit paints
                   from that same profile, so it does not hit this path. */
                reloadNeeded = true;
            } else if (files.length) {
                /* CSS-only feature newly disabled: unload its stylesheet in place. */
                unloadThemeFeatureFiles(key);
            }
        });
    }
    if (reloadNeeded) { location.reload(); return; }

    /* Idempotent visual appliers: each reduces its stored value through
       setProperty/attr/class, so re-applying an unchanged value is a no-op
       paint. Flag-driven card details (time_ago, switch scenes, ...) with no
       files re-render on the next Domoticz device poll. */
    setColorScheme();
    applyCardWidths();
    setLogo();
    applyBackground();
    applyNavbarIconsText();
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
