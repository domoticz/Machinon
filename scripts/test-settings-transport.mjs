import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/* Same pattern as test-diag.mjs and test-toast-policy.mjs: settings-transport.js
   is a plain browser script whose top level only declares things, so the
   SHIPPING file runs in a vm context and its globals are read back. The
   diagnostics seam is the part exercised here, because it is the part with a
   contract that can silently invert: an ERR arrives as a RESOLVED object from
   dzApiPost, so a seam that reads "the promise kept its word" reports a failed
   save as a success. */
function loadTransport(extra) {
    const ctx = vm.createContext(Object.assign({
        Math, console, JSON, Promise, URLSearchParams,
        window: {},
        theme: { features: {}, values: {} },
        performance: { now: () => 0 }
    }, extra || {}));
    vm.runInContext(readFileSync("src/js/settings-transport.js", "utf8"), ctx,
                    { filename: "src/js/settings-transport.js" });
    return ctx;
}

/* Captures what the seam handed the recorder. */
function withRecorder(extra) {
    const lines = [];
    const ctx = loadTransport(Object.assign({
        dzLog: (seam, event, fields) => { lines.push({ seam, event, fields }); return true; },
        dzLogOn: true,
        dzDiagNow: () => 0
    }, extra || {}));
    ctx.lines = lines;
    return ctx;
}

test("a save that resolved an ERR object is recorded as an error, not as ok", () => {
    /* dzApiPost resolves { status: "ERR" } rather than rejecting, so that one
       failing write cannot wedge the serialised write chain. Every reader of
       this seam has to take the outcome off the payload for the same reason. */
    const ctx = withRecorder();
    ctx.dzSettingsLogSave("native", { ok: false, error: "conflict" }, 0);
    assert.equal(ctx.lines.length, 1);
    assert.equal(ctx.lines[0].fields.outcome, "error:conflict");
});

test("a save with no error field still records ok", () => {
    const ctx = withRecorder();
    ctx.dzSettingsLogSave("native", { ok: true }, 0);
    assert.equal(ctx.lines[0].fields.outcome, "ok");
    assert.equal(ctx.lines[0].fields.transport, "native");
});

test("the load layer names which layers were actually present", () => {
    const ctx = withRecorder();
    ctx.dzApiState.instanceSnap = { features: {}, values: {} };
    ctx.dzApiState.userSnap = null;
    ctx.dzSettingsLogLoad("native", "loaded", 0);
    assert.equal(ctx.lines[0].fields.layer, "instance");
    ctx.dzApiState.userSnap = { features: {}, values: {} };
    ctx.dzSettingsLogLoad("native", "loaded", 0);
    assert.equal(ctx.lines[1].fields.layer, "instance+user");
});

test("the save layer follows what dzApiSaveSettings would actually write", () => {
    const ctx = withRecorder();
    ctx.dzApiState.perUser = false;
    assert.equal(ctx.dzSettingsSaveLayer(), "instance");
    ctx.dzApiState.perUser = true;
    ctx.window.my_config = { userrights: 0 };
    assert.equal(ctx.dzSettingsSaveLayer(), "user");
    ctx.window.my_config = { userrights: 2 };
    assert.equal(ctx.dzSettingsSaveLayer(), "user+instance");
});

test("keys_changed counts the settings a save actually changes", () => {
    const ctx = withRecorder();
    const stored = { features: { time_ago: true, warn_battery: false }, values: { scheme: "blue" } };
    const current = { features: { time_ago: true, warn_battery: true }, values: { scheme: "magenta" } };
    assert.equal(ctx.dzSettingsChangedKeys(current, stored), 2);
    assert.equal(ctx.dzSettingsChangedKeys(stored, stored), 0);
});

test("keys_changed is null, not zero, when there is no stored layer to compare against", () => {
    /* Absent rather than 0 in the recorded line: "nothing changed" and "there
       was nothing there yet" are different facts about the house and a reader
       cannot tell them apart from a zero. */
    const ctx = withRecorder();
    assert.equal(ctx.dzSettingsChangedKeys({ features: {}, values: {} }, null), null);
    ctx.dzApiState.instanceSnap = null;
    ctx.dzSettingsLogSave("native", { ok: true }, 0);
    assert.equal("keys_changed" in ctx.lines[0].fields, false);
});

test("a legacy save reports no keys_changed at all", () => {
    /* The uservariable transport has no stored snapshot to diff against, so a
       count there would be a number with no meaning behind it. */
    const ctx = withRecorder();
    ctx.dzApiState.instanceSnap = { features: { a: 1 }, values: {} };
    ctx.dzSettingsLogSave("legacy", { ok: true }, 0);
    assert.equal(ctx.lines[0].fields.layer, "uservars");
    assert.equal("keys_changed" in ctx.lines[0].fields, false);
});

test("the seam is silent, not fatal, with no recorder present", () => {
    const ctx = loadTransport();
    ctx.dzSettingsLogLoad("native", "failed", 0);
    ctx.dzSettingsLogSave("native", { ok: false, error: "unreachable" }, 0);
});

test("a throwing recorder does not take the boot chain or the save with it", () => {
    const ctx = withRecorder({ dzLog: () => { throw new Error("recorder broke"); } });
    ctx.dzSettingsLogLoad("native", "loaded", 0);
    ctx.dzSettingsLogSave("native", { ok: true }, 0);
});

/* dzApplySnapshot copies a stored row onto the live theme object. A row is
   whatever the server holds, so only the value keys dzSettingsSnapshot itself
   writes may land: anything else (a "features" value that would replace the
   feature table and its file lists, a "__proto__" key, a stray name) must be
   ignored rather than copied. */
test("dzApplySnapshot applies only the value keys a settings snapshot defines", () => {
    const ctx = loadTransport();
    const t = vm.runInContext("({ features: { standby: { id: 13, enabled: false, files: ['standby.js'] } } })", ctx);
    const protoBefore = Object.getPrototypeOf(t);
    const snap = JSON.parse('{"features":{},"values":{"button_name":"Home",' +
        '"features":{"standby":{"enabled":true,"files":["../../evil.js"]}},' +
        '"__proto__":{"polluted":true},"bogus":1}}');
    ctx.dzApplySnapshot(t, snap);
    assert.equal(t.button_name, "Home");
    assert.deepEqual(Array.from(t.features.standby.files), ["standby.js"]);
    assert.equal(Object.getPrototypeOf(t), protoBefore);
    assert.equal(t.polluted, undefined);
    assert.equal(t.bogus, undefined);
});

/* Legacy uservariable transport (cores without the ThemeSettings API, e.g.
   Domoticz 2026.1): the -features var stores the ids that were ENABLED, so an
   id the writer never knew about must not read as "switched off". */
const FEATURES = {
    time_ago: { id: 16 }, rgbw_popup: { id: 45 }, warn_timeout: { id: 46 },
    warn_battery: { id: 47 }, diagnostic_logging: { id: 48 }, future_toggle: { id: 49 }
};
const DEFAULTS = {
    time_ago: true, rgbw_popup: true, warn_timeout: true,
    warn_battery: true, diagnostic_logging: false, future_toggle: true
};
const legacyStates = (list, watermark) =>
    loadTransport().dzLegacyFeatureStates(list, watermark, FEATURES, DEFAULTS);

test("legacy: a watermarked list is exact, newer ids take their default", () => {
    const s = legacyStates([16, 46], 48);
    assert.equal(s.time_ago, true);
    assert.equal(s.rgbw_popup, false);
    assert.equal(s.warn_timeout, true);
    assert.equal(s.warn_battery, false);
    assert.equal(s.diagnostic_logging, false);
    assert.equal(s.future_toggle, true);
});

test("legacy: an unmarked list never knew ids above 48", () => {
    assert.equal(legacyStates([16, 46, 47, 45], undefined).future_toggle, true);
});

test("legacy: a pre-2.4 list carries the old warnings toggle onto both new ones", () => {
    const s = legacyStates([16, 29, 43], undefined);
    assert.equal(s.warn_timeout, true);
    assert.equal(s.warn_battery, true);
});

test("legacy: a pre-2.4 list gets the RGBW popup default, 2.0.0 never knew it", () => {
    assert.equal(legacyStates([16, 29], undefined).rgbw_popup, true);
});

test("legacy: an unmarked list with neither warning resets both to their default once", () => {
    const s = legacyStates([16, 45], undefined);
    assert.equal(s.warn_timeout, true);
    assert.equal(s.warn_battery, true);
    assert.equal(s.rgbw_popup, true);
});

test("legacy: an unmarked 2.4+ list keeps a deliberate choice between the warnings", () => {
    const s = legacyStates([16, 46], undefined);
    assert.equal(s.warn_timeout, true);
    assert.equal(s.warn_battery, false);
    assert.equal(s.rgbw_popup, false);
});

test("legacy: a watermarked list keeps both warnings off when both are absent", () => {
    const s = legacyStates([16], 48);
    assert.equal(s.warn_timeout, false);
    assert.equal(s.warn_battery, false);
});

test("legacy: junk watermarks are treated as absent", () => {
    for (const wm of ["48", -1, 1.5, null, {}, NaN]) {
        assert.equal(legacyStates([16, 46, 47], wm).future_toggle, true, String(wm));
    }
});

test("legacy: the save writes the highest known feature id as the watermark", () => {
    const ctx = loadTransport();
    assert.equal(ctx.dzLegacyFeatureWatermark(FEATURES), 49);
    assert.equal(ctx.dzLegacyFeatureWatermark({}), 0);
});

/* theme.scheme_mode: native migration (2 -> 3) and the legacy custom[15]. */
const clone = (o) => JSON.parse(JSON.stringify(o));
const migrate = (snap) => clone(loadTransport().dzMigrateSnapshot(snap));

test("scheme_mode: a v2 row that saved a dark scheme migrates to dark", () => {
    const out = migrate({ schemaVersion: 2, features: {}, values: { scheme: "nord", scheme_base: "dark" } });
    assert.equal(out.values.scheme_mode, "dark");
    assert.equal(out.schemaVersion, 3);
});

test("scheme_mode: a v2 row that never picked a scheme migrates to light, not auto", () => {
    assert.equal(migrate({ schemaVersion: 2, features: {}, values: {} }).values.scheme_mode, "light");
});

test("scheme_mode: a v2 row with only the dark feature migrates to dark", () => {
    const out = migrate({ schemaVersion: 2, features: { dark_theme: true }, values: {} });
    assert.equal(out.values.scheme_mode, "dark");
});

test("scheme_mode: an existing valid mode is kept by the migration", () => {
    const out = migrate({ schemaVersion: 2, features: {}, values: { scheme_base: "dark", scheme_mode: "auto" } });
    assert.equal(out.values.scheme_mode, "auto");
});

test("scheme_mode: an invalid stored mode is re-derived from the base", () => {
    const out = migrate({ schemaVersion: 2, features: {}, values: { scheme_base: "dark", scheme_mode: "sideways" } });
    assert.equal(out.values.scheme_mode, "dark");
});

test("scheme_mode: a non-object snapshot or values does not throw and stays usable", () => {
    const ctx = loadTransport();
    for (const bad of ["x", 5, null, []]) {
        assert.doesNotThrow(() => ctx.dzMigrateSnapshot(bad), String(JSON.stringify(bad)));
    }
    for (const values of ["x", 5, null, []]) {
        const out = clone(ctx.dzMigrateSnapshot({ schemaVersion: 2, features: {}, values }));
        assert.equal(out.values.scheme_mode, "light", JSON.stringify(values));
    }
});

test("scheme_mode: the snapshot carries it beside scheme and scheme_base", () => {
    const v = clone(loadTransport().dzSettingsSnapshot({
        scheme: "nord", scheme_base: "dark", scheme_mode: "auto", features: {}
    }).values);
    assert.equal(v.scheme_mode, "auto");
    assert.equal(v.scheme, "nord");
    assert.equal(v.scheme_base, "dark");
});

test("scheme_mode: a v3 row rewritten by a v2 writer re-derives from its base (accepted downgrade behaviour)", () => {
    const out = migrate({ schemaVersion: 2, features: {}, values: { scheme: "light", scheme_base: "light" } });
    assert.equal(out.values.scheme_mode, "light");
});

test("scheme_mode: a current-version native row with a corrupt mode is normalised after the merge", async () => {
    for (const [stored, base, want] of [["sideways", "dark", "dark"], [7, "light", "light"], ["auto", "dark", "auto"]]) {
        const ctx = loadTransport({
            theme: { features: { dark_theme: { enabled: false } }, scheme_mode: "auto", scheme_base: "light" },
            cacheThemeSettings: () => {}
        });
        ctx.dzApiFetchLayers = () => {
            ctx.dzApiState.instanceSnap = { schemaVersion: 3, features: {},
                                            values: { scheme: "nord", scheme_base: base, scheme_mode: stored } };
            ctx.dzApiState.userSnap = null;
            return Promise.resolve(ctx.DZ_LOAD_LOADED);
        };
        assert.equal(await ctx.dzApiLoad(), ctx.DZ_LOAD_LOADED);
        assert.equal(ctx.theme.scheme_mode, want, JSON.stringify(stored));
    }
});

/* Drives the real legacy loaders against stubbed uservariables. */
async function legacyLoad({ list, custom, theme, withCustom = true, customFails }) {
    const vars = { 1: list, 2: custom };
    const t = Object.assign({
        scheme: "light", scheme_base: "light",
        features: { dark_theme: { id: 3, enabled: false }, time_ago: { id: 16, enabled: false } }
    }, theme || {});
    const $ = {
        ajax: (o) => {
            const m = /idx=(\d+)/.exec(o.url);
            if (customFails === "error" && m[1] === "2") return o.error();
            if (customFails === "malformed" && m[1] === "2") return o.success({ status: "OK", result: [{ Value: "{not json" }] });
            o.success({ status: "OK", result: [{ Value: JSON.stringify(vars[m[1]]) }] });
        },
        each: (c, fn) => { Object.keys(c).forEach((k) => fn(k, c[k])); }
    };
    const ctx = loadTransport({
        $, theme: t, themeFolder: "machinon", themeName: "Machinon",
        cacheThemeSettings: () => {}, dzDefaultsSnap: null,
        fetch: async () => ({ json: async () => ({ features: { dark_theme: { id: 3, enabled: false }, time_ago: { id: 16, enabled: false } } }) })
    });
    ctx.dzLegacyLoaded = { list: null, watermark: undefined, mode: undefined };
    const pending = [ctx.getFeatureThemeSettings(1)];
    if (withCustom) pending.push(ctx.getCustomThemeSettings(2));
    await Promise.all(pending).then(ctx.dzApplyLegacyFeatures).then(ctx.dzApplyLegacySchemeMode);
    return ctx.theme;
}
const C15 = ["10", "Home", "", "", [], "", "", "nord", "dark", [], 320, 500, 10, "daily", 49];

test("scheme_mode legacy: a 15 entry array with a dark base derives dark", async () => {
    assert.equal((await legacyLoad({ list: [], custom: C15 })).scheme_mode, "dark");
});

test("scheme_mode legacy: custom[15] auto is read as auto", async () => {
    assert.equal((await legacyLoad({ list: [], custom: C15.concat(["auto"]) })).scheme_mode, "auto");
});

test("scheme_mode legacy: junk at custom[15] is derived from the base", async () => {
    for (const junk of [{}, "sideways"]) {
        assert.equal((await legacyLoad({ list: [], custom: C15.concat([junk]) })).scheme_mode, "dark", JSON.stringify(junk));
    }
});

test("scheme_mode legacy: a list-only load derives from the dark_theme feature", async () => {
    const t = await legacyLoad({ list: [3], custom: null, withCustom: false, theme: { scheme_base: undefined } });
    assert.equal(t.scheme_mode, "dark");
});

test("scheme_mode legacy: the save writes the mode at custom[15]", async () => {
    let sent = {};
    class Body { constructor() { this.m = {}; } set(k, v) { this.m[k] = v; } }
    const ctx = loadTransport({
        URLSearchParams: Body, themeFolder: "machinon", themeName: "Machinon",
        theme: { features: {}, scheme_mode: "auto", scheme_base: "light" },
        $: { each: () => {} },
        fetch: async (u, o) => { sent[o.body.m.vname] = o.body.m.vvalue; return { ok: true, json: async () => ({ status: "OK" }) }; }
    });
    await ctx.dzThemeSettingsSaveNow("add");
    assert.equal(JSON.parse(sent["theme-machinon-custom"])[15], "auto");
});

test("scheme_mode legacy: a failed custom read keeps the painted auto", async () => {
    const t = await legacyLoad({ list: [], custom: C15, customFails: "error", theme: { scheme_mode: "auto", scheme_base: "dark" } });
    assert.equal(t.scheme_mode, "auto");
});

test("scheme_mode legacy: a malformed custom value keeps the painted auto", async () => {
    const t = await legacyLoad({ list: [], custom: C15, customFails: "malformed", theme: { scheme_mode: "auto", scheme_base: "dark" } });
    assert.equal(t.scheme_mode, "auto");
});

test("scheme_mode legacy: an unread custom var with an invalid painted mode still derives", async () => {
    const t = await legacyLoad({ list: [], custom: C15, customFails: "error", theme: { scheme_mode: "junk", scheme_base: "dark" } });
    assert.equal(t.scheme_mode, "dark");
});

/* The light/dark toggle (id 49) ships on, so an install whose settings an
   earlier version saved gets it on too, while a list that knew id 49 keeps
   the user's off. Read from the shipped theme.json, not a fixture. */
test("legacy: the shipped light/dark toggle is on for a list saved before it existed", () => {
    const shipped = JSON.parse(readFileSync("theme.json", "utf8")).features;
    const defaults = {};
    Object.keys(shipped).forEach((k) => { defaults[k] = shipped[k].enabled === true; });
    assert.equal(shipped.color_mode_toggle.id, 49);
    assert.deepEqual(shipped.color_mode_toggle.files, []);
    const tr = loadTransport();
    assert.equal(tr.dzLegacyFeatureStates([16, 46, 47], 48, shipped, defaults).color_mode_toggle, true);
    assert.equal(tr.dzLegacyFeatureStates([16, 46, 47], 49, shipped, defaults).color_mode_toggle, false);
});

/* ---- The account the page's settings belong to ----

   Core's getauth answer decides it: a named login is its own account, a
   session core shares between every client (-nowwwpwd, a trusted network:
   canlogout false, the same test core uses for PerUser) is the one shared
   identity "*", and no user means nobody is logged in. */
test("account: getauth answers map to a named account, the shared identity, nobody, or unknown", () => {
    const tr = loadTransport();
    assert.equal(tr.dzAccountKeyOf({ status: "OK", user: "user", rights: 1, canlogout: true }), "u:user");
    assert.equal(tr.dzAccountKeyOf({ status: "OK", user: "admin", rights: 2, canlogout: false }), "*");
    assert.equal(tr.dzAccountKeyOf({ status: "OK", canlogout: true }), null);
    assert.equal(tr.dzAccountKeyOf({ status: "OK", user: "", canlogout: true }), null);
    assert.equal(tr.dzAccountKeyOf({ status: "ERR" }), undefined);
    assert.equal(tr.dzAccountKeyOf(null), undefined);
    assert.equal(tr.dzAccountKeyOf("OK"), undefined);
    assert.equal(tr.dzAccountKeyOf({ status: "OK", user: 7, canlogout: true }), null);
});

test("account: the shared identity keeps the unsuffixed keys, a named one gets its own", () => {
    const tr = loadTransport();
    assert.equal(tr.dzAccountSuffix("*"), "");
    assert.equal(tr.dzAccountSuffix("u:user"), "@user");
    assert.equal(tr.dzAccountSuffix("u:a b/\u00e9@x"), "@a%20b%2F%C3%A9%40x");
    for (const nobody of [null, undefined, "", "user", "u:", 7]) {
        assert.equal(tr.dzAccountSuffix(nobody), null, JSON.stringify(nobody));
    }
    assert.equal(tr.dzAccountSuffix("u:\ud800"), null, "a name encodeURIComponent refuses has no keys");
});

test("account: the page starts on the account core named to the early block, else on the browser's last one", () => {
    const store = (v) => ({ getItem: (k) => (k === "dzPaintAccount" ? v : null) });
    assert.equal(loadTransport({ window: { __dzEarlyAccount: { key: "u:user" } }, localStorage: store("u:admin") }).dzAccount, "u:user");
    assert.equal(loadTransport({ window: { __dzEarlyAccount: { key: null } } }).dzAccount, null);
    assert.equal(loadTransport({ window: {}, localStorage: store("*") }).dzAccount, "*");
    assert.equal(loadTransport({ window: {}, localStorage: store("u:admin") }).dzAccount, "u:admin",
                 "provisional: the boot confirms it before any settings merge");
    assert.equal(loadTransport({ window: {}, localStorage: store("admin") }).dzAccount, undefined, "not an account key");
    assert.equal(loadTransport({ window: {}, localStorage: { getItem: () => { throw new Error("blocked"); } } }).dzAccount,
                 undefined);
    assert.equal(loadTransport().dzAccount, undefined);
    const w = {};
    loadTransport({ window: w });
    assert.equal(w.__dzEarlyClosed, true, "a late getauth answer no longer repaints once the theme runs");
});

/* A native transport whose fetch answers getauth with `auth` and records
   every POST. */
function guarded(auth, account) {
    const posts = [];
    const ctx = loadTransport({
        themeFolder: "machinon", ShowNotify: () => {}, dzT: (k) => k,
        console: { log() {}, warn() {} },
        fetch: async (url, opts) => {
            if (/param=getauth/.test(url)) return { json: async () => auth };
            if (opts && opts.method === "POST") posts.push(opts.body.get("param"));
            return { json: async () => ({ status: "OK", lastupdate: "t1" }) };
        }
    });
    ctx.dzAccount = account;
    return { ctx, posts };
}

test("account: a write goes out while the session is still the page's account", async () => {
    const { ctx, posts } = guarded({ status: "OK", user: "user", canlogout: true }, "u:user");
    const res = await ctx.dzApiWrite("themesettings_set", "user", () => ({ features: {}, values: {} }));
    assert.equal(res.ok, true);
    assert.deepEqual(posts, ["themesettings_set"]);
});

test("account: a write is refused when another account now holds the session", async () => {
    const { ctx, posts } = guarded({ status: "OK", user: "user", canlogout: true }, "u:admin");
    let noticed = null;
    ctx.dzAccountMaybeChanged = (key) => { noticed = key; };
    const res = await ctx.dzApiWrite("themesettings_set", "user", () => ({ features: {}, values: {} }));
    assert.equal(res.ok, false);
    assert.equal(res.error, "account_changed");
    assert.deepEqual(posts, [], "nothing reached the other account's row");
    assert.equal(noticed, "u:user", "the page is told whose session it is now");
    const reset = await ctx.dzApiReset("themesettings_set");
    assert.equal(reset.ok, false);
    assert.deepEqual(posts, [], "a reset is refused the same way");
});

test("account: a write is refused when the session's account cannot be read", async () => {
    const { ctx, posts } = guarded({ status: "ERR" }, "u:user");
    const res = await ctx.dzApiWrite("themesettings_set", "user", () => ({ features: {}, values: {} }));
    assert.equal(res.ok, false);
    assert.deepEqual(posts, []);
});
