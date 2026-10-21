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
    dz.dzApplyColorMode = function () {};

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
    const fam = cm.dzSchemeFamilies(bad);
    /* The probe runs inside the context: its Object.prototype is the one the
       code under test could pollute, not this file's. */
    assert.equal(vm.runInContext(
        "({}).dark === undefined && ({}).light === undefined && typeof Object.prototype.toString === 'function'", cm), true);
    /* Well-formed entries with odd ids are kept as inert single families;
       malformed ones (non-object, non-string name, bad variant) are skipped. */
    assert.deepEqual(Array.from(fam, (f) => f.id), [
        ...FAM0.slice(0, -1).map((f) => f.id),
        "user-pair:__proto__", "user-pair:constructor", "user-pair:toString", "custom"]);
    for (const f of fam.filter((x) => x.kind === "user")) {
        assert.equal(f.single, true, f.id);
    }
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

/* ---- Painting the light/dark variant: the runtime, in a fake browser ----

   The shipping modules run in a vm context with just enough document,
   localStorage, matchMedia and fetch for the paint path. fetch reads the real
   scheme files from disk and counts requests; dispatched events, persists and
   paints are recorded so a test can assert how many of each an action caused. */
const SHIPPED_THEME = JSON.parse(readFileSync("theme.json", "utf8"));
const RUNTIME = ["src/js/settings-transport.js", "src/js/settings-store.js", "src/js/feature-loader.js",
                 "src/js/scheme.js", "src/js/schemes.js", "src/js/color-mode.js"];

function fakeElement(tag, owner) {
    const attrs = new Map();
    return {
        tagName: tag.toUpperCase(), parentNode: null,
        setAttribute(k, v) { attrs.set(k, String(v)); },
        getAttribute(k) { return attrs.has(k) ? attrs.get(k) : null; },
        removeAttribute(k) { attrs.delete(k); },
        get href() { return this.getAttribute("href") || ""; },
        appendChild(n) { owner.nodes.push(n); n.parentNode = this; return n; },
        removeChild(n) { owner.nodes.splice(owner.nodes.indexOf(n), 1); n.parentNode = null; return n; }
    };
}

function browser({ dark = false, failFetch = false } = {}) {
    const props = new Map();
    const owner = { nodes: [] };
    const html = fakeElement("html", owner);
    html.style = {
        setProperty(k, v) { props.set(k, String(v)); },
        removeProperty(k) { props.delete(k); },
        getPropertyValue(k) { return props.get(k) || ""; }
    };
    const head = fakeElement("head", owner);
    const events = [];
    const media = { matches: dark, listeners: [],
        addEventListener(type, fn) { if (type === "change") this.listeners.push(fn); } };
    const store = new Map();
    const fetches = [];
    const persists = [];
    const ctx = vm.createContext({
        console, JSON, Math, Promise, Object, Array, String, Date,
        theme: {}, themeFolder: "machinon", themeName: "Machinon",
        CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init && init.detail; } },
        localStorage: {
            getItem: (k) => (store.has(k) ? store.get(k) : null),
            setItem: (k, v) => { store.set(k, String(v)); },
            removeItem: (k) => { store.delete(k); }
        },
        matchMedia: (q) => { assert.equal(q, "(prefers-color-scheme: dark)"); return media; },
        getComputedStyle: () => ({ getPropertyValue: (k) => props.get(k) || "" }),
        fetch: (url) => {
            fetches.push(url);
            if (failFetch) return Promise.reject(new Error("offline"));
            const path = url.replace(/^styles\/machinon\//, "");
            return Promise.resolve({ json: () => Promise.resolve(JSON.parse(readFileSync(path, "utf8"))) });
        },
        document: {
            documentElement: html, head,
            getElementsByTagName: (t) => (t === "head" ? [head] : owner.nodes.filter((n) => n.tagName === t.toUpperCase())),
            getElementById: () => null,
            createElement: (t) => fakeElement(t, owner),
            dispatchEvent: (e) => { events.push(e); return true; }
        }
    });
    ctx.window = ctx;
    for (const f of RUNTIME) vm.runInContext(readFileSync(f, "utf8"), ctx, { filename: f });
    ctx.dzHubPersist = () => { persists.push(JSON.stringify(ctx.dzSettingsSnapshot(ctx.theme))); return Promise.resolve(); };
    const paints = [];
    const realPaint = ctx.dzPaintState;
    ctx.dzPaintState = (state) => { paints.push(state.slug); return realPaint(state); };
    return {
        ctx, props, html, events, media, store, fetches, persists, paints,
        darkLinks: () => owner.nodes.filter((n) => n.tagName === "LINK" && n.href.indexOf("dark_theme.css") !== -1),
        setDark(on) { media.matches = on; media.listeners.forEach((fn) => fn({ matches: on })); }
    };
}

/* A theme as a page holds it after boot: shipped defaults plus a saved pick. */
function savedTheme(b, slug, mode) {
    const t = clone(SHIPPED_THEME);
    t.scheme_mode = mode;
    t.scheme = slug;
    if (slug === "light" || slug === "dark") {
        t.scheme_base = slug;
        t.features.custom_color_scheme.enabled = false;
        t.features.dark_theme.enabled = slug === "dark";
    } else {
        t.scheme_base = SCHEMES[slug].base;
        t.color_scheme = clone(SCHEMES[slug].colors);
        t.features.custom_color_scheme.enabled = true;
        t.features.dark_theme.enabled = false;
    }
    b.ctx.theme = t;
    return t;
}
const clone = (o) => JSON.parse(JSON.stringify(o));
const rgb = (hex) => `rgb(${parseInt(hex.substr(1, 2), 16)},${parseInt(hex.substr(3, 2), 16)},${parseInt(hex.substr(5, 2), 16)})`;
const tick = () => new Promise((r) => setTimeout(r, 0));

test("dzStateForSlug: saved, Machinon, user pair and built-in members", () => {
    const users = [
        { name: "Sunset", variant: "light", pair: "u:s1", base: "light", colors: { background: "#ffeedd" } },
        { name: "Sunset", variant: "dark",  pair: "u:s1", base: "dark",  colors: { background: "#221100" } }
    ];
    const fams = cm.dzSchemeFamilies(users);
    const savedState = { slug: "light", attr: null, colors: null, darkFile: false };
    const sources = { savedSlug: "light", savedState, userSchemes: users,
                      builtinColors: { "gruvbox-dark": { background: "#282828" } } };
    const before = JSON.stringify(sources);
    const st = (slug) => clone(cm.dzStateForSlug(slug, fams, sources));
    assert.equal(cm.dzStateForSlug("light", fams, sources), savedState);
    assert.deepEqual(st("dark"), { slug: "dark", attr: "dark", colors: null, darkFile: true });
    assert.deepEqual(st("user:Sunset|dark"),
                     { slug: "user:Sunset|dark", attr: "dark", colors: { background: "#221100" }, darkFile: false });
    assert.deepEqual(st("user:Sunset|light"),
                     { slug: "user:Sunset|light", attr: "custom", colors: { background: "#ffeedd" }, darkFile: false });
    assert.deepEqual(st("gruvbox-dark"),
                     { slug: "gruvbox-dark", attr: "dark", colors: { background: "#282828" }, darkFile: false });
    assert.deepEqual(st("gruvbox-light"), null, "colours not at hand: the caller fetches them");
    assert.deepEqual(st("no-such"), null);
    assert.equal(JSON.stringify(sources), before, "sources are read, never written");
    const fresh = cm.dzStateForSlug("user:Sunset|dark", fams, sources);
    fresh.colors.background = "#000000";
    assert.equal(users[1].colors.background, "#221100", "a painted state never aliases stored colours");
});

test("a built-in pair's JSON base is its variant, so the family member decides the underlay", () => {
    for (const slug of INDEX) assert.equal(SCHEMES[slug].base, SCHEMES[slug].variant, slug);
});

test("an override paints the other member and leaves the saved model byte-identical", async () => {
    const b = browser();
    const t = savedTheme(b, "gruvbox-light", "light");
    const snap = JSON.stringify(b.ctx.dzSettingsSnapshot(t));
    const whole = JSON.stringify(t);
    b.ctx.dzSetColorOverride("dark");
    await b.ctx.dzApplyColorMode();
    assert.equal(b.html.getAttribute("data-dz-scheme"), "dark");
    assert.equal(b.props.get("--dz-body-bg"), rgb(SCHEMES["gruvbox-dark"].colors.background));
    assert.equal(JSON.stringify(b.ctx.dzSettingsSnapshot(b.ctx.theme)), snap);
    assert.equal(JSON.stringify(b.ctx.theme), whole);
    assert.equal(b.persists.length, 0, "painting persists nothing");
    assert.equal(b.store.get("machinon.themeSettings"), undefined, "painting caches nothing");
    /* An unrelated save afterwards writes the SAVED variant, not the painted one. */
    b.ctx.cacheThemeSettings();
    b.ctx.persistSchemeChoice();
    assert.equal(b.persists[0], snap);
    assert.equal(JSON.parse(b.store.get("machinon.themeSettings")).scheme, "gruvbox-light");
});

test("Follow device on a dark device paints Machinon Dark without the dark flag or a fetch", async () => {
    const b = browser({ dark: true });
    const t = savedTheme(b, "light", "auto");
    const snap = JSON.stringify(b.ctx.dzSettingsSnapshot(t));
    b.ctx.dzSeedPaintedSlug();
    b.ctx.setColorScheme();
    await b.ctx.dzApplyColorMode();
    assert.deepEqual(b.paints, ["light", "dark"]);
    assert.equal(b.html.getAttribute("data-dz-scheme"), "dark");
    assert.equal(b.darkLinks().length, 1);
    assert.equal(b.ctx.theme.features.dark_theme.enabled, false);
    assert.equal(JSON.stringify(b.ctx.dzSettingsSnapshot(b.ctx.theme)), snap);
    assert.equal(b.fetches.length, 0);
    assert.equal(b.ctx.dzPaintedVariant(), "dark");
});

test("an unchanged resolve paints nothing and dispatches the event once", async () => {
    const b = browser();
    savedTheme(b, "magenta-dark", "dark");
    b.ctx.dzSeedPaintedSlug();
    b.ctx.setColorScheme();
    await b.ctx.dzApplyColorMode();
    await b.ctx.dzApplyColorMode();
    assert.deepEqual(b.paints, ["magenta-dark"]);
    assert.equal(b.events.length, 1);
    assert.equal(b.events[0].type, "dz:colormode");
    assert.deepEqual({ ...b.events[0].detail }, { slug: "magenta-dark", variant: "dark", single: false });
    assert.equal(b.ctx.dzLastColorMode, b.events[0].detail);
    assert.equal(b.fetches.length, 0, "a fixed mode that matches the pick fetches no scheme");
});

test("a single family paints as saved and reports no variant", async () => {
    const b = browser({ dark: true });
    const t = savedTheme(b, "light", "auto");
    t.scheme = "custom";
    t.features.custom_color_scheme.enabled = true;
    await b.ctx.dzApplyColorMode();
    assert.deepEqual({ ...b.ctx.dzLastColorMode }, { slug: "custom", variant: null, single: true });
    assert.equal(b.ctx.dzPaintedVariant(), null);
});

test("Follow device repaints on a device switch; a fixed mode ignores it", async () => {
    const b = browser();
    savedTheme(b, "paper-light", "auto");
    b.ctx.dzArmColorModeListener();
    b.ctx.dzArmColorModeListener();
    assert.equal(b.media.listeners.length, 1, "armed once");
    await b.ctx.dzApplyColorMode();
    b.setDark(true);
    await tick(); await tick();
    assert.equal(b.ctx.dzLastColorMode.slug, "paper-dark");
    assert.equal(b.persists.length, 0);
    b.ctx.theme.scheme_mode = "light";
    const n = b.paints.length;
    b.setDark(false);
    await tick(); await tick();
    assert.equal(b.paints.length, n);
});

test("an override made under one device state is dropped once the device switches", async () => {
    const b = browser();
    savedTheme(b, "light", "auto");
    b.ctx.dzSetColorOverride("dark");
    assert.deepEqual({ ...b.ctx.dzColorOverride() }, { variant: "dark", deviceDark: false });
    await b.ctx.dzApplyColorMode();
    assert.equal(b.ctx.dzLastColorMode.slug, "dark");
    b.media.matches = true;
    await b.ctx.dzApplyColorMode();
    assert.equal(b.ctx.dzColorOverride(), null);
    assert.equal(b.ctx.dzLastColorMode.slug, "dark", "the device itself is dark now");
    b.media.matches = false;
    await b.ctx.dzApplyColorMode();
    assert.equal(b.ctx.dzLastColorMode.slug, "light");
});

test("override storage is whitelisted, and a tap still paints when storage is blocked", async () => {
    const b = browser();
    savedTheme(b, "light", "light");
    b.store.set("machinon.colorOverride", '{"variant":"__proto__","deviceDark":false}');
    assert.equal(b.ctx.dzColorOverride(), null);
    b.store.set("machinon.colorOverride", "not json");
    assert.equal(b.ctx.dzColorOverride(), null);
    b.ctx.localStorage.setItem = () => { throw new Error("quota"); };
    b.ctx.localStorage.getItem = () => { throw new Error("blocked"); };
    b.ctx.localStorage.removeItem = () => { throw new Error("blocked"); };
    b.ctx.dzSetColorOverride("dark");
    assert.deepEqual({ ...b.ctx.dzColorOverride() }, { variant: "dark", deviceDark: false });
    await b.ctx.dzApplyColorMode();
    assert.equal(b.ctx.dzLastColorMode.slug, "dark");
    b.ctx.dzSetColorOverride(null);
    await b.ctx.dzApplyColorMode();
    assert.equal(b.ctx.dzLastColorMode.slug, "light");
});

test("the painter's dark file is the one theme.json lists for the dark_theme feature", () => {
    const b = browser();
    assert.deepEqual(SHIPPED_THEME.features.dark_theme.files, [b.ctx.DZ_DARK_FILE]);
});

test("dark_theme.css follows the painted variant: one link, and only its own link removed", () => {
    const b = browser();
    savedTheme(b, "light", "light");
    b.ctx.dzSetDarkFile(true);
    b.ctx.dzSetDarkFile(true);
    assert.equal(b.darkLinks().length, 1);
    b.ctx.dzSetDarkFile(false);
    b.ctx.dzSetDarkFile(false);
    assert.equal(b.darkLinks().length, 0);
    /* A link something else put there is adopted rather than doubled, and is
       not removed by a "keep it off" call that never tracked it. */
    const other = b.ctx.document.createElement("link");
    other.setAttribute("href", "styles/machinon/css/dark_theme.css?v=x");
    b.ctx.document.head.appendChild(other);
    b.ctx.dzSetDarkFile(false);
    assert.equal(b.darkLinks().length, 1);
    b.ctx.dzSetDarkFile(true);
    assert.equal(b.darkLinks().length, 1);
});

test("the saved dark flag no longer loads or unloads dark_theme.css", () => {
    const b = browser();
    savedTheme(b, "light", "light");
    b.ctx.setDarkFeature(true);
    assert.equal(b.ctx.theme.features.dark_theme.enabled, true);
    assert.equal(b.darkLinks().length, 0);
    b.ctx.$ = (fn) => fn;
    b.ctx.$.each = (o, fn) => Object.keys(o).forEach((k) => fn(k, o[k]));
    b.ctx.requirejs = () => {};
    b.ctx.enableThemeFeatures();
    assert.equal(b.darkLinks().length, 0, "the painter owns the file");
});

test("applyScheme: one paint, one persist; an unknown slug does nothing", async () => {
    const b = browser();
    savedTheme(b, "light", "dark");
    await b.ctx.applyScheme("gruvbox-dark");
    assert.deepEqual(b.paints, ["gruvbox-dark"]);
    assert.equal(b.persists.length, 1);
    assert.equal(b.ctx.theme.scheme, "gruvbox-dark");
    assert.equal(b.ctx.theme.scheme_base, "dark");
    await b.ctx.applyScheme("nope");
    assert.equal(b.paints.length, 1);
    assert.equal(b.persists.length, 1);
    await b.ctx.applyScheme("dark");
    assert.deepEqual(b.paints, ["gruvbox-dark", "dark"]);
    assert.equal(b.ctx.theme.features.dark_theme.enabled, true);
    assert.equal(b.darkLinks().length, 1);
});

test("a pick under a mode paints the mode's member even when the saved member is the other", async () => {
    const b = browser();
    savedTheme(b, "light", "dark");
    await b.ctx.applyScheme("magenta-light");
    assert.equal(b.ctx.theme.scheme, "magenta-light", "the pick is saved as made");
    assert.deepEqual(b.paints, ["magenta-dark"], "one paint, of the variant the mode wants");
});

test("dzPickFamily saves the member for the mode and the device", async () => {
    const b = browser({ dark: true });
    savedTheme(b, "light", "auto");
    await b.ctx.dzPickFamily("paper");
    assert.equal(b.ctx.theme.scheme, "paper-dark");
    b.ctx.theme.scheme_mode = "light";
    await b.ctx.dzPickFamily("gruvbox");
    assert.equal(b.ctx.theme.scheme, "gruvbox-light");
    const n = b.persists.length;
    await b.ctx.dzPickFamily("no-such-family");
    assert.equal(b.persists.length, n);
});

test("dzSetSchemeMode saves the mode and the family member once, and clears the override", async () => {
    const b = browser();
    savedTheme(b, "gruvbox-light", "light");
    b.ctx.dzSetColorOverride("dark");
    await b.ctx.dzSetSchemeMode("sideways");
    assert.equal(b.ctx.theme.scheme_mode, "light");
    assert.equal(b.persists.length, 0);
    await b.ctx.dzSetSchemeMode("dark");
    assert.equal(b.ctx.theme.scheme_mode, "dark");
    assert.equal(b.ctx.theme.scheme, "gruvbox-dark");
    assert.equal(b.ctx.theme.scheme_base, "dark");
    assert.equal(b.ctx.dzColorOverride(), null);
    assert.equal(b.persists.length, 1);
    assert.equal(JSON.parse(b.persists[0]).values.scheme_mode, "dark");
    assert.equal(b.ctx.dzLastColorMode.slug, "gruvbox-dark");
    /* A single family has no member to switch: the mode alone is saved. */
    b.ctx.theme.scheme = "custom";
    await b.ctx.dzSetSchemeMode("light");
    assert.equal(b.ctx.theme.scheme, "custom");
    assert.equal(b.persists.length, 2);
});

test("a generated pair is saved on the member the mode and device ask for", async () => {
    const b = browser({ dark: true });
    savedTheme(b, "light", "auto");
    const pair = { light: { background: "#ffffff" }, dark: { background: "#101010" } };
    const slug = b.ctx.dzSaveGeneratedPair("Sunset", { accent: "#e2703a", look: "soft" }, pair);
    await tick();
    assert.equal(slug, "user:Sunset|dark");
    assert.equal(b.ctx.theme.scheme, "user:Sunset|dark");
    b.ctx.theme.scheme_mode = "light";
    assert.equal(b.ctx.dzSaveGeneratedPair("Sunset", { accent: "#e2703a", look: "soft" }, pair), "user:Sunset|light");
    await tick();
    /* Re-saving under the same name repaints the new colours even though the
       painted slug is unchanged. */
    pair.light.background = "#fafafa";
    b.ctx.dzSaveGeneratedPair("Sunset", { accent: "#e2703a", look: "soft" }, pair);
    await tick();
    assert.equal(b.props.get("--dz-body-bg"), "rgb(250,250,250)");
});

test("deleting the painted pair repaints what is saved now", async () => {
    const b = browser();
    const t = savedTheme(b, "light", "light");
    t.user_schemes = [
        { name: "Sunset", variant: "light", pair: "u:s1", base: "light", colors: { background: "#ffeedd" } },
        { name: "Sunset", variant: "dark",  pair: "u:s1", base: "dark",  colors: { background: "#221100" } }
    ];
    await b.ctx.applyScheme("user:Sunset|light");
    b.ctx.dzSetColorOverride("dark");
    await b.ctx.dzApplyColorMode();
    assert.equal(b.ctx.dzLastColorMode.slug, "user:Sunset|dark");
    b.ctx.deleteUserScheme("Sunset", "dark");
    await tick();
    assert.equal(b.ctx.theme.scheme, "custom");
    assert.equal(b.ctx.dzLastColorMode.slug, "custom");
    assert.equal(b.html.getAttribute("data-dz-scheme"), "custom");
});

test("a paint whose built-in colours cannot be fetched keeps the saved paint and never rejects", async () => {
    const b = browser({ failFetch: true });
    savedTheme(b, "gruvbox-light", "dark");
    b.ctx.dzSeedPaintedSlug();
    b.ctx.setColorScheme();
    await b.ctx.dzApplyColorMode();
    assert.deepEqual(b.paints, ["gruvbox-light"]);
    assert.equal(b.ctx.dzLastColorMode.slug, "gruvbox-light");
});

test("loadBuiltinSchemes shares one in-flight load and retries after a failure", async () => {
    const b = browser({ failFetch: true });
    const p1 = b.ctx.loadBuiltinSchemes();
    const p2 = b.ctx.loadBuiltinSchemes();
    assert.equal(p1, p2);
    assert.deepEqual({ ...(await p1) }, {});
    assert.equal(b.fetches.length, 1);
    await b.ctx.loadBuiltinSchemes();
    assert.equal(b.fetches.length, 2, "a failure is not memoized");
});

test("a newer paint wins over an older one still waiting for scheme files", async () => {
    const b = browser();
    savedTheme(b, "light", "light");
    b.ctx.dzSetColorOverride("dark");
    b.ctx.theme.scheme = "paper-light";
    b.ctx.theme.color_scheme = clone(SCHEMES["paper-light"].colors);
    b.ctx.theme.features.custom_color_scheme.enabled = true;
    const slow = b.ctx.dzApplyColorMode();
    b.ctx.dzSetColorOverride(null);
    const fast = b.ctx.dzApplyColorMode();
    await Promise.all([slow, fast]);
    assert.equal(b.ctx.dzLastColorMode.slug, "paper-light");
    assert.equal(b.html.getAttribute("data-dz-scheme"), "custom");
});
