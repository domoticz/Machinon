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
   this var, used by dzBuildInstanceWrite's fallback base and the seeding
   path. */
var dzDefaultsSnap = null;

/* The theme object's localStorage cache. Plain functions instead of the old
   Storage.prototype monkey-patch: no global prototype pollution, and every
   caller stores the same thing, so the key/value pair lives here once. */
/* Every path that finishes settling the theme object ends here: warm boot from
   the cache, cold boot from theme.json, the native ThemeSettings load and the
   legacy uservariable load all call it. That makes it the one place guaranteed
   to be reached once theme.features is final, which is why the diagnostics gate
   is recomputed from it.

   The gate cannot be left to diag.js's own load-time read: modules load before
   settings arrive, so that read always sees the defaults. Nor to
   applyThemeDeltaInPlace, which returns early when nothing changed, so a page
   whose stored settings simply match would never refresh at all. Measured: with
   only those two points the setting persisted across a reload while dzLogOn
   stayed false, i.e. the feature was on and silent. */
function cacheThemeSettings() {
    /* settled: every path that reaches here has the stored settings in hand, so
       this is the call that may discard the kernel buffer when the answer turns
       out to be off. diag.js's own load-time call cannot: it runs before the
       settings arrive and would throw away entries recorded before it loaded. */
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

/* Rebuild the theme object for a warm boot: the shipped theme.json decides
   everything that belongs to the INSTALL (metadata, feature ids, feature file
   lists, which features and settings exist at all), and the cache contributes
   only the user's choices, read through the same snapshot shape every other
   settings path uses and lifted by the same migration ladder.

   Restoring the cached object as-is froze all of that at the version that
   wrote it: an upgrade that renamed a feature file kept loading the old path,
   a new feature had to be hand-seeded here or every unguarded read of it was a
   TypeError, and the version and About links stayed stale. Keys the cache
   holds that theme.json does not (the legacy transport's uservariable idx,
   for one) are carried over untouched.

   shipped null means theme.json could not be read: the cache stands, with any
   manifest toggle it lacks seeded OFF and fileless, the safe default for a
   feature this boot knows nothing about. */
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

/* The cache's user choices as a snapshot. A cache carries no version stamp,
   so it is migrated from version 1 (every ladder step is safe on newer data,
   see DZ_SETTINGS_MIGRATIONS). */
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
    /* A key the ladder retired (renamed or split) leaves the feature table
       too, so nothing still reads it. */
    Object.keys(t.features).forEach(function(key) {
        if (!Object.prototype.hasOwnProperty.call(snap.features, key)) delete t.features[key];
    });
    dzApplySnapshot(t, snap);
    dzDeriveLegacyScheme(t);
    return t;
}

/* Settings cached before the scheme picker existed carry no scheme: derive the
   selection from the legacy feature flags it replaced. */
function dzDeriveLegacyScheme(t) {
    if (!t.features || t.scheme) return;
    t.scheme = t.features.custom_color_scheme && t.features.custom_color_scheme.enabled ? "custom"
        : (t.features.dark_theme && t.features.dark_theme.enabled ? "dark" : "light");
    t.scheme_base = t.features.dark_theme && t.features.dark_theme.enabled ? "dark" : "light";
}

/* True while the page runs on the shipped defaults because this browser had
   no cached settings: the Domoticz merge is the first time the user's own
   settings are known. */
var dzSettingsFromDefaults = false;

function loadSettings() {
    if (typeof Storage !== "undefined") {
        if (localStorage.getItem(themeFolder + ".themeSettings") === null) {
            dzSettingsFromDefaults = true;
            return fetch("styles/" + themeFolder + "/theme.json", { cache: "no-cache", credentials: "include" })
                .then(function(response) { return response.json(); })
                .then(function(localJson) {
                    theme = localJson;
                    themeName = theme.name;
                    /* Pristine factory values, captured before any cache or
                       server overlay touches theme: the base for native-API
                       instance writes and promote. */
                    dzDefaultsSnap = dzSettingsSnapshot(theme);
                    if (isEmptyObject(theme) === false) {
                        cacheThemeSettings();
                    }
                    /* Do not reload here to let Domoticz-stored settings paint on a
                       second boot: that doubles load time and opens a visible race
                       between the defaults paint and the async DB merge. The defaults
                       paint stands and reconcileDomoticzSettingsInPlace() applies the
                       DB delta live instead. */
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

/* Uservariable transport (getters, setters, the three-variable read/write)
   lives in settings-transport.js now; these are the public entry points call
   sites in this file (and schemes.js/theme-hub.js) use. */

/* Settings load entry point: probes the native ThemeSettingsAPI
   (settings-transport.js) and routes to it when the running core supports
   it, falling back to the legacy uservariable transport otherwise. Name kept:
   reconcileDomoticzSettingsInPlace (below) is its only caller, reached from
   custom.js's boot chain. */
function checkUserVariableThemeSettings() {
    /* Timed across the SETTLE, not around the call: both transports are
       asynchronous and neither rejects on failure, so the duration of the
       synchronous part measures nothing and "it returned" is not an outcome.
       The probe is inside the window on purpose: a core that has to be asked
       whether it supports the API is part of what a slow boot cost. */
    var startedAt = dzSettingsClock();
    return dzProbeThemeSettingsAPI().then(function(capable) {
        if (!capable) return checkUserVariableThemeSettingsLegacy(startedAt);
        return dzApiLoad().then(function(outcome) {
            dzSettingsLogLoad("native", outcome, startedAt);
            if (outcome === DZ_LOAD_EMPTY) return dzSeedFromLegacyIfPossible();
            return undefined; /* LOADED: dzApiLoad already merged onto theme and cached. FAILED: fail closed, no writes. */
        }, function(e) {
            dzSettingsLogLoad("native", "rejected", startedAt);
            throw e;
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
function checkUserVariableThemeSettingsLegacy(startedAt) {
    if (typeof startedAt !== "number") startedAt = dzSettingsClock();
    var defaults = dzSettingsSnapshot(theme);
    return dzThemeSettingsLoad().then(function(outcome) {
        dzSettingsLogLoad("legacy", outcome, startedAt);
        if (outcome === DZ_LOAD_LOADED) {
            /* dzThemeSettingsLoad already merged the vars into theme; the snapshot
               captures them. Nothing to migrate here: the legacy vars hold feature
               ids and positional values, which the loaders map straight onto the
               current theme.features, so a retired key cannot reach this point. */
            var stored = dzSettingsSnapshot(theme);
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
    var startedAt = dzSettingsClock();
    var transport = (dzApiState.capable === true) ? "native" : "legacy";
    var save = (transport === "native") ? dzApiSaveSettings() : dzThemeSettingsSave(action);
    /* The resolved value is passed through untouched, and a rejection is
       re-thrown after it is recorded: a diagnostic that swallowed a failed save
       would turn the one thing worth knowing into a silent success. */
    return save.then(function(res) {
        dzSettingsLogSave(transport, res, startedAt);
        return res;
    }, function(e) {
        dzSettingsLogSave(transport, { ok: false, error: "rejected" }, startedAt);
        throw e;
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
        scheme: t.scheme, scheme_base: t.scheme_base, scheme_mode: t.scheme_mode, color_scheme: t.color_scheme,
        card_min_width: t.card_min_width, card_max_width: t.card_max_width,
        logo: t.logo, background_img: t.background_img, background_type: t.background_type,
        button_name: t.button_name
    });
}

/* init_theme's ready block has already painted the defaults (cold) or the
   cache (warm); this merges the Domoticz-stored settings and applies ONLY
   the delta to the live document, so a first visit is a single boot instead
   of two and the defaults->DB swap no longer needs a reload to become
   visible. Fail closed: checkUserVariableThemeSettings resolves without
   error on a failed fetch, so the defaults simply stand (no retry, no
   half-applied state). */
function reconcileDomoticzSettingsInPlace() {
    /* Snapshot the state the ready block just applied, before the DB merge
       mutates the theme object in place. */
    var before = JSON.parse(JSON.stringify(theme));
    return checkUserVariableThemeSettings().then(function() {
        /* Retired-scheme repair (schemes.js DZ_SCHEME_MIGRATIONS): runs after
           the stored profile has merged, so it sees the real stored pick
           whichever transport carried it. Guarded because settings-store.js
           loads before schemes.js in custom.js's module list. */
        if (typeof migrateRetiredScheme === "function") { return migrateRetiredScheme(); }
        return false;
    }).then(function() {
        applyThemeDeltaInPlace(before);
        /* The colours repaint here and only here, through the resolver, so a
           boot whose painted variant is not the saved one paints once instead
           of the saved member first. Unconditional: the mode or the user's
           presets may have changed even when nothing else did, and an
           unchanged resolve paints nothing; forced when the colours behind an
           unchanged slug may be new, and when the boot left an early paint
           standing over the defaults (custom.js init_theme), because this is
           then the first paint of the real settings. */
        dzApplyColorMode(dzPaintInputs(before) !== dzPaintInputs(theme) ||
                         (dzSettingsFromDefaults && !!window.__dzEarlyPaint));
    }).catch(function(e) {
        /* A failed merge must not leave the early paint as the only one: with
           no resolve there is no dz:colormode (the switch stays hidden) and
           no repairFixedColors. While only the early block has painted, the
           resolver treats this call as forced; after a boot paint it paints
           only a changed slug. The caller logs the failure. */
        dzApplyColorMode();
        throw e;
    });
}

/* Everything a paint state is built from (scheme.js dzSavedPaintState,
   color-mode.js dzStateForSlug), as one comparable string. */
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
    /* No visible setting changed between what painted and the DB merge: nothing
       to re-apply, so nothing re-flashes. */
    if (themeSettingsFingerprint(before) === themeSettingsFingerprint(theme)) return;

    /* Feature files must be diffed precisely: loading a file twice would stack a
       duplicate <link>/requirejs entry, and an already-executed feature script
       cannot be un-executed (feature-loader.js header). */
    var reloadNeeded = false;
    if (before.features && theme.features) {
        $.each(theme.features, function(key, feature) {
            /* The painter owns dark_theme.css (feature-loader.js enableThemeFeatures). */
            if (key === "dark_theme") return;
            var was = !!(before.features[key] && before.features[key].enabled === true);
            var now = feature.enabled === true;
            if (was === now) return;
            var files = feature.files || [];
            var hasJs = files.some(function(f) { return f.split(".").pop() === "js"; });
            if (now && !was) {
                /* Newly enabled by the stored profile: load its files in place. */
                if (files.length) { loadThemeFeatureFiles(key); }
            } else if (hasJs) {
                /* The one case that still needs a reload: a JS-backed feature the
                   defaults enable but the stored profile disables. An executed
                   script cannot be unloaded, so only a document boot truly turns
                   it off. Reached solely on a first visit from a browser with an
                   empty cache while the account already stored a profile with
                   such a feature turned off; a warm visit paints from that same
                   profile, so it does not hit this path. */
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
       files re-render on the next Domoticz device poll. Colours are not
       among them: the caller repaints them through the resolver. */
    applyCardWidths();
    setLogo();
    dzApplyCustomPageLabel();
    applyBackground();
    applyNavbarIconsText();
    dzSyncModeToggles();
    dzDiagRefreshGate(true);
}

/* Everything this browser keeps for the theme: the settings cache and the
   colour state color-mode.js stores beside it. The settings stored in
   Domoticz are untouched. Private mode or blocked storage leaves nothing to
   clear. */
function dzClearThemeCache() {
    try {
        localStorage.removeItem(themeFolder + ".themeSettings");
    } catch (e) { /* nothing cached to clear */ }
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


/* Diagnostics contributors for the install's own identity. Registered here
   because this module owns the theme object every one of them reads.

   The build group is an explicit field-by-field projection, never a copied API
   response: core's getversion returns SystemName and DomoticzUpdateURL to an
   admin session, and an internal hostname has no business in a public issue. */
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
            /* Derived, never the raw user-agent string: see dzDiagEngine. */
            engine: (typeof dzDiagEngine === "function" && typeof navigator !== "undefined")
                ? dzDiagEngine(navigator.userAgent) : "unknown"
        };
    });

    /* Keys only, never the objects: their siblings in theme.json carry
       user-supplied values (custom_url, logo, background_img) that would put
       internal URLs and local paths into a pasted report. */
    dzDiagRegister("features", function() {
        var on = [];
        try {
            Object.keys((theme && theme.features) || {}).forEach(function(k) {
                if (theme.features[k] && theme.features[k].enabled === true) { on.push(k); }
            });
        } catch (e) { /* best effort */ }
        return { enabled: on };
    });
}
