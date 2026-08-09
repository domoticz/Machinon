/* Settings persistence: the theme object's round-trip between the browser
   (localStorage cache) and Domoticz (native ThemeSettingsAPI where the core
   supports it, else three theme-<folder>-* user variables; both transports
   live in settings-transport.js so settings follow the user across
   browsers). UI wiring lives in theme-hub.js (the settings hub); feature
   file loading in feature-loader.js. */

/* Pristine theme.json defaults, snapshotted once on a cold boot (see
   loadSettings below) before any cache or server overlay touches theme.
   Stays null on a warm boot (theme paints from the localStorage cache
   instead of a fresh theme.json fetch) unless a native-API write later
   needs the factory baseline and lazily resolves it itself: see
   dzEnsureDefaultsSnap in settings-transport.js, the only other writer of
   this var, used by dzBuildInstanceWrite's fallback base (Task 3) and the
   seeding path (Task 4). */
var dzDefaultsSnap = null;

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
                    /* Pristine factory values, captured before any cache or
                       server overlay touches theme: the base for native-API
                       instance writes and promote (Tasks 3 and 5). */
                    dzDefaultsSnap = dzSettingsSnapshot(theme);
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
            // Features added after a user's settings were cached: seed a default so
            // downstream feature reads never hit an unknown key.
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

/* Uservariable transport (getters, setters, the three-variable read/write)
   lives in settings-transport.js now; these are the public entry points call
   sites in this file (and schemes.js/theme-hub.js) use. */

/* Settings load entry point: probes the native ThemeSettingsAPI
   (settings-transport.js) and routes to it when the running core supports
   it, falling back to the legacy uservariable transport otherwise. Name kept:
   reconcileDomoticzSettingsInPlace (below) is its only caller, reached from
   custom.js's boot chain. */
function checkUserVariableThemeSettings() {
    return dzProbeThemeSettingsAPI().then(function(capable) {
        if (!capable) return checkUserVariableThemeSettingsLegacy();
        return dzApiLoad().then(function(outcome) {
            if (outcome === DZ_LOAD_EMPTY) return dzSeedFromLegacyIfPossible(); /* Task 4 */
            return undefined; /* LOADED: dzApiLoad already merged onto theme and cached. FAILED: fail closed, no writes. */
        });
    });
}

/* Legacy uservariable load, resolved as the specced ordered overlay layers:
   what painted (defaults or cache) <- stored uservariable snapshot <-
   per-user (null; per-user storage for cores without the native API never
   shipped, so this third layer stays permanently null here -- the native
   transport above is what actually carries per-user data now). The overlay
   call is readiness scaffolding kept for cores without the API: today's
   transport appliers fully populate theme from the stored vars, so stored
   has no gaps for defaults to fill and the merge is a functional no-op.
   Keeps the localStorage cache write and the genuine first-visit seed.
   Fail closed: dzThemeSettingsLoad returns a tri-state so a transient failure
   (DZ_LOAD_FAILED) leaves the theme object exactly as it painted and writes
   NOTHING; only a real success-but-empty (DZ_LOAD_EMPTY) seeds. */
function checkUserVariableThemeSettingsLegacy() {
    var defaults = dzSettingsSnapshot(theme);
    return dzThemeSettingsLoad().then(function(outcome) {
        if (outcome === DZ_LOAD_LOADED) {
            var stored = dzSettingsSnapshot(theme); /* dzThemeSettingsLoad already merged the vars into theme; snapshot captures them */
            dzApplySnapshot(theme, dzMergeSettingsLayers(defaults, stored, null));
            cacheThemeSettings();
            return;
        }
        if (outcome === DZ_LOAD_EMPTY) {
            /* First-ever visit (load succeeded, no theme vars yet): persist
               current defaults as the profile. */
            return storeUserVariableThemeSettings(dzUnableToCreateUserVariable() ? "update" : "add");
        }
        /* DZ_LOAD_FAILED: state unknown, the vars may already exist. Do nothing:
           defaults stand, no write on failure. */
    });
}

/* Save entry point: routes to the native ThemeSettingsAPI writer when the
   running core supports it, falling back to the legacy uservariable writer
   otherwise. action ("add"/"update") is legacy-only -- dzThemeSettingsSave
   still needs it to pick the right uservariable command, but the native API
   upserts unconditionally, so dzApiSaveSettings ignores it. */
function storeUserVariableThemeSettings(action) {
    if (dzApiState.capable === true) return dzApiSaveSettings();
    return dzThemeSettingsSave(action);
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
