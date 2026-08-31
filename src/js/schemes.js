/* Built-in colour schemes: JSON presets for the custom-colour applier.
   A scheme file (schemes/<slug>.json) carries name, base ("light"/"dark":
   the token underlay its overrides sit on), preview swatches, and a colors
   object with exactly the keys applyCustomColorScheme() consumes. Picking a
   scheme copies its colors into theme.color_scheme and rides the existing
   custom_color_scheme plumbing: the setProperty applier (never composed
   <style> text), the localStorage cache and the Domoticz user-variable sync.
   Adding a scheme = adding a file plus an index.json entry. */

var BUILTIN_SCHEMES = null; /* slug -> scheme object, fetched once */

function loadBuiltinSchemes() {
    if (BUILTIN_SCHEMES) return Promise.resolve(BUILTIN_SCHEMES);
    var base = "styles/" + themeFolder + "/schemes/";
    return fetch(base + "index.json", { credentials: "include" })
        .then(function(r) { return r.json(); })
        .then(function(slugs) {
            return Promise.all(slugs.map(function(slug) {
                return fetch(base + slug + ".json", { credentials: "include" })
                    .then(function(r) { return r.json(); })
                    .then(function(scheme) { scheme.slug = slug; return scheme; });
            }));
        })
        .then(function(schemes) {
            BUILTIN_SCHEMES = {};
            schemes.forEach(function(s) { BUILTIN_SCHEMES[s.slug] = s; });
            return BUILTIN_SCHEMES;
        })
        .catch(function(e) {
            console.log(themeName + " - failed to load built-in schemes:", e);
            BUILTIN_SCHEMES = {};
            return BUILTIN_SCHEMES;
        });
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

/* Slug of the light/dark counterpart of `slug`, or null when it has none.

   Pairing is declared metadata, not a filename convention: "magenta-light"
   and "magenta-dark" used to be related only by how they were named, and
   applyScheme() treats every slug as unrelated, so nothing could answer
   "what is the dark version of what I am on". This is the lookup a header
   light/dark toggle needs. It has no UI caller yet; it exists now because
   retrofitting pairing onto presets already saved in users' installs is far
   more expensive than declaring it from the start.

   `schemes` and `userSchemes` are parameters rather than globals so this has
   no load-order dependency and can be unit-tested. Generated user pairs use
   the slug form "user:<name>|<variant>"; legacy hand-saved presets have no
   pair and correctly return null. */
var DZ_BASE_PAIR = { light: "dark", dark: "light" };

function dzFindPairMate(slug, schemes, userSchemes) {
    if (!slug) { return null; }
    if (DZ_BASE_PAIR[slug]) { return DZ_BASE_PAIR[slug]; }

    if (slug.indexOf("user:") === 0) {
        var rest = slug.substring(5);
        /* Exact legacy match first, same reasoning as applyScheme: a
           hand-saved preset's own name may contain "|", so check whether any
           preset owns the whole remainder before splitting it. */
        var mine = null, variant;
        (userSchemes || []).forEach(function (p) {
            if (p.name === rest) { mine = p; }
        });
        if (mine) {
            variant = mine.variant;
        } else {
            var bar = rest.lastIndexOf("|");
            if (bar === -1) { return null; } // legacy unpaired preset
            var name = rest.substring(0, bar);
            variant = rest.substring(bar + 1);
            (userSchemes || []).forEach(function (p) {
                if (p.name === name && p.variant === variant) { mine = p; }
            });
        }
        if (!mine || !mine.pair) { return null; }
        var mate = null;
        (userSchemes || []).forEach(function (p) {
            if (p.pair === mine.pair && p.variant !== variant) { mate = p; }
        });
        return mate ? "user:" + mate.name + "|" + mate.variant : null;
    }

    var self = schemes && schemes[slug];
    if (!self || !self.pair) { return null; }
    var found = null;
    Object.keys(schemes).forEach(function (other) {
        var s = schemes[other];
        if (other !== slug && s.pair === self.pair && s.variant !== self.variant) {
            found = other;
        }
    });
    return found;
}

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

/* Persist both variants of a generated pair and apply the one matching the
   base the user is currently on, so saving never yanks them from dark to
   light. Replaces any existing pair of the same name, so re-running the
   wizard with the same name updates rather than duplicating. */
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
    var wantDark = theme.scheme_base === "dark";
    var slug = "user:" + name + "|" + (wantDark ? "dark" : "light");
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
    console.log(themeName + " - scheme '" + theme.scheme + "' was retired, migrating to '" + target + "'");
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
        if (body < 4.5) { fails.push("text on background " + body.toFixed(1) + ":1 (WCAG AA needs 4.5)"); }
    }
    if (cs.alt_text && cs.background) {
        var alt = contrastRatio(cs.alt_text, cs.background);
        if (alt < 4.5) { fails.push("secondary text " + alt.toFixed(1) + ":1 (WCAG AA needs 4.5)"); }
    }
    if (cs.main_color) {
        var onAcc = contrastRatio(cs.accent_text || "#ffffff", cs.main_color);
        if (onAcc < 3.0) { fails.push("text on accent " + onAcc.toFixed(1) + ":1 (needs 3.0)"); }
    }
    return fails;
}

function warnIfContrastFails(cs, what) {
    var fails = schemeContrastFailures(cs);
    if (fails.length && typeof generate_noty === "function") {
        generate_noty('warning', what + " fails WCAG contrast: " + fails.join("; "), 8000);
    }
    return fails;
}

/* Shared "|" guard for every scheme-name save path. "|" separates name from
   variant in a generated pair's slug (user:<name>|<variant>, dzSaveGeneratedPair
   above). A hand-saved preset named e.g. "Sunset|light" would collide with the
   light half of a generated pair named "Sunset": renderSchemePicker would emit
   two cards with the identical data-scheme, both showing selected, and
   applyScheme's exact-name-first rule makes the generated half unreachable.
   Centralized here (rather than duplicated per caller, which is exactly how
   it drifted before: theme-wizard.js had this check and saveCurrentColorsAsScheme
   below did not) so every current AND future save path enforces the same
   rule. Returns an error message to show the user, or null when the name is
   fine. */
function dzSchemeNameError(name) {
    if ((name || "").indexOf("|") !== -1) {
        return "A theme name cannot contain the | character.";
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
    warnIfContrastFails(theme.color_scheme, 'Preset "' + name + '" saved, but it');
}

/* Deleting one half of a generated pair deletes both: the two cards are one
   thing to the user, and leaving an orphan half is worse than either
   outcome. Legacy unpaired presets (no `pair`) delete singly, unchanged. */
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
}

/* Apply a scheme by slug: "light"/"dark" are the token bases, "custom" is
   the user's own colours (the hub's swatch editor), "user:<name>" a saved preset,
   anything else a built-in preset. Applies live, caches, and persists to
   the Domoticz user variables immediately (see persistSchemeChoice). */
function applyScheme(slug) {
    if (slug === "light" || slug === "dark") {
        theme.scheme = slug;
        theme.scheme_base = slug;
        theme.features.custom_color_scheme.enabled = false;
        setDarkFeature(slug === "dark");
        setColorScheme();
        cacheThemeSettings();
        persistSchemeChoice();
        return Promise.resolve();
    }
    if (slug === "custom") {
        theme.scheme = "custom";
        theme.features.custom_color_scheme.enabled = true;
        setColorScheme();
        cacheThemeSettings();
        persistSchemeChoice();
        return Promise.resolve();
    }
    if (slug.indexOf("user:") === 0) {
        var rest = slug.substring(5);
        /* Exact legacy match first: a hand-saved preset may contain "|" in its
           own name, and splitting on it would silently resolve to nothing.
           Only if no preset owns the whole string do we read it as the
           generated "<name>|<variant>" form. */
        var preset = (theme.user_schemes || []).filter(function (p) {
            return p.name === rest;
        })[0];
        if (!preset) {
            var bar = rest.lastIndexOf("|");
            if (bar !== -1) {
                var wantName = rest.substring(0, bar);
                var wantVariant = rest.substring(bar + 1);
                preset = (theme.user_schemes || []).filter(function (p) {
                    return p.name === wantName && p.variant === wantVariant;
                })[0];
            }
        }
        if (!preset) return Promise.resolve();
        theme.scheme = slug;
        theme.scheme_base = preset.base === "dark" ? "dark" : "light";
        theme.color_scheme = Object.assign({}, preset.colors);
        theme.features.custom_color_scheme.enabled = true;
        setDarkFeature(false);
        setColorScheme();
        cacheThemeSettings();
        persistSchemeChoice();
        return Promise.resolve();
    }
    return loadBuiltinSchemes().then(function(schemes) {
        var scheme = schemes[slug];
        if (!scheme) return;
        theme.scheme = slug;
        theme.scheme_base = scheme.base === "dark" ? "dark" : "light";
        theme.color_scheme = Object.assign({}, scheme.colors);
        theme.features.custom_color_scheme.enabled = true;
        setDarkFeature(false);
        setColorScheme();
        cacheThemeSettings();
        persistSchemeChoice();
    });
}

/* The dark_theme FEATURE outlived its checkbox (removed once the picker's
   Machinon Dark card superseded it): the feature still carries
   dark_theme.css (dark-mode adjuncts: scroll fade, mobile search focus,
   camera-name overlay), persists in the stored feature-id list, and drives
   the base attribute in setColorScheme(). Load/unload its file here the way
   the checkbox handler used to. Named dark schemes run WITHOUT it: its
   values are Machinon-dark specific. */
function setDarkFeature(enabled) {
    var was = theme.features.dark_theme.enabled === true;
    theme.features.dark_theme.enabled = enabled;
    if (enabled && !was) { loadThemeFeatureFiles("dark_theme"); }
    if (!enabled && was) { unloadThemeFeatureFiles("dark_theme"); }
}

/* Suffix -> color_scheme field + display label, in swatch order (Background,
   Menu, Item, Main, Text, Secondary Text, Disabled): surfaces from page to
   card, then the accent, then text, then state. The source the hub's
   custom-colour swatches render from (theme-hub.js dzHubCustomColorsMount /
   dzHubSyncSchemeSwatches). */
var DZ_COLOR_SCHEME_FIELDS = [
    { suffix: "bg", field: "background", label: "Background" },
    { suffix: "navbar", field: "navbar", label: "Menu" },
    { suffix: "item", field: "item", label: "Item" },
    { suffix: "main_color", field: "main_color", label: "Main" },
    { suffix: "text", field: "main_text", label: "Text" },
    { suffix: "alt_text", field: "alt_text", label: "Secondary Text" },
    { suffix: "disabled", field: "disabled", label: "Disabled" }
];

/* Scheme-picker card mount points, registered by their hosts via
   registerSchemePickerContainer (the hub registers #dzHubSchemePicker,
   theme-hub.js dzHubSchemeMount). Starts EMPTY: no legacy Theme tab exists
   any more, so no container id is hardcoded here.
   Rendering targets every registered id actually present in the document; an
   id not currently in the DOM (hub not open) is skipped. */
var DZ_SCHEME_PICKER_CONTAINER_IDS = [];

function registerSchemePickerContainer(id) {
    if (id && DZ_SCHEME_PICKER_CONTAINER_IDS.indexOf(id) === -1) {
        DZ_SCHEME_PICKER_CONTAINER_IDS.push(id);
    }
}

/* Render the scheme cards into every registered container (see
   DZ_SCHEME_PICKER_CONTAINER_IDS above). All DOM is built with
   createElement/textContent; scheme values only ever reach style properties,
   never markup. */
function renderSchemePicker() {
    var containers = DZ_SCHEME_PICKER_CONTAINER_IDS
        .map(function(id) { return document.getElementById(id); })
        .filter(function(el) { return !!el; });
    if (!containers.length) return;
    loadBuiltinSchemes().then(function(schemes) {
        /* Every card previews the SAME seven colours in the SAME order as the
           custom colour editor's inputs (Background, Menu, Item, Main, Text,
           Secondary, Disabled), so preset cards and the Custom card are
           comparable at a glance. Keys are color_scheme key-space; preset
           swatches derive from each scheme's full colors object (all
           schemes are fully fetched by loadBuiltinSchemes, the 4-key
           preview{} block in scheme JSONs is no longer read here). */
        var SWATCH_KEYS = ["background", "navbar", "item", "main_color", "main_text", "alt_text", "disabled"];
        /* Base (schemeless) themes have no JSON; their colours mirror the
           dz-tokens.css / dark.css token defaults, and their descriptions are
           authored here for the same reason.

           Every card below carries a `pair` id (declared metadata, mirroring
           the scheme JSONs' own `pair` field), but nothing reads card.pair
           yet: it is groundwork for a future header light/dark toggle, the
           same reason dzFindPairMate has no caller yet either. Both landed
           together on purpose, not as an oversight. */
        var cards = [
            { slug: "light", name: "Machinon Light", pair: "machinon", desc: "The default look: clean blue on white", colors: { background: "#f4f8fc", navbar: "#e9f2fb", item: "#ffffff", main_color: "#396d9e", main_text: "#1b2b3a", alt_text: "#3e5568", disabled: "#8ca0b3" } },
            { slug: "dark", name: "Machinon Dark", pair: "machinon", desc: "The default look: blue glowing on navy", colors: { background: "#0f1620", navbar: "#0a0f16", item: "#18202b", main_color: "#98ccfd", main_text: "#dce6f0", alt_text: "#9db2c6", disabled: "#5e7183" } }
        ];
        Object.keys(schemes).forEach(function(slug) {
            var s = schemes[slug];
            cards.push({ slug: slug, name: s.name, pair: s.pair, desc: s.description, colors: s.colors || {} });
        });
        /* Generated pairs render as "<name> Light" / "<name> Dark" adjacent to
           each other; legacy unpaired presets keep their bare name and slug. */
        (theme.user_schemes || []).forEach(function(p) {
            var slug = p.variant ? "user:" + p.name + "|" + p.variant : "user:" + p.name;
            var label = p.variant ? p.name + " " + (p.variant === "dark" ? "Dark" : "Light") : p.name;
            cards.push({ slug: slug, name: label, pair: p.pair, variant: p.variant,
                         presetName: p.name, deletable: true, colors: p.colors || {} });
        });
        /* colors: null = the Custom card, resolved to the user's live
           colours at render time below. */
        cards.push({ slug: "custom", name: "Custom", desc: "Your own seven colours", colors: null });

        // Build fresh DOM per container (a node cannot have two parents); the
        // `cards` data above is computed once and shared read-only across them.
        containers.forEach(function(container) {
            container.textContent = "";
            cards.forEach(function(card) {
                var el = document.createElement("div");
                el.className = "scheme-card" + (theme.scheme === card.slug ? " selected" : "");
                el.setAttribute("data-scheme", card.slug);

                var swatches = document.createElement("div");
                swatches.className = "swatches";
                var cs = card.colors || theme.color_scheme || {};
                SWATCH_KEYS.forEach(function(key) {
                    var sw = document.createElement("span");
                    if (cs[key]) sw.style.backgroundColor = cs[key];
                    swatches.appendChild(sw);
                });
                el.appendChild(swatches);

                var label = document.createElement("div");
                label.className = "scheme-name";
                label.textContent = card.name;
                el.appendChild(label);

                if (card.desc) {
                    var desc = document.createElement("div");
                    desc.className = "scheme-desc";
                    desc.textContent = card.desc;
                    el.appendChild(desc);
                }

                if (card.deletable) {
                    var del = document.createElement("span");
                    del.className = "scheme-delete";
                    del.textContent = "×";
                    del.title = "Delete preset";
                    del.addEventListener("click", function(e) {
                        e.stopPropagation();
                        deleteUserScheme(card.presetName || card.name, card.variant);
                    });
                    el.appendChild(del);
                }

                el.addEventListener("click", function() {
                    applyScheme(card.slug).then(function() {
                        container.querySelectorAll(".scheme-card").forEach(function(c) { c.classList.remove("selected"); });
                        el.classList.add("selected");
                        // Keep the hub's own custom-colour swatches (value + enabled
                        // state) in step with the pick. Guarded: schemes.js must not
                        // hard-depend on the hub module.
                        if (typeof dzHubSyncSchemeSwatches === "function") { dzHubSyncSchemeSwatches(); }
                    });
                });
                container.appendChild(el);
            });
        });
        if (typeof dzHubSyncSchemeSwatches === "function") { dzHubSyncSchemeSwatches(); }
    });
}
