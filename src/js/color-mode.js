/* Light/dark mode, pure model.

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

   Everything here is a function of its arguments. Built-in pairs come from a
   static table, so resolution needs no network; a unit test pins the table to
   what schemes/*.json declare. Maps built from stored data are prototype-free
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
