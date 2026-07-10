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

/* Apply a scheme by slug: "light"/"dark" are the token bases, "custom" is
   the user's own colours (colour inputs), anything else a built-in preset.
   Applies live and caches; the Domoticz user variables update on Save, like
   every other settings control. */
function applyScheme(slug) {
    if (slug === "light" || slug === "dark") {
        theme.scheme = slug;
        theme.scheme_base = slug;
        theme.features.custom_color_scheme.enabled = false;
        theme.features.dark_theme.enabled = (slug === "dark");
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
    return loadBuiltinSchemes().then(function(schemes) {
        var scheme = schemes[slug];
        if (!scheme) return;
        theme.scheme = slug;
        theme.scheme_base = scheme.base === "dark" ? "dark" : "light";
        theme.color_scheme = Object.assign({}, scheme.colors);
        theme.features.custom_color_scheme.enabled = true;
        theme.features.dark_theme.enabled = false;
        syncColorInputs();
        setColorScheme();
        cacheThemeSettings();
    });
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

            el.addEventListener("click", function() {
                applyScheme(card.slug).then(function() {
                    container.querySelectorAll(".scheme-card").forEach(function(c) { c.classList.remove("selected"); });
                    el.classList.add("selected");
                    /* mirror into the legacy checkboxes so the panel stays truthful */
                    $("#themevar10").prop("checked", theme.features.dark_theme.enabled);
                    $("#themevar39").prop("checked", theme.features.custom_color_scheme.enabled);
                });
            });
            container.appendChild(el);
        });
    });
}
