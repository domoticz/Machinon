/* Built-in colour schemes: JSON presets for the custom-colour applier.
   A scheme file (schemes/<slug>.json) carries name, base ("light"/"dark":
   the token underlay its overrides sit on), preview swatches, and a colors
   object with exactly the keys applyCustomColorScheme() consumes. Picking a
   scheme copies its colors into theme.color_scheme and rides the existing
   custom_color_scheme plumbing: the setProperty applier (never composed
   <style> text), the localStorage cache and the Domoticz user-variable sync.
   Adding a scheme = adding a file plus an index.json entry. */

var BUILTIN_SCHEMES = null; /* slug -> scheme object, fetched once */
var BUILTIN_SCHEMES_P = null; /* the load in flight, shared by concurrent callers */

function loadBuiltinSchemes() {
    if (BUILTIN_SCHEMES) return Promise.resolve(BUILTIN_SCHEMES);
    if (BUILTIN_SCHEMES_P) return BUILTIN_SCHEMES_P;
    var base = "styles/" + themeFolder + "/schemes/";
    BUILTIN_SCHEMES_P = fetch(base + "index.json", { credentials: "include" })
        .then(function(r) { return r.json(); })
        .then(function(slugs) {
            return Promise.all(slugs.map(function(slug) {
                return fetch(base + slug + ".json", { credentials: "include" })
                    .then(function(r) { return r.json(); })
                    .then(function(scheme) { scheme.slug = slug; return scheme; });
            }));
        })
        .then(function(schemes) {
            var all = {};
            schemes.forEach(function(s) { all[s.slug] = s; });
            BUILTIN_SCHEMES = all;
            BUILTIN_SCHEMES_P = null;
            if (typeof dzRefreshPaintRecord === "function") { dzRefreshPaintRecord(); }
            return all;
        })
        .catch(function(e) {
            /* Not memoized: the next caller tries again. */
            BUILTIN_SCHEMES_P = null;
            if (typeof dzLog === "function") { dzLog("schemes", "load_failed", { error: String(e) }); }
            return {};
        });
    return BUILTIN_SCHEMES_P;
}

/* Retired slugs mapped to their survivor. A stored pick that no longer
   exists would otherwise leave the user on a dead slug: applyScheme finds no
   scheme and returns, so whatever painted stays and the picker shows
   nothing selected. Deleted schemes migrate BY THEIR OLD BASE (a Dracula
   user lands on Machinon Dark, not on the light default): the palette
   cannot survive, the light/dark intent can. blue-ui-light/-dark map to the
   base slugs because their values ARE the base tokens now, and e-ink is a
   pure rename. "custom" and "user:<name>" are user-owned and never
   migrated. Add every future retirement here too: a surviving slug must
   never appear in this map (see the Colors note in DESIGN.md). */
var DZ_SCHEME_MIGRATIONS = {
    "blue-ui-light":    "light",
    "blue-ui-dark":     "dark",
    "e-ink":            "paper-light",
    "catppuccin-latte": "light",
    "catppuccin-mocha": "dark",
    "tokyo-night":      "dark",
    "dracula":          "dark",
    "terra":            "dark",
    "golden-hour":      "dark",
    "nightfall":        "dark",
    "ultraviolet":      "dark",
    "ember":            "dark",
    "high-contrast":    "dark",
    "nord":             "dark",
    "solarized-light":  "light"
};

/* Pairing is declared metadata, not a filename convention: scheme JSONs and
   generated user pairs carry `pair` and `variant`. color-mode.js owns the
   grouping into light/dark families (dzSchemeFamilies, dzFamilyOf) and the
   choice of which member to paint. Generated user pairs use the slug form
   "user:<name>|<variant>"; legacy hand-saved presets have no pair and form
   single families. */

/* Pair ids must be unique within one install: a user may generate two pairs
   from the same seed colours and name them differently, and a name collision
   would otherwise merge them. The counter guarantees uniqueness within a
   session and the timestamp disambiguates across sessions; neither is a
   randomness source, so nothing here depends on Math.random. */
var DZ_PAIR_SEQ = 0;

function dzNewPairId(name) {
    DZ_PAIR_SEQ += 1;
    var slug = String(name || "theme").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 20);
    return "u:" + slug + "-" + Date.now().toString(36) + "-" + DZ_PAIR_SEQ;
}

/* Persist both variants of a generated pair and save the member the mode
   (in Follow device, the device) stands for, so saving never yanks the user
   from dark to light. Replaces any existing pair of the same name, so
   re-running the wizard with the same name updates rather than duplicating. */
function dzSaveGeneratedPair(name, seed, pairColors) {
    name = (name || "").trim().slice(0, 40);
    if (!name) { return null; }
    var pairId = dzNewPairId(name);
    theme.user_schemes = (theme.user_schemes || []).filter(function (p) {
        return p.name !== name;
    });
    ["light", "dark"].forEach(function (variant) {
        theme.user_schemes.push({
            name: name, variant: variant, pair: pairId, base: variant,
            seed: { accent: seed.accent, surface: seed.surface || null, look: seed.look },
            colors: Object.assign({}, pairColors[variant])
        });
    });
    var fam = dzFamilyOf("user:" + name + "|light", dzSchemeFamilies(theme.user_schemes));
    var slug = fam && !fam.single
        ? dzSavedMemberFor(fam, theme.scheme_mode, dzDeviceDark())
        : "user:" + name + "|light";
    /* No cacheThemeSettings() here: applyScheme(slug) always finds the preset
       just pushed above (the slug names one of the two entries added this
       call) and caches on that found-preset path itself; caching twice would
       be redundant. */
    applyScheme(slug);
    renderSchemePicker();
    // Keep the hub's own custom-colour swatches (value + enabled state) in
    // step with the save, the same as every other apply path (the per-card
    // click handler below and dzHubBuildColorSwatch's own edits): without
    // this, the seven inputs behind the wizard keep showing the OLD colours
    // and stay enabled (theme.scheme is no longer "custom"), so editing one
    // writes into theme.color_scheme under a preset slug that the next load
    // silently overwrites again via applyScheme. Guarded: schemes.js must
    // not hard-depend on the hub module.
    if (typeof dzHubSyncSchemeSwatches === "function") { dzHubSyncSchemeSwatches(); }
    return slug;
}

/* Repair a stored pick of a retired scheme, once, at load. applyScheme already
   sets scheme/scheme_base/color_scheme, toggles custom_color_scheme, caches and
   persists, so the repair is written back and the next boot reads the survivor
   directly instead of migrating again. */
function migrateRetiredScheme() {
    var target = DZ_SCHEME_MIGRATIONS[theme.scheme];
    if (!target) return Promise.resolve(false);
    if (typeof dzLog === "function") { dzLog("schemes", "retired_migrated", { from: theme.scheme, to: target }); }
    return applyScheme(target).then(function() { return true; });
}

/* A scheme pick is a decision: persist it to the Domoticz user variables
   immediately (like users expect from a theme switcher), instead of waiting
   for the Save button. Without this, an unsaved pick would live only in
   localStorage, and the async DB round-trip on the next full reload would
   silently revert it. */
function persistSchemeChoice() {
    /* Route through the hub's write funnel when it exists: dzHubPersist adds
       the reactive no_identity lock every other hub write already gets, and
       scheme picks used to bypass it (an application-token session's pick
       failed silently without locking the hub). theme-hub.js loads after
       this module in THEME_MODULES, but a pick only happens long after
       boot; the direct legacy call stays as the fallback. */
    if (typeof dzHubPersist === "function") {
        dzHubPersist();
        return;
    }
    if (typeof storeUserVariableThemeSettings === "function") {
        storeUserVariableThemeSettings("update");
    }
}

/* WCAG contrast rails. Built-in schemes are checked for contrast before
   shipping; user presets and hand-picked custom colours get checked HERE at
   save time, with a warning that names the failing pair and ratio. Warn,
   not block: the user may knowingly trade contrast, but never silently. */
function contrastRatio(hexA, hexB) {
    function lum(hex) {
        var c = hexToRGB(hex, true).split(",").map(function(v) {
            v = Number(v) / 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    }
    var a = lum(hexA), b = lum(hexB);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function schemeContrastFailures(cs) {
    var fails = [];
    if (cs.main_text && cs.background) {
        var body = contrastRatio(cs.main_text, cs.background);
        if (body < 4.5) { fails.push(dzT("hub.schemes.wcag_body", { ratio: body.toFixed(1) })); }
    }
    if (cs.alt_text && cs.background) {
        var alt = contrastRatio(cs.alt_text, cs.background);
        if (alt < 4.5) { fails.push(dzT("hub.schemes.wcag_alt", { ratio: alt.toFixed(1) })); }
    }
    if (cs.main_color) {
        var onAcc = contrastRatio(cs.accent_text || "#ffffff", cs.main_color);
        if (onAcc < 3.0) { fails.push(dzT("hub.schemes.wcag_accent", { ratio: onAcc.toFixed(1) })); }
    }
    return fails;
}

function warnIfContrastFails(cs, what) {
    var fails = schemeContrastFailures(cs);
    if (fails.length && typeof generate_noty === "function") {
        generate_noty('warning', dzT("toasts.wcag_fails", { what: what, failures: fails.join("; ") }), 8000);
    }
    return fails;
}

/* Shared "|" guard for every scheme-name save path. "|" separates name from
   variant in a generated pair's slug (user:<name>|<variant>, dzSaveGeneratedPair
   above). A hand-saved preset named e.g. "Sunset|light" would collide with the
   light half of a generated pair named "Sunset": both would own the slug
   "user:Sunset|light", and the exact-name-first rule (dzUserPresetFor,
   dzFamilyOf) makes the generated half unreachable. One shared check, so
   every current and future save path enforces the same rule. Returns an error message to show the user, or null when the name is
   fine. */
function dzSchemeNameError(name) {
    if ((name || "").indexOf("|") !== -1) {
        return dzT("toasts.name_pipe");
    }
    return null;
}

/* User-saved presets: snapshots of the current colours under a chosen name.
   Stored on the theme object (theme.user_schemes), so they ride the same
   localStorage cache and Domoticz user-variable sync as everything else.
   Names render via textContent only. */
function saveCurrentColorsAsScheme(name) {
    name = (name || "").trim().slice(0, 40);
    if (!name) return;
    var nameError = dzSchemeNameError(name);
    if (nameError) {
        if (typeof generate_noty === "function") { generate_noty("warning", nameError, 5000); }
        return;
    }
    theme.user_schemes = (theme.user_schemes || []).filter(function(p) { return p.name !== name; });
    theme.user_schemes.push({
        name: name,
        base: theme.scheme_base === "dark" ? "dark" : "light",
        colors: Object.assign({}, theme.color_scheme)
    });
    theme.scheme = "user:" + name;
    cacheThemeSettings();
    persistSchemeChoice();
    renderSchemePicker();
    dzApplyColorMode();
    warnIfContrastFails(theme.color_scheme, dzT("hub.schemes.wcag_what_preset", { name: name }));
}

/* A generated pair is one theme to the user (one picker card), so naming
   either half deletes both; an orphan half would be worse than either
   outcome. Legacy unpaired presets (no `pair`) delete singly. */
function deleteUserScheme(name, variant) {
    var all = theme.user_schemes || [];
    var target = null;
    all.forEach(function (p) {
        if (p.name === name && (variant === undefined || p.variant === variant)) { target = p; }
    });
    var removed = [];
    theme.user_schemes = all.filter(function (p) {
        var goesAway = target && target.pair ? p.pair === target.pair : p.name === name;
        if (goesAway) { removed.push(p); }
        return !goesAway;
    });
    /* Reset theme.scheme when it names ANY entry being removed, not just the
       clicked card: deleting "Sunset Light" while parked on "Sunset Dark"
       removes both, and a reset keyed only on the clicked slug would leave
       theme.scheme dangling on the now-gone mate (no card renders selected,
       the hub's custom-colour editor stays disabled with nothing to edit,
       and the dangling slug survives a reboot since applyScheme is never
       re-run for the cached slug on restore). */
    var removedSlugs = removed.map(function (p) {
        return p.variant ? "user:" + p.name + "|" + p.variant : "user:" + p.name;
    });
    if (removedSlugs.indexOf(theme.scheme) !== -1) {
        theme.scheme = "custom";
    }
    cacheThemeSettings();
    persistSchemeChoice();
    renderSchemePicker();
    dzApplyColorMode();
}

/* The slug of the scheme in effect, picked or not. theme.scheme is unset until
   someone picks one, and then the page is painted by the rule scheme.js
   dzSavedPaintState applies: custom colours win, then the dark feature, else
   light. The picker marks this card so the default is visibly the default. */
function dzActiveSchemeSlug() {
    if (theme.scheme) return theme.scheme;
    var f = theme.features || {};
    if (f.custom_color_scheme && f.custom_color_scheme.enabled === true) return "custom";
    if (f.dark_theme && f.dark_theme.enabled === true) return "dark";
    return "light";
}

/* The saved preset a "user:" slug names, or undefined. Exact legacy match
   first: a hand-saved preset may contain "|" in its own name, and splitting on
   it would silently resolve to nothing. Only if no preset owns the whole
   string is it read as the generated "<name>|<variant>" form. */
function dzUserPresetFor(slug) {
    var rest = slug.substring(5);
    var all = theme.user_schemes || [];
    var preset = all.filter(function (p) { return p.name === rest; })[0];
    if (preset) return preset;
    var bar = rest.lastIndexOf("|");
    if (bar === -1) return undefined;
    var wantName = rest.substring(0, bar);
    var wantVariant = rest.substring(bar + 1);
    return all.filter(function (p) {
        return p.name === wantName && p.variant === wantVariant;
    })[0];
}

/* Write a pick into the SAVED model: scheme, scheme_base, color_scheme and the
   two features that describe it, then cache and persist once. Resolves true
   when the slug named a scheme, false (nothing written) when it did not.
   "light"/"dark" are the token bases, "custom" is the user's own colours (the
   hub's swatch editor), "user:<name>" a saved preset, anything else a
   built-in preset. Paints nothing. */
function dzSaveSchemeModel(slug) {
    var found;
    if (slug === "light" || slug === "dark") {
        theme.scheme = slug;
        theme.scheme_base = slug;
        theme.features.custom_color_scheme.enabled = false;
        setDarkFeature(slug === "dark");
        found = Promise.resolve(true);
    } else if (slug === "custom") {
        theme.scheme = "custom";
        theme.features.custom_color_scheme.enabled = true;
        found = Promise.resolve(true);
    } else if (slug.indexOf("user:") === 0) {
        found = Promise.resolve(dzSaveSchemeColors(slug, dzUserPresetFor(slug)));
    } else {
        found = loadBuiltinSchemes().then(function (schemes) {
            return dzSaveSchemeColors(slug, schemes[slug]);
        });
    }
    return found.then(function (ok) {
        if (ok) {
            cacheThemeSettings();
            persistSchemeChoice();
        }
        return ok;
    });
}

function dzSaveSchemeColors(slug, scheme) {
    if (!scheme) return false;
    theme.scheme = slug;
    theme.scheme_base = scheme.base === "dark" ? "dark" : "light";
    theme.color_scheme = Object.assign({}, scheme.colors);
    theme.features.custom_color_scheme.enabled = true;
    setDarkFeature(false);
    return true;
}

/* Apply a scheme by slug: save it (see dzSaveSchemeModel; persisted
   immediately, see persistSchemeChoice) and repaint once, painting the
   variant the mode asks for (color-mode.js). Forced, because the slug on
   screen may be unchanged while its colours are new. An unknown slug changes
   nothing. */
function applyScheme(slug) {
    return dzSaveSchemeModel(slug).then(function (ok) {
        if (ok) return dzApplyColorMode(true);
    });
}

/* The dark_theme FEATURE outlived its checkbox (removed once the picker's
   Machinon Dark card superseded it): it persists in the stored feature-id
   list and says whether the SAVED scheme is Machinon Dark. It no longer
   loads anything: dark_theme.css follows the PAINTED variant (dzSetDarkFile
   below), which may be the other member of the saved pair. */
function setDarkFeature(enabled) {
    theme.features.dark_theme.enabled = enabled;
}

/* dark_theme.css is loaded only while Machinon Dark is painted. Named dark
   schemes (built-in presets and anything the wizard generates) run WITHOUT
   it, deliberately. What that costs them is now down to three rules,
   audited 2026-09-01:

     #login:before                     hardcoded Machinon blue - correct to skip
     mobile #searchInput focus         hardcoded Machinon blue - correct to skip
     #bigtext colour                   TOKEN-based, so not Machinon-specific

   The camera-name overlay used to be a fourth and was the one that made this
   comment's old blanket claim ("its values are Machinon-dark specific") false;
   it moved to css/dashboard_camera.css in 9f67e98, keyed on the theme's own
   surface instead. #bigtext is the remaining exception and is left alone on
   purpose: measured, machinon-dark paints it rgb(220,230,240) (body text) and
   gruvbox-dark rgb(131,165,152) (its own accent). Both readable, and the
   scheme's accent there is arguably right, so this is a documented difference
   rather than a bug to fix.

   Idempotent by its own flag: one link at most, and the only link it removes
   is the one it tracks. A link already in the page is adopted rather than
   doubled. */
var DZ_DARK_FILE = "dark_theme.css";
var dzDarkFileLoaded = false;
var dzDarkFileLink = null;

function dzSetDarkFile(on) {
    on = on === true;
    if (on === dzDarkFileLoaded) return;
    if (on) {
        var links = document.getElementsByTagName("link");
        for (var i = 0; i < links.length && !dzDarkFileLink; i++) {
            if ((links[i].getAttribute("href") || "").indexOf("/css/" + DZ_DARK_FILE) !== -1) { dzDarkFileLink = links[i]; }
        }
        if (!dzDarkFileLink) {
            var link = document.createElement("link");
            link.setAttribute("rel", "stylesheet");
            link.setAttribute("type", "text/css");
            link.setAttribute("href", "styles/" + themeFolder + "/css/" + DZ_DARK_FILE + dzFeatureFileQuery());
            document.getElementsByTagName("head")[0].appendChild(link);
            dzDarkFileLink = link;
        }
    } else if (dzDarkFileLink) {
        if (dzDarkFileLink.parentNode) { dzDarkFileLink.parentNode.removeChild(dzDarkFileLink); }
        dzDarkFileLink = null;
    }
    dzDarkFileLoaded = on;
}

/* Suffix -> color_scheme field, in swatch order (Background, Menu, Item,
   Main, Text, Secondary Text, Disabled): surfaces from page to card, then
   the accent, then text, then state. The source the hub's custom-colour
   swatches render from (theme-hub.js dzHubCustomColorsMount /
   dzHubSyncSchemeSwatches); the display label for each field is
   dzT("hub.schemes.swatches." + field), field being this table's own
   `field` value, not a separate label column. */
var DZ_COLOR_SCHEME_FIELDS = [
    { suffix: "bg", field: "background" },
    { suffix: "navbar", field: "navbar" },
    { suffix: "item", field: "item" },
    { suffix: "main_color", field: "main_color" },
    { suffix: "text", field: "main_text" },
    { suffix: "alt_text", field: "alt_text" },
    { suffix: "disabled", field: "disabled" }
];
/* ---- The picker: one card per theme family, plus the colour mode ----

   A card stands for a family (color-mode.js dzSchemeFamilies): a light/dark
   pair, or a single-version theme (Custom, a preset saved before pairs
   existed). Picking a card saves the member the mode stands for
   (dzPickFamily); the Light / Dark / Follow device switch above the cards
   saves the mode (dzSetSchemeMode). Each card previews both versions, the one
   this device paints at full strength and the other dimmed (nothing dims
   while a single-version theme is selected), and the selected card marks its
   painted version with a bar under it.

   The DOM is built once per data change (a preset saved or deleted) and
   otherwise updated in place: a paint (the dz:colormode event), a device
   light/dark switch or a pick only flips classes, aria-pressed and the notes,
   so tapping through modes never rebuilds the cards. */

/* The four colours a card previews per version, in strip order: page, card,
   accent, text. Enough to tell the themes apart; all seven stay in the
   custom-colour editor. */
var DZ_SCHEME_SWATCH_KEYS = ["background", "item", "main_color", "main_text"];

/* Machinon's own two versions have no scheme file: their preview colours
   mirror the dz-tokens.css / dark.css token defaults (dz-scheme-picker.js on
   the rig pins this copy to the computed tokens). */
var DZ_MACHINON_SWATCHES = {
    light: { background: "#f4f8fc", item: "#ffffff", main_color: "#396d9e", main_text: "#1b2b3a" },
    dark:  { background: "#0f1620", item: "#18202b", main_color: "#98ccfd", main_text: "#dce6f0" }
};

var DZ_SCHEME_MODE_ORDER = ["light", "dark", "auto"];

/* Literal keys, so the lang parity check sees every call site. */
function dzSchemeModeLabel(mode) {
    if (mode === "dark") { return dzT("hub.schemes.mode_dark"); }
    if (mode === "auto") { return dzT("hub.schemes.mode_auto"); }
    return dzT("hub.schemes.mode_light");
}

/* What a family's card shows: { id, name, desc, single, deletable,
   presetName, presetVariant, light, dark }, light and dark being the preview
   colours of each version (dark is null on a single card). Built-in names
   come from the scheme files (family_name / family_description); when they
   failed to load the card is named by its family id. Custom previews
   customColors, the user's live colours. */
function dzSchemeCardModel(fam, schemes, userSchemes, customColors) {
    var card = { id: fam.id, name: fam.id, desc: null, single: fam.single,
                 deletable: fam.deletable, presetName: fam.presetName,
                 presetVariant: undefined, light: null, dark: null };
    var presets = Array.isArray(userSchemes) ? userSchemes.filter(function (p) {
        return p && typeof p === "object" && p.name === fam.presetName;
    }) : [];
    if (fam.kind === "machinon") {
        card.name = dzT("hub.schemes.builtin.machinon.name");
        card.desc = dzT("hub.schemes.builtin.machinon.desc");
        card.light = DZ_MACHINON_SWATCHES.light;
        card.dark = DZ_MACHINON_SWATCHES.dark;
    } else if (fam.kind === "builtin") {
        var all = schemes || {};
        var light = Object.prototype.hasOwnProperty.call(all, fam.light) ? all[fam.light] : null;
        var dark = Object.prototype.hasOwnProperty.call(all, fam.dark) ? all[fam.dark] : null;
        var either = light || dark;
        if (either) {
            card.name = either.family_name || either.name || fam.id;
            card.desc = either.family_description || either.description || null;
        }
        card.light = light ? light.colors : null;
        card.dark = dark ? dark.colors : null;
    } else if (fam.kind === "custom") {
        card.name = dzT("hub.schemes.builtin.custom.name");
        card.desc = dzT("hub.schemes.builtin.custom.desc");
        card.light = customColors || null;
    } else if (fam.kind === "legacy") {
        card.name = fam.presetName;
        var legacy = presets.filter(function (p) { return p.pair === undefined; })[0];
        card.light = legacy ? legacy.colors : null;
    } else {
        card.name = fam.presetName;
        var pairId = fam.id.substring("user-pair:".length);
        presets.forEach(function (p) {
            if (p.pair !== pairId || (p.variant !== "light" && p.variant !== "dark")) { return; }
            if (!card[p.variant]) { card[p.variant] = p.colors; }
            if (card.presetVariant === undefined) { card.presetVariant = p.variant; }
        });
    }
    if (card.single) {
        card.light = card.light || card.dark;
        card.dark = null;
    }
    return card;
}

/* What the picker marks for the saved model on this device:
   { selected: family id or null, single, mode, variant, override, note }.
   variant is the version painted for a paired family, the one every card
   shows at full strength; it follows the painter's own resolution
   (color-mode.js), so the cards agree with the screen. override is the
   variant of an override that changes what is painted, else null. note is
   "single", "auto_dark", "auto_light" or null: a fixed mode needs no note,
   and an override has a notice of its own. */
function dzSchemePickerState(families, saved, mode, override, deviceDark) {
    var fam = dzFamilyOf(saved, families);
    var single = !!(fam && fam.single);
    var ov = dzCleanOverride(override);
    if (ov && !dzOverrideStillValid(ov, mode, deviceDark)) { ov = null; }
    if (ov && ov.variant === dzWantedVariant(mode, null, deviceDark)) { ov = null; }
    var variant = dzWantedVariant(mode, ov, deviceDark);
    if (!variant) { variant = fam && !single && saved === fam.dark ? "dark" : "light"; }
    var note = null;
    if (single) {
        note = "single";
    } else if (mode === "auto" && !ov) {
        note = deviceDark ? "auto_dark" : "auto_light";
    }
    return { selected: fam ? fam.id : null, single: single, mode: mode, variant: variant,
             override: single || !ov ? null : ov.variant, note: note };
}

/* Picker mount points, registered by their hosts (the hub registers
   #dzHubSchemePicker, theme-hub.js dzHubSchemeMount). Rendering targets every
   registered id present in the document; one not in the DOM (hub not open) is
   skipped. */
var DZ_SCHEME_PICKER_CONTAINER_IDS = [];
/* The data the cards were last built from (dzSchemePickerData), so an update
   can tell a data change, which rebuilds, from a paint, which does not. */
var dzSchemePickerDataKey = null;
var dzSchemePickerArmed = false;

function registerSchemePickerContainer(id) {
    if (id && DZ_SCHEME_PICKER_CONTAINER_IDS.indexOf(id) === -1) {
        DZ_SCHEME_PICKER_CONTAINER_IDS.push(id);
    }
}

function dzSchemePickerContainers() {
    return DZ_SCHEME_PICKER_CONTAINER_IDS
        .map(function (id) { return document.getElementById(id); })
        .filter(function (el) { return !!el; });
}

function dzSchemePickerData() {
    try {
        return JSON.stringify(theme.user_schemes || []);
    } catch (e) {
        return "";
    }
}

/* One listener for every container, registered once: a paint and a device
   light/dark switch both update the pickers in place. */
function dzArmSchemePicker() {
    if (dzSchemePickerArmed) { return; }
    dzSchemePickerArmed = true;
    document.addEventListener("dz:colormode", function () { dzUpdateSchemePickers(); });
    try {
        var mq = window.matchMedia ? window.matchMedia(DZ_DEVICE_DARK_QUERY) : null;
        if (mq && mq.addEventListener) {
            mq.addEventListener("change", function () { dzUpdateSchemePickers(); });
        } else if (mq && mq.addListener) {
            mq.addListener(function () { dzUpdateSchemePickers(); });
        }
    } catch (e) {
        if (typeof dzLog === "function") { dzLog("schemes", "picker_listen_failed", { error: String(e) }); }
    }
}

/* Build the picker into every registered container. All DOM is built with
   createElement/textContent; scheme colours only ever reach
   style.backgroundColor, never markup. */
function renderSchemePicker() {
    if (!dzSchemePickerContainers().length) return;
    dzArmSchemePicker();
    dzSchemePickerDataKey = dzSchemePickerData();
    loadBuiltinSchemes().then(function (schemes) {
        var cards = dzSchemeFamilies(theme.user_schemes).map(function (fam) {
            return dzSchemeCardModel(fam, schemes, theme.user_schemes, theme.color_scheme);
        });
        dzSchemePickerContainers().forEach(function (container) {
            dzBuildSchemePicker(container, cards);
        });
        dzUpdateSchemePickers();
        if (typeof dzHubSyncSchemeSwatches === "function") { dzHubSyncSchemeSwatches(); }
    });
}

function dzSchemeSwatchStrip(colors) {
    var strip = document.createElement("div");
    strip.className = "swatches";
    DZ_SCHEME_SWATCH_KEYS.forEach(function (key) {
        var sw = document.createElement("span");
        if (colors && typeof colors[key] === "string") { sw.style.backgroundColor = colors[key]; }
        strip.appendChild(sw);
    });
    return strip;
}

/* Build fresh DOM into one container (a node cannot have two parents); the
   card models are shared read-only. Selection, dimming and notes are left to
   dzUpdateSchemePickers. */
function dzBuildSchemePicker(container, cards) {
    container.textContent = "";
    container.removeAttribute("role");
    container.removeAttribute("aria-label");

    var modeWrap = document.createElement("div");
    modeWrap.className = "scheme-mode-wrap";
    var group = document.createElement("div");
    group.className = "scheme-mode";
    group.setAttribute("role", "group");
    group.setAttribute("aria-label", dzT("hub.schemes.mode_label"));
    var note = document.createElement("p");
    note.className = "scheme-mode-note";
    note.id = container.id + "-mode-note";
    note.hidden = true;
    DZ_SCHEME_MODE_ORDER.forEach(function (mode) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "scheme-mode-btn";
        btn.setAttribute("data-mode", mode);
        btn.setAttribute("aria-pressed", "false");
        btn.setAttribute("aria-describedby", note.id);
        btn.textContent = dzSchemeModeLabel(mode);
        btn.addEventListener("click", function () {
            dzSetSchemeMode(mode).then(dzUpdateSchemePickers);
        });
        group.appendChild(btn);
    });
    modeWrap.appendChild(group);
    modeWrap.appendChild(note);

    var notice = document.createElement("div");
    notice.className = "scheme-override";
    notice.hidden = true;
    var noticeText = document.createElement("span");
    noticeText.className = "scheme-override-text";
    notice.appendChild(noticeText);
    var clear = document.createElement("button");
    clear.type = "button";
    clear.className = "btn btn-default btn-small scheme-override-clear";
    clear.addEventListener("click", function () {
        dzSetColorOverride(null);
        dzApplyColorMode().then(dzUpdateSchemePickers);
    });
    notice.appendChild(clear);
    modeWrap.appendChild(notice);
    container.appendChild(modeWrap);

    var list = document.createElement("div");
    list.className = "scheme-cards";
    list.setAttribute("role", "group");
    list.setAttribute("aria-label", dzT("hub.schemes.group_label"));
    cards.forEach(function (card, i) {
        var el = document.createElement("div");
        el.className = "scheme-card" + (card.single ? " is-single" : "") + (card.deletable ? " is-deletable" : "");
        el.setAttribute("data-family", card.id);

        /* The card is a plain container; this transparent button, stretched
           over it (css/theme-hub.css), is what takes focus and clicks. A card
           that WAS the button could not hold the delete control below: a
           button's content is presentational, so a screen reader could never
           reach a control nested in it. */
        var pick = document.createElement("button");
        pick.type = "button";
        pick.className = "scheme-pick";
        pick.setAttribute("aria-label", card.name);
        pick.setAttribute("aria-pressed", "false");
        el.appendChild(pick);

        var preview = document.createElement("div");
        preview.className = "scheme-preview";
        (card.single ? ["light"] : ["light", "dark"]).forEach(function (variant) {
            var half = document.createElement("div");
            half.className = "scheme-half";
            half.setAttribute("data-variant", variant);
            half.appendChild(dzSchemeSwatchStrip(card[variant]));
            var marker = document.createElement("div");
            marker.className = "scheme-marker";
            half.appendChild(marker);
            preview.appendChild(half);
        });
        el.appendChild(preview);

        var text = document.createElement("div");
        text.className = "scheme-text";
        var label = document.createElement("div");
        label.className = "scheme-name";
        label.textContent = card.name;
        text.appendChild(label);
        if (card.desc) {
            var desc = document.createElement("div");
            desc.className = "scheme-desc";
            desc.id = container.id + "-desc-" + i;
            desc.textContent = card.desc;
            text.appendChild(desc);
            pick.setAttribute("aria-describedby", desc.id);
        }
        el.appendChild(text);

        if (card.deletable) {
            /* One delete per card: deleteUserScheme removes both versions of
               a pair, so it is called once with either version's name. */
            var del = document.createElement("button");
            del.type = "button";
            del.className = "scheme-delete";
            del.textContent = "×";
            del.title = dzT("hub.schemes.delete_preset");
            del.setAttribute("aria-label", card.single
                ? dzT("hub.schemes.delete_named", { name: card.name })
                : dzT("hub.schemes.delete_pair_named", { name: card.name }));
            del.addEventListener("click", function (e) {
                e.stopPropagation();
                deleteUserScheme(card.presetName, card.presetVariant);
            });
            el.appendChild(del);
        }

        el.addEventListener("click", function () {
            dzPickFamily(card.id).then(function () {
                dzUpdateSchemePickers();
                // Keep the hub's own custom-colour swatches (value + enabled
                // state) in step with the pick. Guarded: schemes.js must not
                // hard-depend on the hub module.
                if (typeof dzHubSyncSchemeSwatches === "function") { dzHubSyncSchemeSwatches(); }
            });
        });
        list.appendChild(el);
    });
    container.appendChild(list);
}

/* Bring every built picker in line with the saved model and this device, in
   place. A change to the presets since the last build rebuilds instead. */
function dzUpdateSchemePickers() {
    var containers = dzSchemePickerContainers();
    if (!containers.length) { return; }
    if (dzSchemePickerDataKey !== null && dzSchemePickerData() !== dzSchemePickerDataKey) {
        renderSchemePicker();
        return;
    }
    var families = dzSchemeFamilies(theme.user_schemes);
    var state = dzSchemePickerState(families, dzActiveSchemeSlug(), theme.scheme_mode,
                                    dzColorOverride(), dzDeviceDark());
    containers.forEach(function (container) { dzUpdateSchemePicker(container, state); });
}

function dzUpdateSchemePicker(container, state) {
    var group = container.querySelector(".scheme-mode");
    if (!group) { return; }
    group.setAttribute("aria-disabled", state.single ? "true" : "false");
    Array.prototype.forEach.call(group.querySelectorAll(".scheme-mode-btn"), function (btn) {
        var on = !state.single && btn.getAttribute("data-mode") === state.mode;
        btn.disabled = state.single;
        btn.setAttribute("aria-pressed", on ? "true" : "false");
    });

    var selectedName = "";
    Array.prototype.forEach.call(container.querySelectorAll(".scheme-card"), function (el) {
        var selected = el.getAttribute("data-family") === state.selected;
        var single = el.classList.contains("is-single");
        el.classList.toggle("selected", selected);
        var pick = el.querySelector(".scheme-pick");
        if (pick) { pick.setAttribute("aria-pressed", selected ? "true" : "false"); }
        if (selected) {
            var name = el.querySelector(".scheme-name");
            selectedName = name ? name.textContent : "";
        }
        Array.prototype.forEach.call(el.querySelectorAll(".scheme-half"), function (half) {
            /* A single-version pick has no light/dark to show, so nothing
               dims while it is selected. */
            var active = single || state.single || half.getAttribute("data-variant") === state.variant;
            var strip = half.querySelector(".swatches");
            var marker = half.querySelector(".scheme-marker");
            if (strip) { strip.classList.toggle("is-dimmed", !active); }
            if (marker) { marker.classList.toggle("is-active", selected && active); }
        });
        /* Custom previews the live colours, which a pick rewrites. */
        if (el.getAttribute("data-family") === "custom") {
            var cs = theme.color_scheme || {};
            Array.prototype.forEach.call(el.querySelectorAll(".swatches span"), function (sw, i) {
                var value = cs[DZ_SCHEME_SWATCH_KEYS[i]];
                sw.style.backgroundColor = typeof value === "string" ? value : "";
            });
        }
    });

    var note = container.querySelector(".scheme-mode-note");
    if (note) {
        var text = "";
        if (state.note === "single") {
            text = dzT("hub.schemes.note_single", { name: selectedName });
        } else if (state.note === "auto_dark") {
            text = dzT("hub.schemes.note_auto_dark");
        } else if (state.note === "auto_light") {
            text = dzT("hub.schemes.note_auto_light");
        }
        note.textContent = text;
        note.hidden = !text;
    }

    var notice = container.querySelector(".scheme-override");
    if (notice) {
        notice.hidden = !state.override;
        if (state.override) {
            notice.querySelector(".scheme-override-text").textContent =
                dzT("hub.schemes.note_override", { variant: dzSchemeModeLabel(state.override) });
            notice.querySelector(".scheme-override-clear").textContent =
                dzT("hub.schemes.clear_override", { mode: dzSchemeModeLabel(state.mode) });
        }
    }
}
