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
   unit test pins the table to what schemes/*.json declare. Maps built from
   stored data are prototype-free so a hostile pair id or preset name cannot
   reach Object.prototype. */

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
   userSchemes, builtinColors, record } (builtinColors: slug -> colors, may be
   empty; record: a dzCurrentPaintRecord result or null). The saved slug paints
   its saved state; any other slug is the mate of a saved pair member. A
   built-in member whose scheme file is not loaded yet paints the tokens the
   paint record holds for it (state.tokens instead of colors). Returns null
   when neither source has it, so the caller can fetch it. Colours and tokens
   are copied, never aliased. */
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
    } else if (sources.record && sources.record.family === fam.id && sources.record[variant]) {
        var half = sources.record[variant];
        return { slug: slug, attr: half.attr, colors: null,
                 tokens: Object.assign({}, half.tokens), darkFile: half.darkFile };
    }
    if (!colors || typeof colors !== "object") { return null; }
    return { slug: slug, attr: base === "dark" ? "dark" : "custom",
             colors: Object.assign({}, colors), darkFile: false };
}

/* ---- The paint record ----

   The page's colours are painted by scripts that load well after the first
   frame. To show the right variant from the start, every paint leaves a
   record in localStorage holding the final token values of both members of
   the painted family. The key is dzPaintRecord plus the account's suffix
   (settings-transport.js dzAccountSuffix: none for the shared no-login
   identity, so such an install keeps the one key it always had; "@<name>"
   for a login), and not per theme folder, because the folder is not known
   when the record is read:

     { v: 1, folder, family, saved, mode, version,
       light: { attr: null|"custom"|"dark", dark_file: bool, version, tokens: { name: value } },
       dark:  { ... } }

   custom.js opens with a block that reads it and paints before anything
   else runs; it carries its own copy of the validation below because this
   file is not loaded yet at that point, and a unit test runs both copies over
   the same fixtures. A single-version family stores its one version under
   both keys, so it paints whatever the mode. A half's version is the theme
   version whose colours it holds (a record without one per half holds the
   record's version in both): the resolver paints a half's tokens only while
   that is still the running version, because an upgrade may change a
   shipped scheme's colours. The early block ignores versions and the boot
   repaint corrects it. The record's own version is the one that wrote it.

   The record is input, not trusted state: a name must look like a theme
   token (or be one of the few older token names the painter still writes,
   DZ_TOKEN_EXTRA_NAMES) and a value must have one of the shapes the painters
   write (scheme.js hexToRGB "rgb(r,g,b)", the "r,g,b" and "r, g, b"
   triplets, and the "#rrggbb" repaired colours), so nothing that can carry
   url() or a second declaration reaches setProperty. Anything else is
   dropped; a malformed half is no half. */
var DZ_PAINT_RECORD_KEY = "dzPaintRecord";

/* This account's record key, or null when no account is known or nobody is
   logged in: then nothing is stored, so no record is ever read or written
   for an account it does not belong to. */
function dzPaintRecordKey() {
    var suffix = dzAccountSuffix(dzAccount);
    return suffix === null ? null : DZ_PAINT_RECORD_KEY + suffix;
}
var DZ_TOKEN_NAME = /^--dz-[a-z0-9-]+$/;
/* Exactly the entries of scheme.js DZ_CUSTOM_TOKENS outside the --dz-
   namespace (a unit test pins it); custom.js's early block has a copy. */
var DZ_TOKEN_EXTRA_NAMES = ["--secondary-text-color"];
var DZ_TOKEN_VALUE = /^(rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+)\s*)?\)|\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}|#[0-9a-fA-F]{6})$/;
var DZ_FOLDER_NAME = /^[A-Za-z0-9_-]+$/;

function dzTokenNameOk(name) {
    return DZ_TOKEN_NAME.test(name) || DZ_TOKEN_EXTRA_NAMES.indexOf(name) !== -1;
}

function dzCleanTokens(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) { return null; }
    var out = {};
    Object.keys(raw).forEach(function (name) {
        var value = raw[name];
        if (dzTokenNameOk(name) && typeof value === "string" && DZ_TOKEN_VALUE.test(value)) {
            out[name] = value;
        }
    });
    return out;
}

/* A stored half ({ attr, dark_file, version, tokens }) as { attr, darkFile,
   version, tokens }, or null when any part is malformed. A half without a
   version holds the colours of fallback, the record's version. */
function dzCleanPaintHalf(raw, fallback) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) { return null; }
    if (raw.attr !== null && raw.attr !== "dark" && raw.attr !== "custom") { return null; }
    if (typeof raw.dark_file !== "boolean") { return null; }
    var tokens = dzCleanTokens(raw.tokens);
    if (!tokens) { return null; }
    var version = Object.prototype.hasOwnProperty.call(raw, "version") ? raw.version : fallback;
    return { attr: raw.attr, darkFile: raw.dark_file,
             version: typeof version === "string" ? version : null, tokens: tokens };
}

/* The record from its stored text, both halves cleaned, or null. */
function dzParsePaintRecord(raw) {
    if (typeof raw !== "string") { return null; }
    var rec;
    try {
        rec = JSON.parse(raw);
    } catch (e) {
        return null;
    }
    if (!rec || typeof rec !== "object" || rec.v !== 1) { return null; }
    if (typeof rec.folder !== "string" || !DZ_FOLDER_NAME.test(rec.folder)) { return null; }
    if (typeof rec.family !== "string") { return null; }
    if (rec.mode !== "light" && rec.mode !== "dark" && rec.mode !== "auto") { return null; }
    var version = typeof rec.version === "string" ? rec.version : null;
    return { folder: rec.folder, family: rec.family, saved: rec.saved, mode: rec.mode,
             version: version,
             light: dzCleanPaintHalf(rec.light, version), dark: dzCleanPaintHalf(rec.dark, version) };
}

/* What the early block paints for this device and override:
   { folder, family, variant, attr, darkFile, tokens }, or null for "paint
   nothing, the normal boot paints". */
function dzReadPaintRecord(raw, deviceDark, override) {
    var rec = dzParsePaintRecord(raw);
    if (!rec) { return null; }
    var variant = dzWantedVariant(rec.mode, override, deviceDark);
    var half = variant ? rec[variant] : null;
    if (!half) { return null; }
    return { folder: rec.folder, family: rec.family, variant: variant,
             attr: half.attr, darkFile: half.darkFile, tokens: half.tokens };
}

/* The record to store, from { folder, family, saved, mode, version, light,
   dark } (halves as { attr, darkFile, version, tokens } or null, which is
   left out, as is a version that is not a string). Null when the record
   could not be read back as written. */
function dzBuildPaintRecord(input) {
    if (!input || typeof input !== "object") { return null; }
    if (typeof input.folder !== "string" || !DZ_FOLDER_NAME.test(input.folder)) { return null; }
    if (typeof input.family !== "string" || typeof input.saved !== "string") { return null; }
    if (input.mode !== "light" && input.mode !== "dark" && input.mode !== "auto") { return null; }
    var rec = { v: 1, folder: input.folder, family: input.family, saved: input.saved, mode: input.mode };
    if (typeof input.version === "string") { rec.version = input.version; }
    ["light", "dark"].forEach(function (variant) {
        var half = input[variant];
        if (!half) { return; }
        rec[variant] = {
            attr: half.attr === "dark" || half.attr === "custom" ? half.attr : null,
            dark_file: half.darkFile === true,
            tokens: dzCleanTokens(half.tokens) || {}
        };
        if (typeof half.version === "string") { rec[variant].version = half.version; }
    });
    return rec;
}

/* ---- Runtime: the painted state ----

   This section owns what the page SHOWS. It reads the saved model in theme
   and never writes it, except through the explicit saving actions at the end
   (dzSetSchemeMode, dzPickFamily, which go through schemes.js). A painted
   variant that differs from the saved one therefore can never reach the
   cache or a Domoticz write. dzPaintedSlug is the slug on screen, kept true
   by every paint (setColorScheme records the saved one), or null when an
   early paint showed a family that no longer exists. */
var dzPaintedSlug = null;
var dzLastColorMode = null;
var dzColorModeSeq = 0;
var dzColorModeArmed = false;
/* The first resolve of a page writes the record even when it paints
   nothing, so a boot that painted the saved model leaves one behind. */
var dzPaintRecordDue = true;
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

/* The override is per account on this browser and per theme folder, never
   part of theme: one person's tap is not the next person's. Null when no
   account is known: the tap then lives in this page only. */
function dzColorOverrideKey() {
    var suffix = dzAccountSuffix(dzAccount);
    return suffix === null ? null : themeFolder + ".colorOverride" + suffix;
}

function dzColorOverride() {
    if (dzOverrideMemory !== undefined) { return dzOverrideMemory; }
    var key = dzColorOverrideKey();
    if (!key) { return null; }
    try {
        return dzCleanOverride(JSON.parse(localStorage.getItem(key)));
    } catch (e) {
        return null;
    }
}

/* The page now belongs to another account: its tap is that account's to
   read, and its record is owed under that account's key. */
function dzForgetColorMemory() {
    dzOverrideMemory = undefined;
    dzPaintRecordDue = true;
}

/* "light" or "dark" stores an override made under the device's current
   state; anything else clears it. */
function dzSetColorOverride(variant) {
    var clean = dzCleanOverride({ variant: variant, deviceDark: dzDeviceDark() });
    dzOverrideMemory = clean;
    var key = dzColorOverrideKey();
    if (!key) { return; }
    try {
        if (clean) {
            localStorage.setItem(key, JSON.stringify(clean));
        } else {
            localStorage.removeItem(key);
        }
    } catch (e) {
        if (typeof dzLog === "function") { dzLog("colormode", "override_store_failed", { error: String(e) }); }
    }
}

/* Drop this account's paint record and override, for a reset or a cache clear:
   the reload must show what the settings say, not a frame of the previous
   look and not a tap that outlives the reset. */
function dzForgetPaint() {
    dzOverrideMemory = undefined;
    var record = dzPaintRecordKey();
    var override = dzColorOverrideKey();
    try {
        if (record) { localStorage.removeItem(record); }
        if (override) { localStorage.removeItem(override); }
    } catch (e) {
        if (typeof dzLog === "function") { dzLog("colormode", "forget_paint_failed", { error: String(e) }); }
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

/* The stored record whichever theme version wrote it, or null. */
function dzLoadAnyPaintRecord() {
    var key = dzPaintRecordKey();
    if (!key) { return null; }
    try {
        return dzParsePaintRecord(localStorage.getItem(key));
    } catch (e) {
        return null;
    }
}

/* rec with only the halves that hold the running version's colours (the
   others may predate a change to a shipped scheme), or null. */
function dzCurrentPaintRecord(rec) {
    if (!rec || typeof theme.version !== "string") { return null; }
    var out = Object.assign({}, rec);
    ["light", "dark"].forEach(function (variant) {
        if (out[variant] && out[variant].version !== theme.version) { out[variant] = null; }
    });
    return out;
}

function dzLoadPaintRecord() {
    return dzCurrentPaintRecord(dzLoadAnyPaintRecord());
}

/* The inline tokens a paint can leave on an element: the scheme tokens and
   the repaired fixed colours (scheme.js), the same set dzPaintState clears,
   so a record never carries a name the next paint would not remove. */
function dzPaintTokenNames() {
    var names = DZ_CUSTOM_TOKENS.concat(DZ_REPAIR_IDENTITY);
    DZ_REPAIR_STATUS.forEach(function (name) {
        names.push("--dz-status-" + name + "-values", "--dz-toast-severity-" + name);
    });
    return names.filter(dzTokenNameOk);
}

function dzStyleTokens(el) {
    var out = {};
    dzPaintTokenNames().forEach(function (name) {
        var value = String(el.style.getPropertyValue(name) || "").trim();
        if (value) { out[name] = value; }
    });
    return out;
}

/* A record half for a state that is not on screen: colours go through the
   real applier on a detached element and are read back from it. */
function dzRecordHalf(state) {
    var tokens = {};
    if (state.colors) {
        var probe = document.createElement("div");
        applyCustomColorScheme(state.colors, probe);
        tokens = dzStyleTokens(probe);
    } else if (state.tokens) {
        tokens = state.tokens;
    }
    return { attr: state.attr, darkFile: state.darkFile === true, version: theme.version, tokens: tokens };
}

/* Record what is painted. The painted half is read back from <html>, repaired
   colours included; keepPainted reuses the stored painted half instead, for a
   refresh that may run while the hub previews colours on the page. The mate
   half comes from its colours when they are at hand, else from the previous
   record of the same family, else it is left out. A half with another theme
   version's colours is still kept as a last resort, with its own version: it
   keeps the next boot's early paint on the right variant, the resolver never
   paints it as final, and dzRefreshPaintRecord replaces it once the scheme
   files load. Best effort: storage may be blocked or full. */
function dzWritePaintRecord(families, keepPainted) {
    var key = dzPaintRecordKey();
    /* Owed until an account is known (settings-store.js dzForgetAccountState
       repaints then). */
    dzPaintRecordDue = !key;
    var state = dzLastPaintState;
    if (!key) { return; }
    if (!state) { return; }
    var fam = dzFamilyOf(state.slug, families);
    var stored = dzLoadAnyPaintRecord();
    if (stored && (!fam || stored.family !== fam.id)) { stored = null; }
    var prev = dzCurrentPaintRecord(stored);
    var rec = null;
    if (fam) {
        var variant = !fam.single && state.slug === fam.dark ? "dark" : "light";
        var input = { folder: themeFolder, family: fam.id, saved: dzActiveSchemeSlug(),
                      mode: theme.scheme_mode, version: theme.version, light: null, dark: null };
        var painted = keepPainted === true && prev ? prev[variant] : null;
        if (!painted) {
            painted = { attr: state.attr, darkFile: state.darkFile === true, version: theme.version,
                        tokens: dzStyleTokens(document.documentElement) };
        }
        if (fam.single) {
            input.light = input.dark = painted;
        } else {
            var other = variant === "dark" ? "light" : "dark";
            var mate = dzStateForSlug(fam[other], families, {
                savedSlug: dzActiveSchemeSlug(), savedState: dzSavedPaintState(),
                userSchemes: theme.user_schemes, builtinColors: dzSyncBuiltinColors(), record: prev
            });
            input[variant] = painted;
            input[other] = mate ? dzRecordHalf(mate) : stored ? stored[other] : null;
        }
        rec = dzBuildPaintRecord(input);
    }
    try {
        if (rec) {
            localStorage.setItem(key, JSON.stringify(rec));
        } else {
            localStorage.removeItem(key);
        }
    } catch (e) {
        if (typeof dzLog === "function") { dzLog("colormode", "paint_record_store_failed", { error: String(e) }); }
    }
}

/* The scheme files just loaded: the mate half can now come from them. */
function dzRefreshPaintRecord() {
    if (!dzLastPaintState) { return; }
    dzWritePaintRecord(dzSchemeFamilies(theme.user_schemes), true);
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
   for scheme files paints nothing. Until a paint of this page has landed,
   only the early block has painted, from a record that may be stale, so
   every call counts as forced: an unforced call overtaking the forced boot
   repaint would otherwise cancel it. Never rejects. */
function dzApplyColorMode(force) {
    var seq = ++dzColorModeSeq;
    var forced = force === true || dzLastPaintState === null;
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
        if (slug === dzPaintedSlug && !forced) { resolve(null); return; }
        var sources = { savedSlug: saved, savedState: dzSavedPaintState(),
                        userSchemes: theme.user_schemes, builtinColors: dzSyncBuiltinColors(),
                        record: dzLoadPaintRecord() };
        var state = dzStateForSlug(slug, families, sources);
        if (state) { resolve(state); return; }
        resolve(loadBuiltinSchemes().then(function (schemes) {
            sources.builtinColors = dzBuiltinColorsOf(schemes);
            var fetched = dzStateForSlug(slug, families, sources);
            if (fetched) { return fetched; }
            /* Colours unavailable (offline, or a scheme file gone): whatever
               is on screen stays when it already is the wanted slug (an early
               paint), otherwise the saved pick paints; the next resolve tries
               again. */
            if (typeof dzLog === "function") { dzLog("colormode", "variant_unavailable", { slug: slug }); }
            return slug === dzPaintedSlug ? null : sources.savedState;
        }));
    }).then(function (state) {
        if (seq !== dzColorModeSeq) { return; }
        var painted = false;
        if (state && (state.slug !== dzPaintedSlug || forced)) {
            dzPaintState(state);
            dzPaintedSlug = state.slug;
            painted = true;
        }
        if (painted || dzPaintRecordDue) { dzWritePaintRecord(families); }
        if (!dzLastColorMode || dzLastColorMode.slug !== dzPaintedSlug) {
            dzDispatchColorMode(dzPaintedSlug, families);
        }
    }).catch(function (e) {
        if (typeof dzLog === "function") { dzLog("colormode", "apply_failed", { error: String(e) }); }
    });
}

/* Boot: what is on screen before the first resolve. Without an early paint
   it is the saved pick, which setColorScheme paints. An early paint names a
   family and a variant; a family that no longer exists leaves the slug
   unknown (null), so the next resolve repaints. The dark_theme.css link the
   early block added is adopted here, so the painter removes it when the
   resolve wants a variant without it. */
function dzSeedPaintedSlug() {
    var early = window.__dzEarlyPaint;
    if (!early) {
        dzPaintedSlug = dzActiveSchemeSlug();
        return;
    }
    var fam = dzSchemeFamilies(theme.user_schemes).filter(function (f) { return f.id === early.family; })[0];
    dzPaintedSlug = fam ? (fam.single ? fam.light : fam[early.variant]) || null : null;
    if (early.darkFile === true) { dzSetDarkFile(true); }
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
    var paired = !!(fam && !fam.single);
    var saved = paired
        ? dzSaveSchemeModel(dzSavedMemberFor(fam, mode, dzDeviceDark()))
        : Promise.resolve(false);
    return saved.then(function (ok) {
        if (!ok) {
            /* The member's colours could not be loaded: the mode is saved
               without it, beside the previous member, until the next pick. */
            if (paired && typeof dzLog === "function") { dzLog("colormode", "mode_member_unsaved", { mode: mode }); }
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
