/* Light/dark mode: a pure model, then the runtime that paints from it.

   A scheme family is a light/dark pair (or a lone scheme). The user's PICK is
   a family member saved in theme.scheme; what is PAINTED is that family's
   member for the wanted variant, resolved at paint time from the mode
   (light, dark or auto), an optional one-off override and the device's
   current light/dark state. Painting never rewrites the saved pick, so
   switching mode back restores the family the user chose.

   An override records the device state it was made under (deviceDark) and
   stays valid in auto mode only while the device is still in that state. Two
   device switches while no page observed them leave the state equal, so the
   override then survives; that limit is accepted.

   Everything up to the runtime section is a function of its arguments.
   Built-in pairs come from a static table, so resolution needs no network; a
   unit test pins the table to what schemes/*.json declare. Maps built from stored data are prototype-free
   so a hostile pair id or preset name cannot reach Object.prototype. */

var DZ_BUILTIN_PAIRS = {
    "light":         { pair: "machinon", variant: "light" },
    "dark":          { pair: "machinon", variant: "dark" },
    "magenta-light": { pair: "magenta",  variant: "light" },
    "magenta-dark":  { pair: "magenta",  variant: "dark" },
    "paper-light":   { pair: "paper",    variant: "light" },
    "paper-dark":    { pair: "paper",    variant: "dark" },
    "gruvbox-light": { pair: "gruvbox",  variant: "light" },
    "gruvbox-dark":  { pair: "gruvbox",  variant: "dark" }
};

function dzMakeFamily(id, kind, light, dark, single, deletable, presetName) {
    return {
        id: id, kind: kind, light: light, dark: dark, single: single,
        deletable: deletable, presetName: presetName
    };
}

/* Families in picker order: Machinon and the other built-ins in the order
   DZ_BUILTIN_PAIRS declares them, then the user's presets in stored order,
   then Custom. Entries of userSchemes that are not well-formed are skipped. */
function dzSchemeFamilies(userSchemes) {
    var families = [];
    var builtin = Object.create(null);
    Object.keys(DZ_BUILTIN_PAIRS).forEach(function (slug) {
        var entry = DZ_BUILTIN_PAIRS[slug];
        var fam = builtin[entry.pair];
        if (!fam) {
            fam = dzMakeFamily(entry.pair, entry.pair === "machinon" ? "machinon" : "builtin",
                               null, null, false, false, null);
            builtin[entry.pair] = fam;
            families.push(fam);
        }
        fam[entry.variant] = slug;
    });

    var pairs = Object.create(null);
    var slots = [];
    (Array.isArray(userSchemes) ? userSchemes : []).forEach(function (p) {
        if (!p || typeof p !== "object" || typeof p.name !== "string") { return; }
        if (p.pair === undefined) {
            var legacy = "user:" + p.name;
            slots.push(dzMakeFamily(legacy, "legacy", legacy, legacy, true, true, p.name));
            return;
        }
        if (typeof p.pair !== "string") { return; }
        if (p.variant !== "light" && p.variant !== "dark") { return; }
        var group = pairs[p.pair];
        if (!group) {
            group = pairs[p.pair] = { id: "user-pair:" + p.pair, name: p.name, light: null, dark: null };
            slots.push(group);
        }
        if (!group[p.variant]) { group[p.variant] = "user:" + p.name + "|" + p.variant; }
    });
    slots.forEach(function (entry) {
        if (entry.kind) { families.push(entry); return; }
        var both = !!(entry.light && entry.dark);
        var only = entry.light || entry.dark;
        families.push(dzMakeFamily(entry.id, "user",
                                   both ? entry.light : only, both ? entry.dark : only,
                                   !both, true, entry.name));
    });
    families.push(dzMakeFamily("custom", "custom", "custom", "custom", true, false, null));
    return families;
}

/* The family a slug belongs to, or null. Single (legacy) families are checked
   first: a preset literally named "X|light" owns "user:X|light" even when a
   generated pair "X" would produce the same slug, as applyScheme decides. */
function dzFamilyOf(slug, families) {
    if (typeof slug !== "string" || !families) { return null; }
    var i, fam;
    for (i = 0; i < families.length; i++) {
        fam = families[i];
        if (fam.single && fam.light === slug) { return fam; }
    }
    for (i = 0; i < families.length; i++) {
        fam = families[i];
        if (!fam.single && (fam.light === slug || fam.dark === slug)) { return fam; }
    }
    return null;
}

/* Whitelist a stored override; anything else is no override. */
function dzCleanOverride(raw) {
    if (!raw || typeof raw !== "object") { return null; }
    if (raw.variant !== "light" && raw.variant !== "dark") { return null; }
    if (typeof raw.deviceDark !== "boolean") { return null; }
    return { variant: raw.variant, deviceDark: raw.deviceDark };
}

/* Fixed modes never invalidate an override; auto does once the device left
   the state the override was made under. */
function dzOverrideStillValid(override, mode, deviceDark) {
    if (!override) { return false; }
    if (mode === "light" || mode === "dark") { return true; }
    if (mode === "auto") { return override.deviceDark === !!deviceDark; }
    return false;
}

/* "light", "dark", or null when the mode is unknown (paint the pick as is). */
function dzWantedVariant(mode, override, deviceDark) {
    if (mode !== "light" && mode !== "dark" && mode !== "auto") { return null; }
    var ov = dzCleanOverride(override);
    if (ov && dzOverrideStillValid(ov, mode, deviceDark)) { return ov.variant; }
    if (mode === "auto") { return deviceDark ? "dark" : "light"; }
    return mode;
}

/* The slug to paint for a saved pick. Unknown slugs and single families paint
   as saved. */
function dzResolvePaintSlug(slug, mode, override, deviceDark, families) {
    var fam = dzFamilyOf(slug, families);
    if (!fam || fam.single) { return slug; }
    var wanted = dzWantedVariant(mode, override, deviceDark);
    if (wanted === "dark") { return fam.dark || slug; }
    if (wanted === "light") { return fam.light || slug; }
    return slug;
}

/* The slug a PICK saves: the member of the fixed mode, or in auto the member
   for the device's current state. An override never influences it. */
function dzSavedMemberFor(fam, mode, deviceDark) {
    if (fam.single) { return fam.light; }
    var dark = mode === "dark" || (mode !== "light" && !!deviceDark);
    return (dark ? fam.dark : fam.light) || fam.light || fam.dark;
}

/* A paint state for a slug (the scheme.js shape: { slug, attr, colors,
   darkFile }), from sources given synchronously: { savedSlug, savedState,
   userSchemes, builtinColors } (builtinColors: slug -> colors, may be empty).
   The saved slug paints its saved state; any other slug is the mate of a
   saved pair member. Returns null when the colours it needs are not in the
   sources, so the caller can fetch them. Colours are copied, never aliased. */
function dzStateForSlug(slug, families, sources) {
    if (slug === sources.savedSlug) { return sources.savedState; }
    var fam = dzFamilyOf(slug, families);
    if (!fam || fam.single) { return null; }
    var variant = slug === fam.dark ? "dark" : "light";
    if (fam.kind === "machinon") {
        return { slug: slug, attr: variant === "dark" ? "dark" : null, colors: null, darkFile: variant === "dark" };
    }
    var colors = null;
    var base = variant;
    if (fam.kind === "user") {
        var pairId = fam.id.substring("user-pair:".length);
        var preset = (Array.isArray(sources.userSchemes) ? sources.userSchemes : []).filter(function (p) {
            return p && p.pair === pairId && p.variant === variant;
        })[0];
        if (preset) {
            colors = preset.colors;
            base = preset.base === "dark" ? "dark" : "light";
        }
    } else if (sources.builtinColors &&
               Object.prototype.hasOwnProperty.call(sources.builtinColors, slug)) {
        colors = sources.builtinColors[slug];
    }
    if (!colors || typeof colors !== "object") { return null; }
    return { slug: slug, attr: base === "dark" ? "dark" : "custom",
             colors: Object.assign({}, colors), darkFile: false };
}

/* ---- Runtime: the painted state ----

   This section owns what the page SHOWS. It reads the saved model in theme
   and never writes it, except through the explicit saving actions at the end
   (dzSetSchemeMode, dzPickFamily, which go through schemes.js). A painted
   variant that differs from the saved one therefore can never reach the
   cache or a Domoticz write. dzPaintedSlug is the slug on screen, kept true
   by every paint (setColorScheme records the saved one). */
var dzPaintedSlug = null;
var dzLastColorMode = null;
var dzColorModeSeq = 0;
var dzColorModeArmed = false;
/* This page's latest override decision, so a tap still works when storage is
   blocked or full; undefined until this page makes one. */
var dzOverrideMemory;
var DZ_DEVICE_DARK_QUERY = "(prefers-color-scheme: dark)";

function dzDeviceDark() {
    try {
        return !!(window.matchMedia && window.matchMedia(DZ_DEVICE_DARK_QUERY).matches);
    } catch (e) {
        return false;
    }
}

/* The override is per browser and per theme folder, never part of theme. */
function dzColorOverrideKey() {
    return themeFolder + ".colorOverride";
}

function dzColorOverride() {
    if (dzOverrideMemory !== undefined) { return dzOverrideMemory; }
    try {
        return dzCleanOverride(JSON.parse(localStorage.getItem(dzColorOverrideKey())));
    } catch (e) {
        return null;
    }
}

/* "light" or "dark" stores an override made under the device's current
   state; anything else clears it. */
function dzSetColorOverride(variant) {
    var clean = dzCleanOverride({ variant: variant, deviceDark: dzDeviceDark() });
    dzOverrideMemory = clean;
    try {
        if (clean) {
            localStorage.setItem(dzColorOverrideKey(), JSON.stringify(clean));
        } else {
            localStorage.removeItem(dzColorOverrideKey());
        }
    } catch (e) {
        if (typeof dzLog === "function") { dzLog("colormode", "override_store_failed", { error: String(e) }); }
    }
}

/* Built-in colours a paint can use without a network round trip. */
function dzSyncBuiltinColors() {
    return dzBuiltinColorsOf(BUILTIN_SCHEMES);
}

function dzBuiltinColorsOf(schemes) {
    var out = Object.create(null);
    Object.keys(schemes || {}).forEach(function (slug) {
        if (schemes[slug] && schemes[slug].colors) { out[slug] = schemes[slug].colors; }
    });
    return out;
}

function dzDispatchColorMode(slug, families) {
    var fam = dzFamilyOf(slug, families);
    var single = !fam || fam.single;
    var detail = { slug: slug, variant: single ? null : (slug === fam.dark ? "dark" : "light"), single: single };
    dzLastColorMode = detail;
    try {
        document.dispatchEvent(new CustomEvent("dz:colormode", { detail: detail }));
    } catch (e) {
        if (typeof dzLog === "function") { dzLog("colormode", "dispatch_failed", { error: String(e) }); }
    }
}

function dzPaintedVariant() {
    return dzLastColorMode ? dzLastColorMode.variant : null;
}

/* Paint the variant the mode, the override and the device ask for. An
   unchanged slug paints nothing unless force is set: a saving action passes it
   because the slug may be the same while its colours are new (a pair saved
   again under its own name). A call overtaken by a newer one while waiting
   for scheme files paints nothing. Never rejects. */
function dzApplyColorMode(force) {
    var seq = ++dzColorModeSeq;
    var families = null;
    return new Promise(function (resolve) {
        var mode = theme.scheme_mode;
        var deviceDark = dzDeviceDark();
        families = dzSchemeFamilies(theme.user_schemes);
        var override = dzColorOverride();
        if (override && !dzOverrideStillValid(override, mode, deviceDark)) {
            dzSetColorOverride(null);
            override = null;
        }
        var saved = dzActiveSchemeSlug();
        var slug = dzResolvePaintSlug(saved, mode, override, deviceDark, families);
        if (slug === dzPaintedSlug && force !== true) { resolve(null); return; }
        var sources = { savedSlug: saved, savedState: dzSavedPaintState(),
                        userSchemes: theme.user_schemes, builtinColors: dzSyncBuiltinColors() };
        var state = dzStateForSlug(slug, families, sources);
        if (state) { resolve(state); return; }
        resolve(loadBuiltinSchemes().then(function (schemes) {
            sources.builtinColors = dzBuiltinColorsOf(schemes);
            var fetched = dzStateForSlug(slug, families, sources);
            if (fetched) { return fetched; }
            /* Colours unavailable (offline, or a scheme file gone): the saved
               pick stays painted, and the next resolve tries again. */
            if (typeof dzLog === "function") { dzLog("colormode", "variant_unavailable", { slug: slug }); }
            return sources.savedState;
        }));
    }).then(function (state) {
        if (seq !== dzColorModeSeq) { return; }
        if (state && (state.slug !== dzPaintedSlug || force === true)) {
            dzPaintState(state);
            dzPaintedSlug = state.slug;
        }
        if (!dzLastColorMode || dzLastColorMode.slug !== dzPaintedSlug) {
            dzDispatchColorMode(dzPaintedSlug, families);
        }
    }).catch(function (e) {
        if (typeof dzLog === "function") { dzLog("colormode", "apply_failed", { error: String(e) }); }
    });
}

/* Boot: what is on screen before the first resolve. An early paint names
   the slug it painted; otherwise the saved pick is what setColorScheme paints. */
function dzSeedPaintedSlug() {
    var early = window.__dzEarlyPaint;
    dzPaintedSlug = early && typeof early.slug === "string" ? early.slug : dzActiveSchemeSlug();
}

/* A device light/dark switch matters only in Follow device, or when an
   override may have to be dropped; anything else returns before resolving. */
function dzArmColorModeListener() {
    if (dzColorModeArmed) { return; }
    var mq = null;
    try {
        mq = window.matchMedia ? window.matchMedia(DZ_DEVICE_DARK_QUERY) : null;
    } catch (e) {
        mq = null;
    }
    if (!mq) { return; }
    var onChange = function () {
        if (theme.scheme_mode !== "auto" && !dzColorOverride()) { return; }
        dzApplyColorMode();
    };
    if (mq.addEventListener) {
        mq.addEventListener("change", onChange);
    } else if (mq.addListener) {
        mq.addListener(onChange);
    }
    dzColorModeArmed = true;
}

/* Save a new mode. A paired family also saves the member the mode stands for,
   so theme.scheme keeps describing the saved variant; the override is
   cleared because the user just said what they want. One persist either
   way. Resolves false for a mode that is not one of DZ_SCHEME_MODES. */
function dzSetSchemeMode(mode) {
    if (typeof mode !== "string" || DZ_SCHEME_MODES[mode] !== true) { return Promise.resolve(false); }
    theme.scheme_mode = mode;
    dzSetColorOverride(null);
    var fam = dzFamilyOf(dzActiveSchemeSlug(), dzSchemeFamilies(theme.user_schemes));
    var saved = fam && !fam.single
        ? dzSaveSchemeModel(dzSavedMemberFor(fam, mode, dzDeviceDark()))
        : Promise.resolve(false);
    return saved.then(function (ok) {
        if (!ok) {
            cacheThemeSettings();
            persistSchemeChoice();
        }
        return dzApplyColorMode();
    }).then(function () { return true; });
}

/* Pick a family: save the member the mode and the device stand for. */
function dzPickFamily(familyId) {
    var fam = dzSchemeFamilies(theme.user_schemes).filter(function (f) { return f.id === familyId; })[0];
    if (!fam) { return Promise.resolve(); }
    return applyScheme(dzSavedMemberFor(fam, theme.scheme_mode, dzDeviceDark()));
}
