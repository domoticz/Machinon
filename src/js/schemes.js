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

/* A scheme pick is a decision: persist it to the Domoticz user variables
   immediately (like users expect from a theme switcher), instead of waiting
   for the Save button. Without this, an unsaved pick lived only in
   localStorage and the async DB round-trip on the next full reload silently
   reverted it (owner-reported). */
function persistSchemeChoice() {
    if (typeof storeUserVariableThemeSettings === "function") {
        storeUserVariableThemeSettings("update");
    }
}

/* WCAG contrast rails. Built-in schemes are gated before shipping
   (dz-scheme-picker.js); user presets and hand-picked custom colours get
   checked HERE at save time, with a warning that names the failing pair and
   ratio. Warn, not block: the user may knowingly trade contrast, but never
   silently. */
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

/* User-saved presets: snapshots of the current colours under a chosen name.
   Stored on the theme object (theme.user_schemes), so they ride the same
   localStorage cache and Domoticz user-variable sync as everything else.
   Names render via textContent only. */
function saveCurrentColorsAsScheme(name) {
    name = (name || "").trim().slice(0, 40);
    if (!name) return;
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

function deleteUserScheme(name) {
    theme.user_schemes = (theme.user_schemes || []).filter(function(p) { return p.name !== name; });
    if (theme.scheme === "user:" + name) { theme.scheme = "custom"; }
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
        var preset = (theme.user_schemes || []).filter(function(p) { return "user:" + p.name === slug; })[0];
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
   Main, Menu, Item, Text, Secondary Text, Disabled). The source the hub's
   custom-colour swatches render from (theme-hub.js dzHubCustomColorsMount /
   dzHubSyncSchemeSwatches). The legacy Theme-tab colour inputs that also read
   it were deleted with the injected tab (Task 8). */
var DZ_COLOR_SCHEME_FIELDS = [
    { suffix: "bg", field: "background", label: "Background" },
    { suffix: "main_color", field: "main_color", label: "Main" },
    { suffix: "navbar", field: "navbar", label: "Menu" },
    { suffix: "item", field: "item", label: "Item" },
    { suffix: "text", field: "main_text", label: "Text" },
    { suffix: "alt_text", field: "alt_text", label: "Secondary Text" },
    { suffix: "disabled", field: "disabled", label: "Disabled" }
];

/* Scheme-picker card mount points, registered by their hosts via
   registerSchemePickerContainer (the hub registers #dzHubSchemePicker,
   theme-hub.js dzHubSchemeMount). Starts EMPTY: the injected Theme tab's
   #schemePicker div is gone (Task 8), so no container id is hardcoded here.
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
           custom colour editor's inputs (Background, Main, Menu, Item, Text,
           Secondary, Disabled), so preset cards and the Custom card are
           comparable at a glance (owner report 2026-07-17: presets showed 4
           swatches while Custom showed 7). Keys are color_scheme key-space;
           preset swatches derive from each scheme's full colors object (all
           schemes are fully fetched by loadBuiltinSchemes, the 4-key
           preview{} block in scheme JSONs is no longer read here). */
        var SWATCH_KEYS = ["background", "main_color", "navbar", "item", "main_text", "alt_text", "disabled"];
        /* Base (schemeless) themes have no JSON; their colours mirror the
           dz-tokens.css / dark.css token defaults. */
        var cards = [
            { slug: "light", name: "Machinon Light", colors: { background: "#f1f1f1", navbar: "#ffffff", item: "#ffffff", main_color: "#097fae", main_text: "#1a1a1a", alt_text: "#6d6e6d", disabled: "#d3d3d3" } },
            { slug: "dark", name: "Machinon Dark", colors: { background: "#333639", navbar: "#232324", item: "#515558", main_color: "#0b9eda", main_text: "#ffffff", alt_text: "#cccccc", disabled: "#808080" } }
        ];
        Object.keys(schemes).forEach(function(slug) {
            var s = schemes[slug];
            cards.push({ slug: slug, name: s.name, colors: s.colors || {} });
        });
        (theme.user_schemes || []).forEach(function(p) {
            cards.push({ slug: "user:" + p.name, name: p.name, deletable: true, colors: p.colors || {} });
        });
        /* colors: null = the Custom card, resolved to the user's live
           colours at render time below. */
        cards.push({ slug: "custom", name: "Custom", colors: null });

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

                if (card.deletable) {
                    var del = document.createElement("span");
                    del.className = "scheme-delete";
                    del.textContent = "×";
                    del.title = "Delete preset";
                    del.addEventListener("click", function(e) {
                        e.stopPropagation();
                        deleteUserScheme(card.name);
                    });
                    el.appendChild(del);
                }

                el.addEventListener("click", function() {
                    applyScheme(card.slug).then(function() {
                        container.querySelectorAll(".scheme-card").forEach(function(c) { c.classList.remove("selected"); });
                        el.classList.add("selected");
                        // theme-hub.js hub-task-5: keep the hub's own custom-colour
                        // swatches (value + enabled state) in step with the pick.
                        // Guarded: schemes.js must not hard-depend on the hub module.
                        if (typeof dzHubSyncSchemeSwatches === "function") { dzHubSyncSchemeSwatches(); }
                    });
                });
                container.appendChild(el);
            });
        });
        if (typeof dzHubSyncSchemeSwatches === "function") { dzHubSyncSchemeSwatches(); }
    });
}
