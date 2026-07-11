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
    renderSchemePicker();
    warnIfContrastFails(theme.color_scheme, 'Preset "' + name + '" saved, but it');
}

function deleteUserScheme(name) {
    theme.user_schemes = (theme.user_schemes || []).filter(function(p) { return p.name !== name; });
    if (theme.scheme === "user:" + name) { theme.scheme = "custom"; }
    cacheThemeSettings();
    renderSchemePicker();
}

/* Apply a scheme by slug: "light"/"dark" are the token bases, "custom" is
   the user's own colours (colour inputs), "user:<name>" a saved preset,
   anything else a built-in preset. Applies live and caches; the Domoticz
   user variables update on Save, like every other settings control. */
function applyScheme(slug) {
    if (slug === "light" || slug === "dark") {
        theme.scheme = slug;
        theme.scheme_base = slug;
        theme.features.custom_color_scheme.enabled = false;
        setDarkFeature(slug === "dark");
        setColorScheme();
        cacheThemeSettings();
        return Promise.resolve();
    }
    if (slug === "custom") {
        theme.scheme = "custom";
        theme.features.custom_color_scheme.enabled = true;
        setColorScheme();
        cacheThemeSettings();
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
        syncColorInputs();
        setColorScheme();
        cacheThemeSettings();
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
        syncColorInputs();
        setColorScheme();
        cacheThemeSettings();
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

/* The Save button harvests the colour INPUTS back into theme.color_scheme,
   so after a scheme pick the inputs must reflect the scheme's colours or
   saving would clobber them with the previous values. */
function syncColorInputs() {
    var cs = theme.color_scheme || {};
    var map = { bg: "background", main_color: "main_color", navbar: "navbar", item: "item", text: "main_text", alt_text: "alt_text", disabled: "disabled" };
    Object.keys(map).forEach(function(suffix) {
        var input = document.getElementById("themevar39_" + suffix);
        if (input && cs[map[suffix]]) { input.value = cs[map[suffix]]; }
    });
}

/* The legacy Dark Theme / Custom Color Scheme checkboxes still exist; when
   one is toggled directly, re-derive the picker selection from them. */
function syncSchemeFromFeatures() {
    theme.scheme = theme.features.custom_color_scheme.enabled ? "custom"
        : (theme.features.dark_theme.enabled ? "dark" : "light");
    theme.scheme_base = theme.features.dark_theme.enabled ? "dark" : "light";
    setColorScheme();
    cacheThemeSettings();
    renderSchemePicker();
}

/* Render the scheme cards into #schemePicker (themesettings.html). All DOM
   is built with createElement/textContent; scheme values only ever reach
   style properties, never markup. */
function renderSchemePicker() {
    var container = document.getElementById("schemePicker");
    if (!container) return;
    loadBuiltinSchemes().then(function(schemes) {
        var cards = [
            { slug: "light", name: "Machinon Light", preview: { bg: "#f1f1f1", surface: "#ffffff", accent: "#097fae", text: "#1a1a1a" } },
            { slug: "dark", name: "Machinon Dark", preview: { bg: "#333639", surface: "#515558", accent: "#0b9eda", text: "#ffffff" } }
        ];
        Object.keys(schemes).forEach(function(slug) {
            var s = schemes[slug];
            cards.push({ slug: slug, name: s.name, preview: s.preview || {} });
        });
        (theme.user_schemes || []).forEach(function(p) {
            var cs = p.colors || {};
            cards.push({
                slug: "user:" + p.name, name: p.name, deletable: true,
                preview: { bg: cs.background, surface: cs.item, accent: cs.main_color, text: cs.main_text }
            });
        });
        cards.push({ slug: "custom", name: "Custom", preview: null });

        container.textContent = "";
        cards.forEach(function(card) {
            var el = document.createElement("div");
            el.className = "scheme-card" + (theme.scheme === card.slug ? " selected" : "");
            el.setAttribute("data-scheme", card.slug);

            var swatches = document.createElement("div");
            swatches.className = "swatches";
            if (card.preview) {
                ["bg", "surface", "accent", "text"].forEach(function(key) {
                    var sw = document.createElement("span");
                    if (card.preview[key]) sw.style.backgroundColor = card.preview[key];
                    swatches.appendChild(sw);
                });
            } else {
                /* The Custom card previews the user's current colours */
                var cs = theme.color_scheme || {};
                ["background", "item", "main_color", "main_text"].forEach(function(key) {
                    var sw = document.createElement("span");
                    if (cs[key]) sw.style.backgroundColor = cs[key];
                    swatches.appendChild(sw);
                });
            }
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
                    /* mirror into the legacy Custom checkbox so the panel stays truthful */
                    $("#themevar39").prop("checked", theme.features.custom_color_scheme.enabled);
                });
            });
            container.appendChild(el);
        });
    });
}
