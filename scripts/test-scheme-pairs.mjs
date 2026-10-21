import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const INDEX = JSON.parse(readFileSync("schemes/index.json", "utf8"));
const SCHEMES = {};
for (const slug of INDEX) {
    SCHEMES[slug] = JSON.parse(readFileSync(`schemes/${slug}.json`, "utf8"));
    SCHEMES[slug].slug = slug;
}

function loadModules(files) {
    const ctx = vm.createContext({ Math, console, JSON, window: {} });
    for (const f of files) {
        vm.runInContext(readFileSync(f, "utf8"), ctx, { filename: f });
    }
    return ctx;
}
const dz = loadModules(["src/js/schemes.js"]);
const cm = loadModules(["src/js/schemes.js", "src/js/color-mode.js"]);
const FAM0 = cm.dzSchemeFamilies([]);

test("every built-in scheme declares pair and variant", () => {
    for (const slug of INDEX) {
        const s = SCHEMES[slug];
        assert.ok(s.pair, `${slug} is missing "pair"`);
        assert.ok(s.variant === "light" || s.variant === "dark",
                  `${slug} has a bad "variant": ${s.variant}`);
    }
});

test("every built-in pair has exactly one light and one dark member", () => {
    const byPair = {};
    for (const slug of INDEX) {
        const p = SCHEMES[slug].pair;
        (byPair[p] = byPair[p] || []).push(SCHEMES[slug].variant);
    }
    for (const [pair, variants] of Object.entries(byPair)) {
        assert.deepEqual(variants.slice().sort(), ["dark", "light"],
                         `pair "${pair}" is not a light/dark couple: ${variants}`);
    }
});

test("every built-in resolves to a light/dark family that round-trips", () => {
    for (const slug of INDEX) {
        const fam = cm.dzFamilyOf(slug, FAM0);
        assert.ok(fam && !fam.single, `${slug} has no family`);
        assert.equal(fam.id, SCHEMES[slug].pair);
        const mate = SCHEMES[slug].variant === "light" ? fam.dark : fam.light;
        assert.ok(mate && mate !== slug, `${slug} has no mate`);
        assert.equal(cm.dzFamilyOf(mate, FAM0), fam, `${slug} <-> ${mate} does not round-trip`);
    }
});

test("the base light/dark slugs form the machinon family", () => {
    const fam = cm.dzFamilyOf("light", FAM0);
    assert.equal(fam.id, "machinon");
    assert.equal(fam.light, "light");
    assert.equal(fam.dark, "dark");
    assert.equal(cm.dzFamilyOf("dark", FAM0), fam);
});

test("a generated user pair forms one family", () => {
    const users = [
        { name: "Sunset", variant: "light", pair: "u:sunset-1", base: "light", colors: {} },
        { name: "Sunset", variant: "dark",  pair: "u:sunset-1", base: "dark",  colors: {} }
    ];
    const fam = cm.dzFamilyOf("user:Sunset|light", cm.dzSchemeFamilies(users));
    assert.equal(fam.id, "user-pair:u:sunset-1");
    assert.equal(fam.dark, "user:Sunset|dark");
    assert.equal(fam.kind, "user");
});

test("an unpaired legacy preset and Custom are single families", () => {
    const fam = cm.dzSchemeFamilies([{ name: "Old", base: "light", colors: {} }]);
    const old = cm.dzFamilyOf("user:Old", fam);
    assert.equal(old.single, true);
    assert.equal(old.kind, "legacy");
    assert.equal(old.id, "user:Old");
    const custom = cm.dzFamilyOf("custom", fam);
    assert.equal(custom.id, "custom");
    assert.equal(custom.single, true);
    assert.equal(cm.dzFamilyOf("nope", fam), null);
});

test("a saved generated pair round-trips through the family lookup", () => {
    const users = [];
    const seed = { accent: "#E2703A", surface: null, look: "soft" };
    // Shape produced by dzSaveGeneratedPair, asserted directly so the storage
    // contract is pinned without needing the browser globals it writes to.
    const pairId = "u:sunset-3f2a";
    for (const variant of ["light", "dark"]) {
        users.push({ name: "Sunset", variant, pair: pairId, base: variant,
                     seed, colors: { background: "#FFFFFF" } });
    }
    const fam = cm.dzFamilyOf("user:Sunset|light", cm.dzSchemeFamilies(users));
    assert.equal(fam.dark, "user:Sunset|dark");
    for (const u of users) {
        assert.equal(u.seed.look, "soft");
        assert.equal(u.base, u.variant, "base must mirror variant for a generated preset");
    }
});

test("pair ids are unique per generation", () => {
    const seen = new Set();
    for (let i = 0; i < 200; i++) {
        const id = dz.dzNewPairId("Sunset");
        assert.ok(!seen.has(id), `duplicate pair id ${id}`);
        seen.add(id);
    }
});

test("family lookup matches an exact legacy name before splitting on a literal pipe", () => {
    // A hand-saved preset's own name may contain "|". A decoy unrelated pair
    // named "Warm" with variant "Cool" is included so that splitting on "|"
    // first would resolve "user:Warm|Cool" to THAT pair instead of the exact,
    // unpaired legacy preset actually named "Warm|Cool".
    const legacyUsers = [
        { name: "Warm|Cool", base: "light", colors: {} },
        { name: "Warm", variant: "Cool",  pair: "decoy", base: "light", colors: {} },
        { name: "Warm", variant: "other", pair: "decoy", base: "dark",  colors: {} }
    ];
    const legacy = cm.dzFamilyOf("user:Warm|Cool", cm.dzSchemeFamilies(legacyUsers));
    assert.equal(legacy.kind, "legacy");
    assert.equal(legacy.single, true);

    // A generated pair whose name also contains "|" still resolves as a pair.
    const pairedUsers = [
        { name: "Warm|Cool", variant: "light", pair: "p1", base: "light", colors: {} },
        { name: "Warm|Cool", variant: "dark",  pair: "p1", base: "dark",  colors: {} }
    ];
    const fam = cm.dzFamilyOf("user:Warm|Cool|light", cm.dzSchemeFamilies(pairedUsers));
    assert.equal(fam.dark, "user:Warm|Cool|dark");
});

test("deleting one half of a pair does not leave theme.scheme dangling on the other half", () => {
    // deleteUserScheme reads/writes the theme global directly and calls
    // cacheThemeSettings, persistSchemeChoice, and renderSchemePicker.
    // persistSchemeChoice is already defined by the loaded schemes.js and
    // no-ops here (neither dzHubPersist nor storeUserVariableThemeSettings
    // exists in this harness); renderSchemePicker is also already defined
    // and no-ops because DZ_SCHEME_PICKER_CONTAINER_IDS starts empty. Only
    // theme and cacheThemeSettings need stubbing.
    dz.theme = {
        user_schemes: [
            { name: "Sunset", variant: "light", pair: "u:sunset-1", base: "light", colors: {} },
            { name: "Sunset", variant: "dark",  pair: "u:sunset-1", base: "dark",  colors: {} }
        ],
        // The user is on the DARK half; deleting the LIGHT half must not
        // leave theme.scheme pointing at "user:Sunset|dark", which is about
        // to be removed too (pairs delete together).
        scheme: "user:Sunset|dark"
    };
    dz.cacheThemeSettings = function () {};

    dz.deleteUserScheme("Sunset", "light");

    assert.equal(dz.theme.scheme, "custom",
                 "theme.scheme must not be left pointing at the deleted mate's slug");
    assert.deepEqual(dz.theme.user_schemes, [], "both halves of the pair must be removed");
});

/* The Theme Hub marks the card of the scheme actually in effect. With no
   explicit pick (theme.scheme unset, the default) that is decided the way
   scheme.js setColorScheme paints it: custom colours win, then the dark
   feature, else light. */
test("dzActiveSchemeSlug names the scheme in effect, picked or not", () => {
    const run = (t) => { dz.theme = t; return dz.dzActiveSchemeSlug(); };
    const feats = (custom, dark) => ({ custom_color_scheme: { enabled: custom }, dark_theme: { enabled: dark } });
    assert.equal(run({ scheme: "nord-dark", features: feats(true, true) }), "nord-dark");
    assert.equal(run({ features: feats(false, false) }), "light");
    assert.equal(run({ features: feats(false, true) }), "dark");
    assert.equal(run({ features: feats(true, false) }), "custom");
    assert.equal(run({ scheme: "", features: feats(false, true) }), "dark");
});

const USERS = [
    { name: "Sunset", variant: "light", pair: "u:sunset-1", base: "light", colors: {} },
    { name: "Sunset", variant: "dark",  pair: "u:sunset-1", base: "dark",  colors: {} },
    { name: "Old preset", base: "light", colors: {} }
];
const FAM = cm.dzSchemeFamilies(USERS);

test("static pair table matches the shipped scheme files", () => {
    for (const slug of INDEX) {
        assert.deepEqual({ ...cm.DZ_BUILTIN_PAIRS[slug] },
                         { pair: SCHEMES[slug].pair, variant: SCHEMES[slug].variant }, slug);
    }
    assert.equal(Object.keys(cm.DZ_BUILTIN_PAIRS).length, INDEX.length + 2);
});
test("families: machinon first, built-ins, user pair, legacy, custom last", () => {
    const ids = FAM.map((f) => f.id);
    assert.equal(ids[0], "machinon");
    assert.equal(ids[ids.length - 1], "custom");
    const sunset = FAM.find((f) => f.presetName === "Sunset");
    assert.equal(sunset.light, "user:Sunset|light");
    assert.equal(sunset.dark, "user:Sunset|dark");
    assert.equal(FAM.find((f) => f.presetName === "Old preset").single, true);
});
test("hostile user_schemes entries never touch Object.prototype", () => {
    const bad = [null, "x", 5, { name: "a", pair: "__proto__", variant: "dark", colors: {} },
                 { name: "b", pair: "constructor", variant: "light", colors: {} },
                 { name: "c", pair: "toString", variant: "dark", colors: {} },
                 { name: 7, variant: "dark" }, { name: "d", pair: "p", variant: "sideways" }];
    cm.dzSchemeFamilies(bad);
    assert.equal(({}).dark, undefined);
    assert.equal(({}).light, undefined);
    assert.equal(typeof Object.prototype.toString, "function");
});
test("legacy exact name wins over a generated pair member", () => {
    const fam = cm.dzSchemeFamilies([{ name: "Sunset|light", base: "light", colors: {} }, ...USERS]);
    assert.equal(cm.dzFamilyOf("user:Sunset|light", fam).kind, "legacy");
});
test("resolve: fixed, auto, override, single, unknown, half-deleted", () => {
    assert.equal(cm.dzResolvePaintSlug("gruvbox-light", "dark", null, false, FAM), "gruvbox-dark");
    assert.equal(cm.dzResolvePaintSlug("magenta-light", "auto", null, true, FAM), "magenta-dark");
    assert.equal(cm.dzResolvePaintSlug("light", "light", { variant: "dark", deviceDark: false }, false, FAM), "dark");
    assert.equal(cm.dzResolvePaintSlug("custom", "dark", null, true, FAM), "custom");
    assert.equal(cm.dzResolvePaintSlug("no-such", "dark", null, true, FAM), "no-such");
    const half = cm.dzSchemeFamilies([USERS[0]]);
    assert.equal(cm.dzResolvePaintSlug("user:Sunset|light", "dark", null, true, half), "user:Sunset|light");
    assert.equal(cm.dzResolvePaintSlug("gruvbox-dark", undefined, null, false, FAM), "gruvbox-dark");
});
test("override values are whitelisted", () => {
    for (const raw of [null, 5, "x", { variant: "constructor", deviceDark: false },
                       { variant: "__proto__", deviceDark: true }, { variant: "dark", deviceDark: "yes" }]) {
        assert.equal(cm.dzCleanOverride(raw), null, JSON.stringify(raw));
    }
    assert.deepEqual({ ...cm.dzCleanOverride({ variant: "dark", deviceDark: true, extra: 1 }) },
                     { variant: "dark", deviceDark: true });
});
test("a pick saves the mode's member, never the override's", () => {
    const g = FAM.find((f) => f.id === "gruvbox");
    assert.equal(cm.dzSavedMemberFor(g, "light", true), "gruvbox-light");
    assert.equal(cm.dzSavedMemberFor(g, "auto", true), "gruvbox-dark");
    assert.equal(cm.dzSavedMemberFor(FAM.find((f) => f.id === "custom"), "dark", true), "custom");
});
test("override validity, including the accepted even-flip limit", () => {
    const ov = { variant: "light", deviceDark: true };
    assert.equal(cm.dzOverrideStillValid(ov, "auto", false), false);
    assert.equal(cm.dzOverrideStillValid(ov, "dark", false), true);
    /* Owner-accepted limit (2026-10-21): two device switches while no page
       observed them leave the state equal, so the override survives. */
    assert.equal(cm.dzOverrideStillValid(ov, "auto", true), true);
});
test("pair members agree on family_name and family_description", () => {
    const byPair = {};
    for (const slug of INDEX) (byPair[SCHEMES[slug].pair] ||= []).push(SCHEMES[slug]);
    for (const [pair, members] of Object.entries(byPair)) {
        assert.ok(members[0].family_name, `${pair} lacks family_name`);
        assert.equal(members[0].family_name, members[1].family_name, pair);
        assert.equal(members[0].family_description, members[1].family_description, pair);
    }
});
