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

function fakeStyle(props) {
    return {
        setProperty(k, v) { props.set(k, String(v)); },
        removeProperty(k) { props.delete(k); },
        getPropertyValue(k) { return props.get(k) || ""; }
    };
}

function fakeElement(tag, owner) {
    const attrs = new Map();
    return {
        tagName: tag.toUpperCase(), parentNode: null,
        style: fakeStyle(new Map()),
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
    html.style = fakeStyle(props);
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

test("a reset and a cache clear drop the settings cache, the paint record and a tap", async () => {
    const b = browser();
    savedTheme(b, "gruvbox-light", "light");
    b.ctx.dzSeedPaintedSlug();
    b.ctx.setColorScheme();
    b.ctx.dzSetColorOverride("dark");
    await b.ctx.dzApplyColorMode();
    b.ctx.cacheThemeSettings();
    b.store.set("dzOtherKey", "kept");
    for (const k of ["machinon.themeSettings", "dzPaintRecord", "machinon.colorOverride"]) assert.ok(b.store.has(k), k);
    b.ctx.dzClearThemeCache();
    assert.deepEqual([...b.store.keys()], ["dzOtherKey"]);
    assert.equal(b.ctx.dzColorOverride(), null, "the page's own copy of the tap is gone too");
    /* The legacy transport's reset finishes through the same clear. */
    const c = browser();
    savedTheme(c, "gruvbox-light", "light");
    c.store.set("machinon.themeSettings", "{}");
    c.store.set("dzPaintRecord", "{}");
    c.store.set("machinon.colorOverride", '{"variant":"dark","deviceDark":false}');
    let reloads = 0;
    c.ctx.$ = { get() {} };
    c.ctx.location = { reload() { reloads++; } };
    c.ctx.resetTheme();
    await tick();
    assert.equal(c.store.size, 0);
    assert.equal(reloads, 1);
    /* Blocked storage neither throws nor stops the reload. */
    c.ctx.localStorage.removeItem = () => { throw new Error("blocked"); };
    c.ctx.dzClearThemeCache();
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
    /* A link already in the page is adopted rather than doubled, and once
       adopted it goes when the painter turns the file off. */
    const other = b.ctx.document.createElement("link");
    other.setAttribute("href", "styles/machinon/css/dark_theme.css?v=x");
    b.ctx.document.head.appendChild(other);
    b.ctx.dzSetDarkFile(true);
    assert.equal(b.darkLinks().length, 1);
    b.ctx.dzSetDarkFile(false);
    assert.equal(b.darkLinks().length, 0);
    /* Another theme folder's copy is left alone. */
    const foreign = b.ctx.document.createElement("link");
    foreign.setAttribute("href", "styles/machinon-dev/css/dark_theme.css");
    b.ctx.document.head.appendChild(foreign);
    b.ctx.dzSetDarkFile(true);
    assert.equal(b.darkLinks().length, 2, "this folder's own link is added beside it");
    b.ctx.dzSetDarkFile(false);
    assert.deepEqual(b.darkLinks().map((l) => l.getAttribute("href")), ["styles/machinon-dev/css/dark_theme.css"]);
});

test("the early block's dark_theme.css link is adopted at seed and removed when the resolve wants light", async () => {
    const b = browser();
    const t = savedTheme(b, "dark", "dark");
    b.store.set("dzPaintRecord", JSON.stringify(machinonRecord("dark")));
    runEarlyIn(b.ctx);
    assert.equal(b.darkLinks().length, 1, "the early block loaded the file");
    b.ctx.dzSeedPaintedSlug();
    await b.ctx.dzApplyColorMode(true);
    assert.equal(b.darkLinks().length, 1, "adopted, not doubled");
    t.scheme_mode = "light";
    await b.ctx.dzApplyColorMode();
    assert.equal(b.ctx.dzLastColorMode.slug, "light");
    assert.equal(b.darkLinks().length, 0, "the adopted link is the painter's to remove");
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

test("a mode saved without its member because the scheme files failed is logged", async () => {
    const b = browser({ failFetch: true });
    savedTheme(b, "gruvbox-light", "light");
    const logs = [];
    b.ctx.dzLog = (seam, event, fields) => { logs.push([seam, event, { ...fields }]); };
    await b.ctx.dzSetSchemeMode("dark");
    assert.equal(b.ctx.theme.scheme_mode, "dark");
    assert.equal(b.ctx.theme.scheme, "gruvbox-light");
    assert.equal(b.persists.length, 1);
    assert.deepEqual(logs.filter((l) => l[1] === "mode_member_unsaved"), [["colormode", "mode_member_unsaved", { mode: "dark" }]]);
    /* A single family has no member to save, which is no failure. */
    logs.length = 0;
    b.ctx.theme.scheme = "custom";
    await b.ctx.dzSetSchemeMode("light");
    assert.deepEqual(logs.filter((l) => l[1] === "mode_member_unsaved"), []);
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

/* ---- The paint record and the early paint ----

   custom.js opens with a block that paints from the record before any theme
   script loads. color-mode.js cannot be loaded that early, so the block
   carries its own copy of the record validation; every fixture below runs
   through both copies, which must agree. */
const CUSTOM_JS = readFileSync("custom.js", "utf8");
const EARLY_SRC = CUSTOM_JS.slice(0, CUSTOM_JS.indexOf("\n})();\n") + 6);

function runEarlyIn(ctx) {
    vm.runInContext(EARLY_SRC, ctx, { filename: "custom.js#early" });
}

/* A page as the early block finds it: an empty <html>, a head, storage and
   the device's light/dark state; nothing else exists yet. */
function earlyPage({ store = {}, deviceDark = false, storageThrows = false } = {}) {
    const props = new Map();
    const owner = { nodes: [] };
    const html = fakeElement("html", owner);
    html.style = fakeStyle(props);
    const head = fakeElement("head", owner);
    const ctx = vm.createContext({
        localStorage: {
            getItem: (k) => {
                if (storageThrows) throw new Error("SecurityError");
                return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null;
            }
        },
        matchMedia: () => ({ matches: deviceDark }),
        document: {
            documentElement: html,
            getElementsByTagName: (t) => (t === "head" ? [head] : []),
            createElement: (t) => fakeElement(t, owner)
        }
    });
    ctx.window = ctx;
    runEarlyIn(ctx);
    return { ctx, props, html, links: owner.nodes.filter((n) => n.tagName === "LINK") };
}

const GOOD_RECORD = {
    v: 1, folder: "machinon", family: "gruvbox", saved: "gruvbox-light", mode: "dark",
    light: { attr: "custom", dark_file: false, tokens: { "--dz-body-bg": "rgb(251,241,199)" } },
    dark: { attr: "dark", dark_file: false, tokens: {
        "--dz-body-bg": "rgb(40, 40, 40)", "--dz-accent-values": "215,153,33",
        "--dz-status-timeout-values": "204, 36, 29", "--dz-sun-color": "#FABD2F",
        "--dz-toast-severity-lowbat": "#d79921", "--dz-widget-bg": "rgba(1, 2, 3, .5)"
    } }
};
const rec = (patch) => Object.assign(clone(GOOD_RECORD), patch);
const withDark = (tokens) => rec({ dark: { attr: "dark", dark_file: false, tokens } });
function machinonRecord(variant) {
    return { v: 1, folder: "machinon", family: "machinon", saved: variant, mode: variant,
             version: SHIPPED_THEME.version,
             light: { attr: null, dark_file: false, version: SHIPPED_THEME.version, tokens: {} },
             dark: { attr: "dark", dark_file: true, version: SHIPPED_THEME.version, tokens: {} } };
}

/* expect: null (the record is refused: no paint) or what is painted. */
const RECORD_FIXTURES = [
    { name: "a fixed dark mode paints the dark half", raw: GOOD_RECORD,
      expect: { family: "gruvbox", variant: "dark", attr: "dark", darkFile: false, tokens: GOOD_RECORD.dark.tokens } },
    { name: "a fixed light mode paints the light half", raw: rec({ mode: "light" }),
      expect: { family: "gruvbox", variant: "light", attr: "custom", darkFile: false, tokens: GOOD_RECORD.light.tokens } },
    { name: "auto on a dark device paints the dark half", raw: rec({ mode: "auto" }), deviceDark: true,
      expect: { family: "gruvbox", variant: "dark", attr: "dark", darkFile: false, tokens: GOOD_RECORD.dark.tokens } },
    { name: "auto on a light device paints the light half", raw: rec({ mode: "auto" }), deviceDark: false,
      expect: { family: "gruvbox", variant: "light", attr: "custom", darkFile: false, tokens: GOOD_RECORD.light.tokens } },
    { name: "an override made under the current device state wins in auto", raw: rec({ mode: "auto" }),
      override: { variant: "dark", deviceDark: false },
      expect: { family: "gruvbox", variant: "dark", attr: "dark", darkFile: false, tokens: GOOD_RECORD.dark.tokens } },
    { name: "an override made under the other device state is void in auto", raw: rec({ mode: "auto" }),
      override: { variant: "dark", deviceDark: true },
      expect: { family: "gruvbox", variant: "light", attr: "custom", darkFile: false, tokens: GOOD_RECORD.light.tokens } },
    { name: "an override wins in a fixed mode", raw: rec({ mode: "light" }), deviceDark: true,
      override: { variant: "dark", deviceDark: false },
      expect: { family: "gruvbox", variant: "dark", attr: "dark", darkFile: false, tokens: GOOD_RECORD.dark.tokens } },
    { name: "an override outside the whitelist is no override", raw: rec({ mode: "light" }),
      override: { variant: "__proto__", deviceDark: false },
      expect: { family: "gruvbox", variant: "light", attr: "custom", darkFile: false, tokens: GOOD_RECORD.light.tokens } },
    { name: "Machinon Dark loads the dark file with the painter's query", raw: machinonRecord("dark"),
      query: "?v=" + SHIPPED_THEME.version,
      expect: { family: "machinon", variant: "dark", attr: "dark", darkFile: true, tokens: {} } },
    { name: "a version that is not a plain version string adds no query",
      raw: { ...machinonRecord("dark"), version: "1\"><x" },
      expect: { family: "machinon", variant: "dark", attr: "dark", darkFile: true, tokens: {} } },
    { name: "a record without a version adds no query", raw: { ...machinonRecord("dark"), version: undefined },
      expect: { family: "machinon", variant: "dark", attr: "dark", darkFile: true, tokens: {} } },
    { name: "a half another theme version wrote still paints early",
      raw: rec({ version: "2.0.0", dark: { ...GOOD_RECORD.dark, version: "0.0.1" } }),
      expect: { family: "gruvbox", variant: "dark", attr: "dark", darkFile: false, tokens: GOOD_RECORD.dark.tokens } },
    { name: "Machinon Light sets nothing", raw: machinonRecord("light"),
      expect: { family: "machinon", variant: "light", attr: null, darkFile: false, tokens: {} } },
    { name: "hostile token names and values are dropped, the rest paints",
      raw: withDark({
          "--dz-body-bg": "rgb(1,2,3)",
          "--dz-nav-bg": "url(https://evil.example/x.png)",
          "--dz-widget-bg": "red;",
          "--dz-accent-color": "rgb(1,2,3);background:url(x)",
          "--dz-body-text": 12,
          "--dz-widget-text": null,
          "--DZ-SHOUT": "rgb(1,2,3)",
          "--dz-x;y": "rgb(1,2,3)",
          "color": "rgb(1,2,3)",
          "--secondary-text-color": "rgb(4,5,6)",
          "--other-text-color": "rgb(1,2,3)",
          "__proto__": "rgb(1,2,3)",
          "--dz-sun-color": "#abc",
          "--dz-moon-color": "#12345g",
          "--dz-accent-red": "rgba(1,2,3,1.5)",
          "--dz-card-min-width": "300px",
          "--dz-input-border": "rgb(1000,2,3)",
          "--dz-status-disabled": "rgba(9, 9, 9, 0.25)"
      }),
      expect: { family: "gruvbox", variant: "dark", attr: "dark", darkFile: false,
                tokens: { "--dz-body-bg": "rgb(1,2,3)", "--secondary-text-color": "rgb(4,5,6)",
                          "--dz-status-disabled": "rgba(9, 9, 9, 0.25)" } } },
    { name: "no record", raw: null, expect: null },
    { name: "JSON garbage", raw: "{not json", expect: null },
    { name: "the JSON literal null", raw: "null", expect: null },
    { name: "a JSON array", raw: "[1]", expect: null },
    { name: "a newer record version", raw: rec({ v: 2 }), expect: null },
    { name: "a string version", raw: rec({ v: "1" }), expect: null },
    { name: "the wanted half is missing", raw: rec({ dark: undefined }), expect: null },
    { name: "the wanted half is not an object", raw: rec({ dark: "dark" }), expect: null },
    { name: "tokens null", raw: rec({ dark: { attr: "dark", dark_file: false, tokens: null } }), expect: null },
    { name: "tokens an array", raw: rec({ dark: { attr: "dark", dark_file: false, tokens: ["rgb(1,2,3)"] } }), expect: null },
    { name: "an unknown attribute value", raw: rec({ dark: { attr: "evil", dark_file: false, tokens: {} } }), expect: null },
    { name: "a non-boolean dark_file", raw: rec({ dark: { attr: "dark", dark_file: "yes", tokens: {} } }), expect: null },
    { name: "an unknown mode", raw: rec({ mode: "sideways" }), expect: null },
    { name: "a folder that could leave the styles path", raw: rec({ folder: "../x" }), expect: null },
    { name: "no folder", raw: rec({ folder: undefined }), expect: null },
    { name: "a family that is not a string", raw: rec({ family: 7 }), expect: null }
];

for (const fx of RECORD_FIXTURES) {
    test(`paint record, both validators: ${fx.name}`, () => {
        const raw = fx.raw === null || typeof fx.raw === "string" ? fx.raw : JSON.stringify(fx.raw);
        const deviceDark = fx.deviceDark === true;
        const got = cm.dzReadPaintRecord(raw, deviceDark, fx.override);
        const store = {};
        if (raw !== null) store.dzPaintRecord = raw;
        if (fx.override) store["machinon.colorOverride"] = JSON.stringify(fx.override);
        const page = earlyPage({ store, deviceDark });
        if (fx.expect === null) {
            assert.equal(got, null);
            assert.equal(page.props.size, 0, "the early block set tokens for a refused record");
            assert.equal(page.html.getAttribute("data-dz-scheme"), null);
            assert.equal(page.links.length, 0);
            assert.equal(page.ctx.__dzEarlyPaint, undefined);
            return;
        }
        assert.deepEqual(clone(got), { folder: "machinon", ...fx.expect });
        assert.deepEqual(Object.fromEntries(page.props), fx.expect.tokens);
        assert.equal(page.html.getAttribute("data-dz-scheme"), fx.expect.attr);
        assert.deepEqual(clone(page.ctx.__dzEarlyPaint),
                         { family: fx.expect.family, variant: fx.expect.variant, darkFile: fx.expect.darkFile });
        assert.deepEqual(page.links.map((l) => l.getAttribute("href")),
                         fx.expect.darkFile ? ["styles/machinon/css/dark_theme.css" + (fx.query || "")] : []);
    });
}

test("dzReadPaintRecord refuses a raw value that is not a string", () => {
    assert.equal(cm.dzReadPaintRecord(GOOD_RECORD, true, null), null);
    assert.equal(cm.dzReadPaintRecord(undefined, true, null), null);
});

test("the early block is the first statement of custom.js and survives blocked storage", () => {
    assert.ok(CUSTOM_JS.startsWith("/* Paint the right light/dark variant"), "not the first statement");
    assert.ok(EARLY_SRC.indexOf("dzPaintRecord") !== -1, "the extracted block is not the early paint");
    const page = earlyPage({ storageThrows: true });
    assert.equal(page.props.size, 0);
    assert.equal(page.ctx.__dzEarlyPaint, undefined);
});

test("dzBuildPaintRecord: version 1, filtered tokens, absent halves omitted", () => {
    const built = cm.dzBuildPaintRecord({
        folder: "machinon", family: "gruvbox", saved: "gruvbox-light", mode: "auto",
        light: { attr: "custom", darkFile: false, tokens: { "--dz-body-bg": "rgb(1,2,3)", "--dz-nav-bg": "url(x)" } },
        dark: null
    });
    assert.deepEqual(clone(built), {
        v: 1, folder: "machinon", family: "gruvbox", saved: "gruvbox-light", mode: "auto",
        light: { attr: "custom", dark_file: false, tokens: { "--dz-body-bg": "rgb(1,2,3)" } }
    });
    const back = cm.dzReadPaintRecord(JSON.stringify(built), false, null);
    assert.deepEqual(clone(back.tokens), { "--dz-body-bg": "rgb(1,2,3)" });
    const base = { folder: "machinon", family: "f", saved: "s", mode: "light", light: null, dark: null };
    assert.equal(cm.dzBuildPaintRecord({ ...base, folder: "a/b" }), null);
    assert.equal(cm.dzBuildPaintRecord({ ...base, mode: undefined }), null);
    assert.equal(cm.dzBuildPaintRecord({ ...base, family: null }), null);
});

test("every value the painters write passes the token filter", () => {
    const b = browser();
    savedTheme(b, "paper-dark", "dark");
    b.ctx.dzSeedPaintedSlug();
    b.ctx.setColorScheme();
    /* Repaired values: an uppercase hex from the oklch solver, a lowercase
       one passed through, and the status triplet with spaces. */
    b.props.set("--dz-sun-color", "#FAD232");
    b.props.set("--dz-moon-color", "#8ba4d8");
    b.props.set("--dz-status-timeout-values", "204, 36, 29");
    const written = [...b.props.entries()].filter(([k]) => k.indexOf("card") === -1);
    assert.ok(written.some(([k]) => k === "--secondary-text-color"), "the scheme sets its secondary text");
    assert.ok(written.length > 10, "the paint set the scheme's tokens");
    const kept = cm.dzBuildPaintRecord({ folder: "machinon", family: "paper", saved: "paper-dark", mode: "dark",
        light: null, dark: { attr: "dark", darkFile: false, tokens: Object.fromEntries(written) } });
    assert.deepEqual(clone(kept.dark.tokens), Object.fromEntries(written));
});

test("a paint writes the record: the painted half read back, the mate computed from its colours", async () => {
    const b = browser();
    savedTheme(b, "gruvbox-light", "dark");
    b.ctx.dzSeedPaintedSlug();
    b.ctx.setColorScheme();
    await b.ctx.dzApplyColorMode();
    const r = JSON.parse(b.store.get("dzPaintRecord"));
    assert.equal(r.v, 1);
    assert.equal(r.folder, "machinon");
    assert.equal(r.family, "gruvbox");
    assert.equal(r.saved, "gruvbox-light");
    assert.equal(r.mode, "dark");
    assert.equal(r.dark.attr, "dark");
    assert.equal(r.dark.dark_file, false);
    assert.equal(r.dark.tokens["--dz-body-bg"], rgb(SCHEMES["gruvbox-dark"].colors.background));
    assert.equal(r.light.attr, "custom");
    assert.equal(r.light.tokens["--dz-body-bg"], rgb(SCHEMES["gruvbox-light"].colors.background));
    assert.equal(b.html.getAttribute("data-dz-scheme"), "dark", "computing the mate touched the page");
    assert.equal(b.props.get("--dz-body-bg"), rgb(SCHEMES["gruvbox-dark"].colors.background));
});

test("Machinon records both halves without tokens; a single family records its one version under both", async () => {
    const b = browser();
    savedTheme(b, "light", "light");
    b.ctx.dzSeedPaintedSlug();
    b.ctx.setColorScheme();
    await b.ctx.dzApplyColorMode();
    assert.deepEqual(JSON.parse(b.store.get("dzPaintRecord")), machinonRecord("light"));
    const c = browser();
    const t = savedTheme(c, "gruvbox-dark", "auto");
    t.scheme = "custom";
    c.ctx.dzSeedPaintedSlug();
    c.ctx.setColorScheme();
    await c.ctx.dzApplyColorMode();
    const r = JSON.parse(c.store.get("dzPaintRecord"));
    assert.equal(r.family, "custom");
    assert.deepEqual(r.light, r.dark);
    assert.equal(r.dark.attr, "dark");
    assert.equal(r.dark.tokens["--dz-body-bg"], rgb(SCHEMES["gruvbox-dark"].colors.background));
});

test("a mate whose colours are not at hand keeps its half from the previous record", async () => {
    const b = browser({ failFetch: true });
    savedTheme(b, "gruvbox-light", "light");
    const prev = { ...clone(GOOD_RECORD), version: SHIPPED_THEME.version };
    b.store.set("dzPaintRecord", JSON.stringify(prev));
    b.ctx.dzSeedPaintedSlug();
    b.ctx.setColorScheme();
    await b.ctx.dzApplyColorMode();
    const r = JSON.parse(b.store.get("dzPaintRecord"));
    assert.equal(r.mode, "light");
    assert.deepEqual(r.dark, { ...prev.dark, version: prev.version }, "a half without a version holds the record's");
    assert.equal(r.light.tokens["--dz-body-bg"], rgb(SCHEMES["gruvbox-light"].colors.background));
    const c = browser({ failFetch: true });
    savedTheme(c, "paper-light", "light");
    c.store.set("dzPaintRecord", JSON.stringify(prev));
    c.ctx.dzSeedPaintedSlug();
    c.ctx.setColorScheme();
    await c.ctx.dzApplyColorMode();
    assert.equal(JSON.parse(c.store.get("dzPaintRecord")).dark, undefined, "another family's half is never kept");
});

test("after an upgrade the mate's half survives from the old record until the scheme files load", async () => {
    const b = browser();
    const t = savedTheme(b, "gruvbox-light", "light");
    const old = clone(GOOD_RECORD);
    old.version = "0.0.1";
    old.dark.tokens = { "--dz-body-bg": "rgb(9, 9, 9)" };
    b.store.set("dzPaintRecord", JSON.stringify(old));
    b.ctx.dzSeedPaintedSlug();
    b.ctx.setColorScheme();
    await b.ctx.dzApplyColorMode();
    const r = JSON.parse(b.store.get("dzPaintRecord"));
    assert.equal(r.version, t.version);
    assert.equal(r.light.tokens["--dz-body-bg"], rgb(SCHEMES["gruvbox-light"].colors.background));
    assert.deepEqual(r.dark.tokens, old.dark.tokens, "kept for the early paint, not painted");
    assert.equal(b.fetches.length, 0);
    await b.ctx.loadBuiltinSchemes();
    const fresh = JSON.parse(b.store.get("dzPaintRecord"));
    assert.equal(fresh.dark.tokens["--dz-body-bg"], rgb(SCHEMES["gruvbox-dark"].colors.background));
});

test("a mate's half kept from an old record is never the final paint of a later boot", async () => {
    /* The upgrade boot paints the saved member and loads no scheme file. */
    const b = browser({ dark: false });
    const t = savedTheme(b, "gruvbox-light", "auto");
    const old = clone(GOOD_RECORD);
    old.mode = "auto";
    old.version = "0.0.1";
    old.dark.tokens = { "--dz-body-bg": "rgb(9, 9, 9)" };
    b.store.set("dzPaintRecord", JSON.stringify(old));
    runEarlyIn(b.ctx);
    b.ctx.dzSeedPaintedSlug();
    b.ctx.setColorScheme();
    await b.ctx.dzApplyColorMode(true);
    assert.equal(b.fetches.length, 0);
    const record = b.store.get("dzPaintRecord");
    assert.equal(JSON.parse(record).dark.version, "0.0.1", "the kept half keeps its own version");

    /* The next boot is on a dark device: the early block may show the kept
       half, the boot repaint must not settle on it. */
    const c = browser({ dark: true });
    savedTheme(c, "gruvbox-light", "auto");
    c.store.set("dzPaintRecord", record);
    runEarlyIn(c.ctx);
    assert.equal(c.props.get("--dz-body-bg"), "rgb(9, 9, 9)");
    c.ctx.dzSeedPaintedSlug();
    await c.ctx.dzApplyColorMode(true);
    assert.ok(c.fetches.length > 0, "the scheme files are fetched");
    assert.deepEqual(c.paints, ["gruvbox-dark"]);
    assert.equal(c.props.get("--dz-body-bg"), rgb(SCHEMES["gruvbox-dark"].colors.background));
    const r = JSON.parse(c.store.get("dzPaintRecord"));
    assert.equal(r.dark.version, t.version);
    assert.equal(r.dark.tokens["--dz-body-bg"], rgb(SCHEMES["gruvbox-dark"].colors.background));
});

test("a record an older build wrote, without versions on its halves, is read at the record's version", () => {
    const parsed = cm.dzParsePaintRecord(JSON.stringify(rec({ version: "1.2.3" })));
    assert.equal(parsed.light.version, "1.2.3");
    assert.equal(parsed.dark.version, "1.2.3");
    const mixed = clone(GOOD_RECORD);
    mixed.version = "1.2.3";
    mixed.dark.version = "1.0.0";
    mixed.light.version = 7;
    const m = cm.dzParsePaintRecord(JSON.stringify(mixed));
    assert.equal(m.dark.version, "1.0.0");
    assert.equal(m.light.version, null, "a version that is not a string is no version");
});

test("loading the scheme files refreshes the mate's half and keeps the painted one", async () => {
    const b = browser();
    savedTheme(b, "gruvbox-light", "light");
    b.ctx.dzSeedPaintedSlug();
    b.ctx.setColorScheme();
    await b.ctx.dzApplyColorMode();
    const stale = JSON.parse(b.store.get("dzPaintRecord"));
    stale.dark = { attr: "dark", dark_file: false, tokens: { "--dz-body-bg": "rgb(9,9,9)" } };
    stale.light.tokens["--dz-body-bg"] = "rgb(7,7,7)";
    b.store.set("dzPaintRecord", JSON.stringify(stale));
    await b.ctx.loadBuiltinSchemes();
    const r = JSON.parse(b.store.get("dzPaintRecord"));
    assert.equal(r.dark.tokens["--dz-body-bg"], rgb(SCHEMES["gruvbox-dark"].colors.background));
    assert.equal(r.light.tokens["--dz-body-bg"], "rgb(7,7,7)", "the painted half is what was on screen");
});

test("blocked storage never breaks a paint", async () => {
    const b = browser();
    savedTheme(b, "gruvbox-light", "dark");
    b.ctx.localStorage.setItem = () => { throw new Error("quota"); };
    b.ctx.localStorage.getItem = () => { throw new Error("blocked"); };
    b.ctx.dzSeedPaintedSlug();
    b.ctx.setColorScheme();
    await b.ctx.dzApplyColorMode();
    assert.equal(b.ctx.dzLastColorMode.slug, "gruvbox-dark");
});

test("a boot after an early paint repaints once from the record, with no scheme fetch", async () => {
    const b = browser();
    savedTheme(b, "gruvbox-light", "dark");
    const first = b.ctx;
    first.dzSeedPaintedSlug();
    first.setColorScheme();
    await first.dzApplyColorMode();
    const record = b.store.get("dzPaintRecord");

    const c = browser();
    savedTheme(c, "gruvbox-light", "dark");
    c.store.set("dzPaintRecord", record);
    runEarlyIn(c.ctx);
    assert.equal(c.props.get("--dz-body-bg"), rgb(SCHEMES["gruvbox-dark"].colors.background));
    c.ctx.dzSeedPaintedSlug();
    assert.equal(c.ctx.dzPaintedSlug, "gruvbox-dark");
    assert.equal(JSON.parse(record).version, SHIPPED_THEME.version);
    await c.ctx.dzApplyColorMode(true);
    assert.deepEqual(c.paints, ["gruvbox-dark"], "one paint, of the variant already on screen");
    assert.equal(c.fetches.length, 0, "a record of this version supplies the mate's colours");
    assert.equal(c.props.get("--dz-body-bg"), rgb(SCHEMES["gruvbox-dark"].colors.background));
    assert.equal(c.html.getAttribute("data-dz-scheme"), "dark");
});

test("an early paint of a family that no longer exists is repainted", async () => {
    const b = browser();
    savedTheme(b, "light", "light");
    b.store.set("dzPaintRecord", JSON.stringify(rec({ family: "user-pair:gone" })));
    runEarlyIn(b.ctx);
    b.ctx.dzSeedPaintedSlug();
    assert.equal(b.ctx.dzPaintedSlug, null);
    await b.ctx.dzApplyColorMode(true);
    assert.deepEqual(b.paints, ["light"]);
    assert.equal(b.html.getAttribute("data-dz-scheme"), null);
    assert.equal(b.props.get("--dz-body-bg"), undefined, "the stale tokens are cleared");
});

test("an early paint of the wanted variant stays when its colours cannot be fetched", async () => {
    const b = browser({ failFetch: true });
    savedTheme(b, "gruvbox-light", "dark");
    b.store.set("dzPaintRecord", JSON.stringify(rec({ dark: undefined, light: GOOD_RECORD.light })));
    b.ctx.__dzEarlyPaint = { family: "gruvbox", variant: "dark", darkFile: false };
    b.ctx.dzSeedPaintedSlug();
    await b.ctx.dzApplyColorMode(true);
    assert.deepEqual(b.paints, [], "the saved light member never paints over the dark one on screen");
});

/* The Domoticz-stored settings merge after boot. Its colour repaint goes
   through the resolver, so a mismatch boot is never painted twice and
   dark_theme.css is not dropped and re-added. */
function reconcileHarness(b, mutate) {
    b.ctx.checkUserVariableThemeSettings = () => { mutate(b.ctx.theme); return Promise.resolve(); };
    b.ctx.$ = { each: (o, fn) => Object.keys(o).forEach((k) => fn(k, o[k])) };
    for (const f of ["setLogo", "dzApplyCustomPageLabel", "applyBackground", "applyNavbarIconsText", "dzSyncModeToggles",
                     "dzDiagRefreshGate"]) {
        b.ctx[f] = () => {};
    }
    /* The reconcile does not wait for its repaint, which may fetch scheme
       files first. */
    return b.ctx.reconcileDomoticzSettingsInPlace().then(() => new Promise((r) => setTimeout(r, 20)));
}

test("a settings merge that changes no colour paints nothing and keeps dark_theme.css", async () => {
    const b = browser();
    savedTheme(b, "light", "dark");
    b.ctx.dzSeedPaintedSlug();
    b.ctx.setColorScheme();
    await b.ctx.dzApplyColorMode();
    assert.deepEqual(b.paints, ["light", "dark"]);
    const head = b.ctx.document.head;
    let churn = 0;
    const add = head.appendChild.bind(head);
    head.appendChild = (n) => { churn++; return add(n); };
    await reconcileHarness(b, (t) => { t.card_min_width = 321; });
    assert.deepEqual(b.paints, ["light", "dark"]);
    assert.equal(churn, 0);
    assert.equal(b.darkLinks().length, 1);
});

test("a settings merge that changes the colours paints them once", async () => {
    const b = browser();
    savedTheme(b, "light", "dark");
    b.ctx.dzSeedPaintedSlug();
    b.ctx.setColorScheme();
    await b.ctx.dzApplyColorMode();
    await reconcileHarness(b, (t) => {
        t.scheme = "gruvbox-light";
        t.scheme_base = "light";
        t.color_scheme = clone(SCHEMES["gruvbox-light"].colors);
        t.features.custom_color_scheme.enabled = true;
    });
    assert.deepEqual(b.paints, ["light", "dark", "gruvbox-dark"]);
    assert.equal(b.darkLinks().length, 0);
    const c = browser();
    savedTheme(c, "gruvbox-light", "light");
    c.ctx.theme.scheme = "custom";
    c.ctx.dzSeedPaintedSlug();
    c.ctx.setColorScheme();
    await c.ctx.dzApplyColorMode();
    await reconcileHarness(c, (t) => { t.color_scheme = { background: "#101010" }; });
    assert.deepEqual(c.paints, ["custom", "custom"], "same slug, new colours: repainted once");
    assert.equal(c.props.get("--dz-body-bg"), "rgb(16,16,16)");
});

test("an early paint left standing over the shipped defaults is repainted by the merge", async () => {
    const b = browser();
    savedTheme(b, "light", "auto");
    b.store.set("dzPaintRecord", JSON.stringify(machinonRecord("dark")));
    runEarlyIn(b.ctx);
    b.ctx.dzSettingsFromDefaults = true;
    b.ctx.dzSeedPaintedSlug();
    /* The merge finds the user's Machinon Dark, which the early block showed. */
    await reconcileHarness(b, (t) => {
        t.scheme = "dark"; t.scheme_base = "dark"; t.scheme_mode = "dark";
        t.features.dark_theme.enabled = true;
    });
    assert.deepEqual(b.paints, ["dark"], "painted once, by the merge");
    assert.equal(b.darkLinks().length, 1, "the early link was kept");
    /* Nothing stored differs from what the early block showed: still one
       paint, the first of the real settings (repairFixedColors included). */
    const c = browser();
    savedTheme(c, "dark", "dark");
    c.store.set("dzPaintRecord", JSON.stringify(machinonRecord("dark")));
    runEarlyIn(c.ctx);
    c.ctx.dzSettingsFromDefaults = true;
    c.ctx.dzSeedPaintedSlug();
    await reconcileHarness(c, () => {});
    assert.deepEqual(c.paints, ["dark"]);
    assert.equal(c.darkLinks().length, 1);
});

test("a failed settings merge still repaints over an early paint and reports the failure", async () => {
    const b = browser();
    savedTheme(b, "dark", "dark");
    b.store.set("dzPaintRecord", JSON.stringify(machinonRecord("dark")));
    runEarlyIn(b.ctx);
    b.ctx.dzSettingsFromDefaults = true;
    b.ctx.dzSeedPaintedSlug();
    b.ctx.checkUserVariableThemeSettings = () => Promise.reject(new Error("load failed"));
    await assert.rejects(b.ctx.reconcileDomoticzSettingsInPlace(), /load failed/);
    await tick();
    assert.deepEqual(b.paints, ["dark"], "the live settings paint, repairFixedColors included");
    assert.equal(b.events.filter((e) => e.type === "dz:colormode").length, 1, "the switch learns the variant");
});

test("the token names outside --dz- are exactly the painter's, in both validators", () => {
    const b = browser();
    const outside = [...b.ctx.DZ_CUSTOM_TOKENS].filter((n) => !/^--dz-/.test(n));
    assert.deepEqual([...cm.DZ_TOKEN_EXTRA_NAMES], outside);
    const early = /var EXTRA = (\[[^\]]*\]);/.exec(EARLY_SRC);
    assert.ok(early, "the early block lists its extra names");
    assert.deepEqual(JSON.parse(early[1]), outside);
});

test("a paint from the record keeps the scheme's secondary text colour", async () => {
    const b = browser();
    savedTheme(b, "gruvbox-light", "dark");
    b.ctx.dzSeedPaintedSlug();
    b.ctx.setColorScheme();
    await b.ctx.dzApplyColorMode();
    const c = browser();
    savedTheme(c, "gruvbox-light", "dark");
    c.store.set("dzPaintRecord", b.store.get("dzPaintRecord"));
    runEarlyIn(c.ctx);
    const want = rgb(SCHEMES["gruvbox-dark"].colors.alt_text);
    assert.equal(c.props.get("--secondary-text-color"), want, "the early block paints it");
    c.ctx.dzSeedPaintedSlug();
    await c.ctx.dzApplyColorMode(true);
    assert.equal(c.fetches.length, 0);
    assert.equal(c.props.get("--secondary-text-color"), want, "the boot repaint from the record keeps it");
});

test("a record another theme version wrote is repainted from the scheme files and rewritten", async () => {
    const b = browser();
    const t = savedTheme(b, "gruvbox-light", "dark");
    const old = clone(GOOD_RECORD);
    old.version = "0.0.1";
    old.dark.tokens = { "--dz-body-bg": "rgb(9, 9, 9)" };
    b.store.set("dzPaintRecord", JSON.stringify(old));
    runEarlyIn(b.ctx);
    assert.equal(b.props.get("--dz-body-bg"), "rgb(9, 9, 9)", "the early block paints it regardless");
    b.ctx.dzSeedPaintedSlug();
    await b.ctx.dzApplyColorMode(true);
    assert.ok(b.fetches.length > 0, "the scheme files were read");
    assert.equal(b.props.get("--dz-body-bg"), rgb(SCHEMES["gruvbox-dark"].colors.background));
    const r = JSON.parse(b.store.get("dzPaintRecord"));
    assert.equal(r.version, t.version);
    assert.equal(r.dark.tokens["--dz-body-bg"], rgb(SCHEMES["gruvbox-dark"].colors.background));
    /* A record without a version is treated the same way. */
    const c = browser();
    savedTheme(c, "gruvbox-light", "dark");
    c.store.set("dzPaintRecord", JSON.stringify(GOOD_RECORD));
    runEarlyIn(c.ctx);
    c.ctx.dzSeedPaintedSlug();
    await c.ctx.dzApplyColorMode(true);
    assert.ok(c.fetches.length > 0);
});

test("an unforced resolve overtaking the boot repaint of an old record still repaints and rewrites it", async () => {
    const b = browser({ dark: true });
    const t = savedTheme(b, "gruvbox-light", "auto");
    const old = clone(GOOD_RECORD);
    old.mode = "auto";
    old.version = "0.0.1";
    old.dark.tokens = { "--dz-body-bg": "rgb(9, 9, 9)" };
    b.store.set("dzPaintRecord", JSON.stringify(old));
    runEarlyIn(b.ctx);
    b.ctx.dzSeedPaintedSlug();
    assert.equal(b.ctx.dzPaintedSlug, "gruvbox-dark");
    /* init_theme's forced resolve waits on the scheme files; the settings
       merge then finds nothing changed and resolves unforced. */
    const boot = b.ctx.dzApplyColorMode(true);
    const merge = b.ctx.dzApplyColorMode(false);
    await Promise.all([boot, merge]);
    assert.deepEqual(b.paints, ["gruvbox-dark"], "the owed repaint happens once");
    assert.equal(b.props.get("--dz-body-bg"), rgb(SCHEMES["gruvbox-dark"].colors.background));
    const r = JSON.parse(b.store.get("dzPaintRecord"));
    assert.equal(r.version, t.version, "the old record is rewritten");
    assert.equal(r.dark.tokens["--dz-body-bg"], rgb(SCHEMES["gruvbox-dark"].colors.background));
});

/* ---- The grouped picker's pure parts (schemes.js) ---- */

test("picker state: fixed modes mark the mode's version and need no note", () => {
    const fams = cm.dzSchemeFamilies([]);
    const light = cm.dzSchemePickerState(fams, "light", "light", null, true);
    assert.deepEqual({ ...light }, { selected: "machinon", single: false, mode: "light",
                                     variant: "light", override: null, note: null });
    const dark = cm.dzSchemePickerState(fams, "gruvbox-light", "dark", null, false);
    assert.equal(dark.selected, "gruvbox");
    assert.equal(dark.variant, "dark", "the mode decides the painted version, not the saved member");
    assert.equal(dark.note, null);
});

test("picker state: Follow device follows the device and says so", () => {
    const fams = cm.dzSchemeFamilies([]);
    const d = cm.dzSchemePickerState(fams, "paper-light", "auto", null, true);
    assert.equal(d.variant, "dark");
    assert.equal(d.note, "auto_dark");
    const l = cm.dzSchemePickerState(fams, "paper-dark", "auto", null, false);
    assert.equal(l.variant, "light");
    assert.equal(l.note, "auto_light");
});

test("picker state: a single-version theme disables the mode with its own note", () => {
    const fams = cm.dzSchemeFamilies([{ name: "Old", base: "dark", colors: {} }]);
    for (const slug of ["custom", "user:Old"]) {
        const s = cm.dzSchemePickerState(fams, slug, "dark", { variant: "light", deviceDark: false }, false);
        assert.equal(s.single, true, slug);
        assert.equal(s.note, "single", slug);
        assert.equal(s.override, null, "the toggle does not apply to a single version");
    }
});

test("picker state: an override shows only while it changes what is painted", () => {
    const fams = cm.dzSchemeFamilies([]);
    const on = cm.dzSchemePickerState(fams, "light", "light", { variant: "dark", deviceDark: false }, false);
    assert.equal(on.override, "dark");
    assert.equal(on.variant, "dark", "the cards show what the screen shows");
    const same = cm.dzSchemePickerState(fams, "light", "light", { variant: "light", deviceDark: false }, false);
    assert.equal(same.override, null);
    const auto = cm.dzSchemePickerState(fams, "light", "auto", { variant: "dark", deviceDark: false }, false);
    assert.equal(auto.override, "dark");
    assert.equal(auto.note, null, "the override notice replaces the Follow device note");
    /* Made under a dark device, now light: expired in Follow device. */
    const stale = cm.dzSchemePickerState(fams, "light", "auto", { variant: "dark", deviceDark: true }, false);
    assert.equal(stale.override, null);
    assert.equal(stale.variant, "light");
    assert.equal(stale.note, "auto_light");
    const junk = cm.dzSchemePickerState(fams, "light", "light", { variant: "url(x)", deviceDark: false }, false);
    assert.equal(junk.override, null);
});

test("picker state: an unknown mode marks the saved member, an unknown pick selects nothing", () => {
    const fams = cm.dzSchemeFamilies([]);
    assert.equal(cm.dzSchemePickerState(fams, "gruvbox-dark", undefined, null, false).variant, "dark");
    const none = cm.dzSchemePickerState(fams, "user:Gone", "light", null, false);
    assert.equal(none.selected, null);
    assert.equal(none.single, false, "the mode stays usable");
    assert.equal(none.note, null);
});

/* cm is shared by every test in this file, so a dzT stub is put back after
   the body, whether it passes or throws. */
function withDzT(stub, body) {
    const had = Object.prototype.hasOwnProperty.call(cm, "dzT");
    const was = cm.dzT;
    cm.dzT = stub;
    try {
        return body();
    } finally {
        if (had) cm.dzT = was; else delete cm.dzT;
    }
}

test("picker cards: one per family, named from the lang files, the scheme files and the presets", () => withDzT((key) => "T:" + key, () => {
    const users = [
        { name: "Sunset", variant: "light", pair: "u:s1", base: "light", colors: { background: "#ffeedd" } },
        { name: "Sunset", variant: "dark",  pair: "u:s1", base: "dark",  colors: { background: "#221100" } },
        { name: "Old", base: "light", colors: { background: "#123456" } },
        { name: "Half", variant: "dark", pair: "u:h1", base: "dark", colors: { background: "#010203" } }
    ];
    const fams = cm.dzSchemeFamilies(users);
    const cards = Object.fromEntries(fams.map((f) => [f.id, cm.dzSchemeCardModel(f, SCHEMES, users, { background: "#abcdef" })]));
    assert.deepEqual(Object.keys(cards), ["machinon", "magenta", "paper", "gruvbox",
                                         "user-pair:u:s1", "user:Old", "user-pair:u:h1", "custom"]);
    assert.equal(cards.machinon.name, "T:hub.schemes.builtin.machinon.name");
    assert.equal(cards.machinon.light.background, "#f4f8fc");
    assert.equal(cards.machinon.dark.background, "#0f1620");
    for (const id of ["magenta", "paper", "gruvbox"]) {
        const light = SCHEMES[id + "-light"];
        assert.equal(cards[id].name, light.family_name, id);
        assert.equal(cards[id].desc, light.family_description, id);
        assert.equal(cards[id].light, light.colors);
        assert.equal(cards[id].dark, SCHEMES[id + "-dark"].colors);
    }
    const sunset = cards["user-pair:u:s1"];
    assert.equal(sunset.name, "Sunset");
    assert.equal(sunset.single, false);
    assert.equal(sunset.dark.background, "#221100");
    assert.equal(sunset.presetName, "Sunset");
    assert.ok(sunset.presetVariant === "light" || sunset.presetVariant === "dark");
    assert.equal(cards["user:Old"].single, true);
    assert.equal(cards["user:Old"].light.background, "#123456");
    assert.equal(cards["user:Old"].dark, null);
    assert.equal(cards["user:Old"].presetVariant, undefined, "a legacy preset deletes by name alone");
    assert.equal(cards["user-pair:u:h1"].single, true, "a pair missing a half is one version");
    assert.equal(cards["user-pair:u:h1"].light.background, "#010203");
    assert.equal(cards["user-pair:u:h1"].presetVariant, "dark");
    assert.equal(cards.custom.light.background, "#abcdef");
    assert.equal(cards.custom.deletable, false);
}));

test("picker cards: built-ins without their scheme files are named by family id", () => withDzT((key) => key, () => {
    const fam = cm.dzSchemeFamilies([]).filter((f) => f.id === "gruvbox")[0];
    const card = cm.dzSchemeCardModel(fam, {}, [], null);
    assert.equal(card.name, "gruvbox");
    assert.equal(card.light, null);
    assert.equal(card.dark, null);
}));

test("Machinon's card colours mirror the base token defaults", () => {
    const tokens = readFileSync("dz-tokens.css", "utf8");
    const dark = readFileSync("dark.css", "utf8");
    const pick = (css, name) => (css.match(new RegExp("^\\s*" + name + ":\\s*(#[0-9a-fA-F]{6})", "m")) || [])[1];
    const want = { background: "--dz-body-bg", item: "--dz-widget-bg", main_color: "--dz-accent-color", main_text: "--dz-body-text" };
    for (const [key, token] of Object.entries(want)) {
        assert.equal(cm.DZ_MACHINON_SWATCHES.light[key].toLowerCase(), (pick(tokens, token) || "").toLowerCase(), "light " + key);
        assert.equal(cm.DZ_MACHINON_SWATCHES.dark[key].toLowerCase(), (pick(dark, token) || "").toLowerCase(), "dark " + key);
    }
});

/* The quick toggle (color-mode-toggle.js) over the same fake page: its
   buttons are plain objects found by id, and dz:colormode is delivered to
   the listener the file registers. */
function withToggle(b) {
    const listeners = [];
    b.ctx.document.addEventListener = (type, fn) => { if (type === "dz:colormode") listeners.push(fn); };
    const buttons = {};
    ["dz-mode-toggle", "dz-mode-toggle-menu"].forEach((id) => {
        const btn = fakeElement("button", { nodes: [] });
        btn.hidden = true;
        buttons[id] = btn;
    });
    b.ctx.document.getElementById = (id) => buttons[id] || null;
    b.ctx.dzT = (key) => key;
    vm.runInContext(readFileSync("src/js/color-mode-toggle.js", "utf8"), b.ctx, { filename: "src/js/color-mode-toggle.js" });
    b.ctx.document.dispatchEvent = (e) => { b.events.push(e); listeners.forEach((fn) => fn(e)); return true; };
    b.buttons = buttons;
    return b;
}

function overrideOf(b) {
    return b.store.has("machinon.colorOverride") ? JSON.parse(b.store.get("machinon.colorOverride")) : null;
}

test("toggle: a tap under a fixed mode stores the other variant, a tap back clears it", async () => {
    const b = withToggle(browser());
    savedTheme(b, "gruvbox-light", "light");
    b.ctx.dzSeedPaintedSlug();
    await b.ctx.dzApplyColorMode();
    const btn = b.buttons["dz-mode-toggle"];
    assert.equal(btn.hidden, false);
    assert.equal(btn.getAttribute("aria-label"), "header.mode_to_dark");
    assert.equal(btn.getAttribute("data-painted"), "light");
    b.ctx.dzToggleColorMode();
    await new Promise((r) => setTimeout(r, 20));
    assert.equal(b.ctx.dzPaintedSlug, "gruvbox-dark");
    assert.deepEqual(overrideOf(b), { variant: "dark", deviceDark: false });
    assert.equal(btn.getAttribute("aria-label"), "header.mode_to_light");
    assert.equal(btn.getAttribute("data-painted"), "dark");
    b.ctx.dzToggleColorMode();
    await new Promise((r) => setTimeout(r, 20));
    assert.equal(b.ctx.dzPaintedSlug, "gruvbox-light");
    assert.equal(overrideOf(b), null, "tapping back to the mode's variant leaves no override");
    assert.equal(b.ctx.theme.scheme, "gruvbox-light");
    assert.deepEqual(b.persists, [], "a tap never saves");
});

test("toggle: under Follow device a device switch drops the tap's override", async () => {
    const b = withToggle(browser());
    savedTheme(b, "gruvbox-light", "auto");
    b.ctx.dzSeedPaintedSlug();
    b.ctx.dzArmColorModeListener();
    await b.ctx.dzApplyColorMode();
    b.ctx.dzToggleColorMode();
    await new Promise((r) => setTimeout(r, 20));
    assert.deepEqual(overrideOf(b), { variant: "dark", deviceDark: false });
    b.setDark(true);
    await new Promise((r) => setTimeout(r, 20));
    assert.equal(overrideOf(b), null);
    assert.equal(b.ctx.dzPaintedSlug, "gruvbox-dark");
    assert.equal(b.buttons["dz-mode-toggle"].getAttribute("aria-label"), "header.mode_to_light");
});

test("toggle: hidden for a single-version theme and while the setting is off", async () => {
    const b = withToggle(browser());
    savedTheme(b, "light", "light");
    b.ctx.dzSeedPaintedSlug();
    await b.ctx.dzApplyColorMode();
    const both = () => Object.values(b.buttons).map((x) => x.hidden);
    assert.deepEqual(both(), [false, false]);
    b.ctx.theme.features.color_mode_toggle.enabled = false;
    b.ctx.dzSyncModeToggles();
    assert.deepEqual(both(), [true, true]);
    b.ctx.theme.features.color_mode_toggle.enabled = true;
    b.ctx.dzLastColorMode = { slug: "custom", variant: null, single: true };
    b.ctx.dzSyncModeToggles();
    assert.deepEqual(both(), [true, true]);
});

test("toggle: the buttons stay hidden until the first dz:colormode", () => {
    const b = withToggle(browser());
    savedTheme(b, "light", "light");
    b.ctx.dzSyncModeToggles();
    assert.deepEqual(Object.values(b.buttons).map((x) => x.hidden), [true, true]);
});

test("every token a scheme can set inline is one a scheme switch clears", () => {
    /* A token applyCustomColorScheme sets but DZ_CUSTOM_TOKENS misses stays
       pinned on <html> after switching away (Paper's muted identity colours
       onto every later scheme). Feed it every key any built-in scheme carries,
       plus the identity keys only Paper sets today, and collect what it writes. */
    const b = browser();
    const cs = {};
    for (const slug of INDEX) for (const k of Object.keys(SCHEMES[slug].colors || {})) cs[k] = "#123456";
    for (const k of ["sun", "moon", "energy_import", "energy_export", "energy_gas",
                     "energy_water", "energy_price", "energy_grid"]) cs[k] = "#123456";
    const written = [];
    b.ctx.applyCustomColorScheme(cs, { style: { setProperty: (name) => written.push(name) } });
    assert.ok(written.includes("--dz-widget-energy-grid"), "the grid key is applied");
    const cleared = new Set(b.ctx.DZ_CUSTOM_TOKENS);
    for (const name of written) assert.ok(cleared.has(name), `${name} is set inline but never cleared`);
});
