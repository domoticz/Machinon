import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/* The warm-boot rebuild (dzThemeFromCache) and the versioned settings migration
   (dzMigrateSnapshot). Both are pure over plain objects, so the SHIPPING files
   run in a vm context and their globals are read back. theme.json is the real
   shipped file: the point of the rebuild is that it, not the browser cache,
   decides feature ids and file lists. */
function load() {
    const ctx = vm.createContext({ console, JSON, Math, window: {}, theme: {} });
    for (const f of ["src/js/theme-manifest.js", "src/js/settings-transport.js", "src/js/settings-store.js"]) {
        vm.runInContext(readFileSync(f, "utf8"), ctx, { filename: f });
    }
    return ctx;
}
const SHIPPED = JSON.parse(readFileSync("theme.json", "utf8"));
const clone = (o) => JSON.parse(JSON.stringify(o));

/* A cache as an older install wrote it: the whole theme object, with a stale
   version, a stale file list, a feature theme.json no longer ships, and
   without features added since. */
function oldCache() {
    const c = clone(SHIPPED);
    c.version = "2.0.0";
    c.features.switch_instead_of_bigtext = { id: 20, enabled: false, files: ["old-switch.js"] };
    c.features.retired_feature = { id: 99, enabled: true, files: ["gone.js"] };
    delete c.features.diagnostic_logging;
    delete c.features.rgbw_popup;
    delete c.warn_repeat;
    c.button_name = "My House";
    c.card_min_width = 400;
    c.usercustomsvariable = 12;
    return c;
}

test("feature ids and file lists come from the shipped theme.json, not the cache", () => {
    const dz = load();
    const t = dz.dzThemeFromCache(oldCache(), clone(SHIPPED));
    assert.deepEqual(Array.from(t.features.switch_instead_of_bigtext.files), SHIPPED.features.switch_instead_of_bigtext.files);
    assert.equal(t.features.switch_instead_of_bigtext.id, SHIPPED.features.switch_instead_of_bigtext.id);
});

test("the user's own choices survive the rebuild", () => {
    const dz = load();
    const t = dz.dzThemeFromCache(oldCache(), clone(SHIPPED));
    assert.equal(t.features.switch_instead_of_bigtext.enabled, false);
    assert.equal(t.button_name, "My House");
    assert.equal(t.card_min_width, 400);
});

test("a feature added since the cache was written gets its shipped default", () => {
    const dz = load();
    const t = dz.dzThemeFromCache(oldCache(), clone(SHIPPED));
    assert.deepEqual(clone(t.features.diagnostic_logging), SHIPPED.features.diagnostic_logging);
    assert.deepEqual(clone(t.features.rgbw_popup), SHIPPED.features.rgbw_popup);
});

test("a setting added since the cache was written gets its shipped default", () => {
    const dz = load();
    const t = dz.dzThemeFromCache(oldCache(), clone(SHIPPED));
    assert.equal(t.warn_repeat, SHIPPED.warn_repeat);
});

test("a feature theme.json no longer ships is dropped, so its files are never requested", () => {
    const dz = load();
    const t = dz.dzThemeFromCache(oldCache(), clone(SHIPPED));
    assert.equal("retired_feature" in t.features, false);
});

test("install metadata comes from the shipped theme.json", () => {
    const dz = load();
    const t = dz.dzThemeFromCache(oldCache(), clone(SHIPPED));
    assert.equal(t.version, SHIPPED.version);
});

test("runtime keys the cache carries beyond theme.json are kept", () => {
    const dz = load();
    const t = dz.dzThemeFromCache(oldCache(), clone(SHIPPED));
    assert.equal(t.usercustomsvariable, 12);
});

test("a cache from before the notification split migrates into both warning toggles", () => {
    const dz = load();
    for (const was of [true, false]) {
        const c = oldCache();
        delete c.features.warn_timeout;
        delete c.features.warn_battery;
        c.features.notification = { id: 41, enabled: was, files: [] };
        const t = dz.dzThemeFromCache(c, clone(SHIPPED));
        assert.equal(t.features.warn_timeout.enabled, was, "warn_timeout from notification=" + was);
        assert.equal(t.features.warn_battery.enabled, was, "warn_battery from notification=" + was);
        assert.equal("notification" in t.features, false);
    }
});

test("offline: with no shipped theme.json, every manifest toggle missing from the cache is seeded off", () => {
    const dz = load();
    const c = oldCache();
    const t = dz.dzThemeFromCache(c, null);
    assert.equal(t.features.diagnostic_logging.enabled, false);
    assert.deepEqual(Array.from(t.features.diagnostic_logging.files), []);
    assert.equal(t.button_name, "My House");
});

test("dzMigrateSnapshot: a v1 row with the old notification key splits it", () => {
    const dz = load();
    const row = { schemaVersion: 1, features: { notification: false, standby: true }, values: {} };
    const out = dz.dzMigrateSnapshot(row);
    assert.equal(out.features.warn_timeout, false);
    assert.equal(out.features.warn_battery, false);
    assert.equal("notification" in out.features, false);
    assert.equal(out.schemaVersion, dz.DZ_SETTINGS_SCHEMA_VERSION);
});

test("dzMigrateSnapshot: a row with no version is treated as the first version", () => {
    const dz = load();
    const out = dz.dzMigrateSnapshot({ features: { notification: true }, values: {} });
    assert.equal(out.features.warn_timeout, true);
});

test("dzMigrateSnapshot: keys a user already set individually are never overwritten", () => {
    const dz = load();
    const out = dz.dzMigrateSnapshot({ schemaVersion: 1, features: { notification: true, warn_timeout: false }, values: {} });
    assert.equal(out.features.warn_timeout, false);
    assert.equal(out.features.warn_battery, true);
});

test("dzMigrateSnapshot: a current row passes through unchanged", () => {
    const dz = load();
    const row = { schemaVersion: dz.DZ_SETTINGS_SCHEMA_VERSION, features: { warn_timeout: true }, values: { button_name: "x" } };
    const before = JSON.stringify(row);
    assert.equal(JSON.stringify(dz.dzMigrateSnapshot(row)), before);
});

/* Layer merge: later non-null layers win per key, and the result never aliases
   an input's nested values. Characterisation of today's contract. */
test("dzMergeSettingsLayers: a later layer wins per key, null layers are skipped", () => {
    const dz = load();
    const out = dz.dzMergeSettingsLayers(
        { features: { a: true, b: true }, values: { x: 1, y: 1 } },
        { features: { b: false }, values: { y: 2, icons: [{ idx: 1 }] } },
        null);
    assert.deepEqual(clone(out.features), { a: true, b: false });
    assert.equal(out.values.x, 1);
    assert.equal(out.values.y, 2);
});

test("dzMergeSettingsLayers: the merged result does not share nested values with an input", () => {
    const dz = load();
    const stored = { features: {}, values: { icons: [{ idx: 1 }] } };
    const out = dz.dzMergeSettingsLayers({ features: {}, values: {} }, stored, null);
    out.values.icons[0].idx = 99;
    assert.equal(stored.values.icons[0].idx, 1);
});

/* Conflict merge: what THIS session changed (intended vs base) lands on top of
   what the server holds now; everything else keeps the server's value. */
test("dzMergeConflict: only this session's changes override the fresh server row", () => {
    const dz = load();
    const base = { schemaVersion: 2, features: { a: true, b: true }, values: { x: 1, y: 1 } };
    const intended = { schemaVersion: 2, features: { a: false, b: true }, values: { x: 1, y: 5 } };
    const fresh = { schemaVersion: 2, features: { a: true, b: false }, values: { x: 7, y: 1 } };
    const out = dz.dzMergeConflict(base, intended, fresh);
    assert.deepEqual(clone(out.features), { a: false, b: false }, "a changed here wins; b changed elsewhere is kept");
    assert.deepEqual(clone(out.values), { x: 7, y: 5, scheme_mode: "light" },
        "the unversioned fresh row is lifted through the ladder, which seeds the mode");
});

test("dzMergeConflict: a fresh row in an older shape is migrated before the merge", () => {
    const dz = load();
    const base = { schemaVersion: 2, features: { warn_timeout: true, warn_battery: true }, values: {} };
    const intended = { schemaVersion: 2, features: { warn_timeout: true, warn_battery: true }, values: { button_name: "x" } };
    const fresh = { schemaVersion: 1, features: { notification: false }, values: {} };
    const out = dz.dzMergeConflict(base, intended, fresh);
    assert.equal("notification" in out.features, false, "a v1 key must not ride into a row stamped v2");
    assert.equal(out.features.warn_timeout, false);
    assert.equal(out.values.button_name, "x");
});

/* theme.scheme_mode through the warm-boot rebuild. */
test("scheme_mode: a cache that predates it ends in the mode its base implies, not the shipped auto", () => {
    const dz = load();
    const cache = oldCache();
    delete cache.scheme_mode;
    cache.scheme = "nord"; cache.scheme_base = "dark";
    assert.equal(dz.dzThemeFromCache(cache, clone(SHIPPED)).scheme_mode, "dark");
});

test("scheme_mode: a cache that already carries it is not re-derived", () => {
    const dz = load();
    const cache = oldCache();
    cache.scheme_base = "dark"; cache.scheme_mode = "auto";
    assert.equal(dz.dzThemeFromCache(cache, clone(SHIPPED)).scheme_mode, "auto");
});

test("scheme_mode: the shipped theme.json alone gives a fresh install auto", () => {
    assert.equal(SHIPPED.scheme_mode, "auto");
});

test("scheme_mode: themes differing only in the mode have different fingerprints", () => {
    const dz = load();
    const a = clone(SHIPPED), b = clone(SHIPPED);
    a.scheme_mode = "light"; b.scheme_mode = "dark";
    assert.notEqual(dz.themeSettingsFingerprint(a), dz.themeSettingsFingerprint(b));
});

/* ---- Settings that belong to an account ----

   A page boots with the settings cache, the paint record and the light/dark
   override of ONE account. These run the shipping settings files with a
   storage map, and a fetch that answers getauth, theme.json and the native
   ThemeSettings API the way core does. */
function accountPage({ account, auth, rows = {}, store = new Map() } = {}) {
    const calls = { paints: [], posts: [] };
    const ctx = vm.createContext({
        console: { log() {}, warn() {} }, JSON, Math, Promise, URLSearchParams, setTimeout, clearTimeout,
        theme: {}, themeFolder: "machinon", themeName: "Machinon",
        window: { my_config: { userrights: 1, username: "user" } },
        localStorage: {
            getItem: (k) => (store.has(k) ? store.get(k) : null),
            setItem: (k, v) => { store.set(k, String(v)); },
            removeItem: (k) => { store.delete(k); }
        },
        $: { each: (c, fn) => Object.keys(c).forEach((k) => fn(k, c[k])) },
        document: { getElementById: () => null },
        fetch: async (url, opts) => {
            if (/param=getauth/.test(url)) return { json: async () => auth };
            if (/param=getversion/.test(url)) return { json: async () => ({ ThemeSettingsAPI: 1, version: "2026.4" }) };
            if (/theme\.json$/.test(url)) return { json: async () => clone(SHIPPED) };
            if (/param=themesettings_get/.test(url)) {
                return { json: async () => ({ status: "OK", PerUser: true,
                    instance: rows.instance ? { present: true, value: clone(rows.instance), lastupdate: "i1" } : { present: false },
                    user: rows.user ? { present: true, value: clone(rows.user), lastupdate: "u1" } : { present: false } }) };
            }
            if (opts && opts.method === "POST") calls.posts.push(opts.body.get("param"));
            return { json: async () => ({ status: "OK" }) };
        }
    });
    ctx.window.window = ctx.window;
    for (const f of ["src/js/theme-manifest.js", "src/js/settings-transport.js", "src/js/settings-store.js"]) {
        vm.runInContext(readFileSync(f, "utf8"), ctx, { filename: f });
    }
    for (const name of ["applyCardWidths", "setLogo", "dzApplyCustomPageLabel", "applyBackground",
                        "applyNavbarIconsText", "dzSyncModeToggles", "dzDiagRefreshGate",
                        "loadThemeFeatureFiles", "unloadThemeFeatureFiles"]) {
        ctx[name] = () => {};
    }
    ctx.dzApplyColorMode = (force) => { calls.paints.push({ force, scheme: ctx.theme.scheme }); return Promise.resolve(); };
    ctx.dzAccount = account;
    return { ctx, store, calls };
}

/* An account's settings as the browser cached them: a private wizard theme
   and a scheme picked from it, both user-scope. */
function cachedFor(name) {
    const t = clone(SHIPPED);
    t.scheme = "user:" + name + " Sunset|dark";
    t.scheme_base = "dark";
    t.scheme_mode = "dark";
    t.user_schemes = [{ name: name + " Sunset", pair: "p-" + name, variant: "dark", base: "dark", colors: { background: "#110000" } }];
    t.card_min_width = 410;
    return t;
}

test("account: the settings cache is kept per account, the shared identity keeps its 2.10.0 key", () => {
    const { ctx, store } = accountPage({ account: "u:user" });
    ctx.theme = { marker: "user" };
    ctx.cacheThemeSettings();
    assert.equal(store.get("machinon.themeSettings@user"), JSON.stringify({ marker: "user" }));
    assert.equal(store.has("machinon.themeSettings"), false);
    assert.deepEqual(clone(ctx.readCachedThemeSettings()), { marker: "user" });
    ctx.dzAccount = "*";
    assert.equal(ctx.readCachedThemeSettings(), null, "another account's cache is never read");
    ctx.theme = { marker: "shared" };
    ctx.cacheThemeSettings();
    assert.equal(store.get("machinon.themeSettings"), JSON.stringify({ marker: "shared" }));
});

test("account: nobody logged in, or an account not known yet, reads and writes no cache", () => {
    for (const account of [null, undefined]) {
        const store = new Map([["machinon.themeSettings", "{\"marker\":\"shared\"}"], ["machinon.themeSettings@admin", "{}"]]);
        const { ctx } = accountPage({ account, store });
        assert.equal(ctx.readCachedThemeSettings(), null);
        ctx.theme = { marker: "x" };
        ctx.cacheThemeSettings();
        assert.equal(store.size, 2, "nothing written for " + account);
    }
});

test("account: an in-page login as another account loads that account's settings, not the old ones", async () => {
    const store = new Map([["machinon.themeSettings@admin", JSON.stringify(cachedFor("admin"))]]);
    const { ctx, calls } = accountPage({
        account: "u:admin", store, auth: { status: "OK", user: "user", rights: 1, canlogout: true },
        rows: { user: { schemaVersion: 3, features: { fade_off_items: true }, values: { scheme: "gruvbox-light", scheme_base: "light", scheme_mode: "light" } } }
    });
    ctx.theme = cachedFor("admin");
    await ctx.dzAccountMaybeChanged();
    assert.equal(ctx.dzAccount, "u:user");
    assert.equal(store.get("dzPaintAccount"), "u:user");
    assert.equal(ctx.theme.scheme, "gruvbox-light");
    assert.equal(ctx.theme.scheme_mode, "light");
    assert.equal(ctx.theme.features.fade_off_items.enabled, true);
    assert.equal(ctx.theme.user_schemes, undefined, "admin's private themes do not reach user");
    assert.equal(ctx.theme.card_min_width, SHIPPED.card_min_width, "admin's cached values do not reach user");
    assert.equal(JSON.parse(store.get("machinon.themeSettings@user")).scheme, "gruvbox-light");
    assert.deepEqual(JSON.parse(store.get("machinon.themeSettings@admin")), cachedFor("admin"), "admin's cache is left alone");
    assert.equal(calls.paints.length, 1);
    assert.equal(calls.paints[0].force, true, "the new account's colours are painted");
    assert.deepEqual(calls.posts, [], "loading another account's settings writes nothing");
});

test("account: an account with no row of its own starts from the shipped defaults, so a save cannot copy another account's values", async () => {
    const { ctx } = accountPage({ account: "u:admin", auth: { status: "OK", user: "viewer", rights: 0, canlogout: true } });
    ctx.theme = cachedFor("admin");
    await ctx.dzAccountMaybeChanged();
    const snap = ctx.dzSnapshotSubset(ctx.dzSettingsSnapshot(ctx.theme), "user");
    const fresh = ctx.dzSnapshotSubset(ctx.dzSettingsSnapshot(clone(SHIPPED)), "user");
    assert.deepEqual(clone(snap), clone(fresh));
});

test("account: the same account answering again changes nothing", async () => {
    const { ctx, calls } = accountPage({ account: "u:user", auth: { status: "OK", user: "user", rights: 1, canlogout: true } });
    ctx.theme = cachedFor("user");
    await ctx.dzAccountMaybeChanged();
    assert.deepEqual(clone(ctx.theme), cachedFor("user"));
    assert.equal(calls.paints.length, 0);
});

test("account: logging out keeps the page as it is and forgets whose browser this was", async () => {
    const store = new Map([["dzPaintAccount", "u:admin"]]);
    const { ctx, calls } = accountPage({ account: "u:admin", store, auth: { status: "OK", canlogout: true } });
    ctx.theme = cachedFor("admin");
    await ctx.dzAccountMaybeChanged();
    assert.equal(ctx.dzAccount, null);
    assert.equal(store.has("dzPaintAccount"), false);
    assert.equal(ctx.theme.scheme, cachedFor("admin").scheme);
    assert.equal(calls.paints.length, 0);
});

test("account: a boot on the shared identity that turns out to be a named login rebuilds before merging", async () => {
    const store = new Map([["dzPaintAccount", "*"], ["machinon.themeSettings", JSON.stringify(cachedFor("shared"))]]);
    const { ctx, calls } = accountPage({ account: "*", store, auth: { status: "OK", user: "user", rights: 1, canlogout: true } });
    ctx.theme = cachedFor("shared");
    await ctx.reconcileDomoticzSettingsInPlace();
    assert.equal(ctx.dzAccount, "u:user");
    assert.equal(store.get("dzPaintAccount"), "u:user");
    assert.equal(ctx.theme.user_schemes, undefined);
    assert.equal(calls.paints.length, 1);
    assert.equal(calls.paints[0].force, true);
});

test("account: a boot the early block already confirmed keeps its cache and records the account", async () => {
    const store = new Map();
    const { ctx, calls } = accountPage({ account: "u:user", store, auth: { status: "OK", user: "user", rights: 1, canlogout: true },
                                         rows: { user: { schemaVersion: 3, features: {}, values: { scheme: "user:user Sunset|dark" } } } });
    ctx.theme = cachedFor("user");
    await ctx.reconcileDomoticzSettingsInPlace();
    assert.equal(ctx.dzAccount, "u:user");
    assert.equal(store.get("dzPaintAccount"), "u:user");
    assert.deepEqual(clone(ctx.theme.user_schemes), cachedFor("user").user_schemes);
    assert.equal(ctx.theme.card_min_width, 410);
});

/* ---- Writes across an account change, with real timing ----

   A page of alice (admin) while bob has logged in elsewhere on the browser.
   getauth answers after authMs, theme.json after jsonMs, themesettings_get
   after getMs: the order the race between the refusal, the account change
   and the next queued write depends on. Nothing is stubbed between the write
   guard and the account change. */
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
function stalePage(opts = {}) {
    const { authMs = 20, jsonMs = 1, getMs = 30, auth = { status: "OK", user: "bob", rights: 2, canlogout: true },
            authFails = false, store = new Map() } = opts;
    /* "account" in opts, not a default: an explicit undefined (no account
       known) must stay undefined. */
    const account = "account" in opts ? opts.account : "u:alice";
    const posts = [];
    const toasts = [];
    const calls = { auth: 0 };
    const ctx = vm.createContext({
        console: { log() {}, warn() {} }, JSON, Math, Promise, URLSearchParams, setTimeout, clearTimeout,
        theme: {}, themeFolder: "machinon", themeName: "Machinon",
        window: { my_config: { userrights: 2, username: "alice" } },
        localStorage: {
            getItem: (k) => (store.has(k) ? store.get(k) : null),
            setItem: (k, v) => { store.set(k, String(v)); },
            removeItem: (k) => { store.delete(k); }
        },
        $: { each: (c, fn) => Object.keys(c).forEach((k) => fn(k, c[k])) },
        document: { getElementById: () => null },
        ShowNotify: (text) => { toasts.push(text); },
        dzT: (k) => k,
        fetch: async (url, opts) => {
            if (/param=getauth/.test(url)) {
                calls.auth++;
                await wait(authMs);
                if (authFails) throw new Error("blip");
                return { json: async () => auth };
            }
            if (/param=getversion/.test(url)) return { json: async () => ({ ThemeSettingsAPI: 1 }) };
            if (/theme\.json$/.test(url)) { await wait(jsonMs); return { json: async () => clone(SHIPPED) }; }
            if (/param=themesettings_get/.test(url)) {
                await wait(getMs);
                return { json: async () => ({ status: "OK", PerUser: true,
                    instance: { present: true, value: { schemaVersion: 3, features: {}, values: { button_name: "Bob House" } }, lastupdate: "i1" },
                    user: { present: true, value: { schemaVersion: 3, features: {}, values: { scheme: "gruvbox-light", scheme_base: "light", scheme_mode: "light" } }, lastupdate: "u1" } }) };
            }
            if (opts && opts.method === "POST") {
                const b = opts.body;
                posts.push({ param: b.get("param"), reset: b.get("reset"), value: b.get("value") });
                return { json: async () => ({ status: "OK", lastupdate: "new" }) };
            }
            return { json: async () => ({ status: "OK" }) };
        }
    });
    ctx.window.window = ctx.window;
    for (const f of ["src/js/theme-manifest.js", "src/js/settings-transport.js", "src/js/settings-store.js"]) {
        vm.runInContext(readFileSync(f, "utf8"), ctx, { filename: f });
    }
    for (const name of ["applyCardWidths", "setLogo", "dzApplyCustomPageLabel", "applyBackground",
                        "applyNavbarIconsText", "dzSyncModeToggles", "dzDiagRefreshGate",
                        "loadThemeFeatureFiles", "unloadThemeFeatureFiles"]) {
        ctx[name] = () => {};
    }
    ctx.dzApplyColorMode = () => Promise.resolve();
    vm.runInContext('dzAccount = ' + JSON.stringify(account) + '; dzApiState.capable = true; dzApiState.perUser = true;' +
                    'dzApiState.tokens = { instance: "iA", user: "uA" };' +
                    'dzApiState.instanceSnap = { schemaVersion: 3, features: {}, values: { button_name: "Alice House" } };' +
                    'dzApiState.userSnap = { schemaVersion: 3, features: {}, values: {} };', ctx);
    ctx.theme = clone(SHIPPED);
    ctx.theme.button_name = "Alice House";
    ctx.theme.user_schemes = [{ name: "Alice Private", pair: "p", variant: "dark", base: "dark", colors: {} }];
    return { ctx, posts, toasts, calls, store };
}

for (const [label, authMs, jsonMs] of [["theme.json answers first", 20, 1], ["getauth answers first", 1, 20]]) {
    test(`account race (${label}): a reset of both layers in a stale tab deletes no row of the new account`, async () => {
        const p = stalePage({ authMs, jsonMs });
        const res = await vm.runInContext("Promise.all([dzApiResetHouse(), dzApiResetUser()])", p.ctx);
        await wait(150);
        assert.deepEqual(p.posts, [], "nothing reached bob's rows or the house");
        assert.deepEqual(clone(res).map((r) => r.ok), [false, false]);
        assert.equal(p.ctx.dzAccount, "u:bob");
    });

    test(`account race (${label}): an admin save in a stale tab writes neither layer`, async () => {
        const p = stalePage({ authMs, jsonMs });
        p.ctx.theme.button_name = "Alice edit";
        const res = await vm.runInContext("dzApiSaveSettings()", p.ctx);
        await wait(150);
        assert.deepEqual(p.posts, []);
        assert.equal(res.ok, false);
    });
}

test("account race: refused, then the account changes, then the next save goes to the new account with its own values", async () => {
    const p = stalePage({ authMs: 5, jsonMs: 1 });
    const first = await vm.runInContext("dzApiSaveSettings()", p.ctx);
    assert.equal(first.ok, false);
    await wait(150);
    assert.equal(p.ctx.dzAccount, "u:bob");
    assert.equal(p.ctx.theme.scheme, "gruvbox-light", "bob's own row is loaded");
    assert.equal(p.ctx.theme.button_name, "Bob House");
    p.ctx.theme.features.fade_off_items.enabled = true;
    const second = await vm.runInContext("dzApiSaveSettings()", p.ctx);
    assert.equal(second.ok, true);
    const user = p.posts.filter((x) => x.param === "themesettings_set");
    assert.equal(user.length, 1);
    const row = JSON.parse(user[0].value);
    assert.equal(row.values.scheme, "gruvbox-light");
    assert.equal(row.values.user_schemes, undefined, "alice's private themes are not in bob's row");
    assert.equal(row.features.fade_off_items, true);
});

test("account race: a save asked for while the new account's settings load is refused", async () => {
    const p = stalePage({ authMs: 1, jsonMs: 1, getMs: 80 });
    vm.runInContext("dzAccountMaybeChanged()", p.ctx);
    await wait(30);
    assert.equal(p.ctx.dzAccount, "u:bob", "the change has started");
    const res = await vm.runInContext("dzApiSaveSettings()", p.ctx);
    assert.equal(res.ok, false);
    assert.deepEqual(p.posts, [], "shipped defaults are never written while bob's rows load");
});

test("account race: a refused write tells the user why", async () => {
    const p = stalePage({ authMs: 1 });
    await vm.runInContext("dzApiSaveSettings()", p.ctx);
    assert.ok(p.toasts.indexOf("toasts.save_refused_account") !== -1, JSON.stringify(p.toasts));
    const out = stalePage({ authMs: 1, auth: { status: "OK", canlogout: true } });
    await vm.runInContext("dzApiSaveSettings()", out.ctx);
    assert.ok(out.toasts.indexOf("toasts.save_refused_logged_out") !== -1, JSON.stringify(out.toasts));
    assert.deepEqual(out.posts, []);
});

test("account unknown at boot: no cache is the base, none is written, and getauth is asked a bounded number of times", async () => {
    const store = new Map([["machinon.themeSettings@alice", "{\"marker\":\"alice\"}"], ["dzPaintAccount", "u:alice"]]);
    const p = stalePage({ authMs: 1, authFails: true, store });
    await p.ctx.reconcileDomoticzSettingsInPlace();
    assert.equal(p.ctx.dzAccount, undefined);
    assert.equal(p.ctx.theme.user_schemes, undefined, "alice's private themes are not shown to the session");
    assert.equal(p.ctx.theme.scheme, "gruvbox-light", "the session's own rows are applied");
    assert.equal(store.get("machinon.themeSettings@alice"), "{\"marker\":\"alice\"}", "alice's cache is untouched");
    assert.deepEqual([...store.keys()].filter((k) => /themeSettings/.test(k)), ["machinon.themeSettings@alice"]);
    assert.ok(p.calls.auth >= 2 && p.calls.auth <= 4, "asked " + p.calls.auth + " times");
    const res = await vm.runInContext("dzApiSaveSettings()", p.ctx);
    assert.equal(res.ok, false);
    assert.deepEqual(p.posts, []);
});

test("account: a getauth that never answers gives up, so the boot and the write chain go on", async () => {
    const p = stalePage({ authMs: 1500 });
    p.ctx.DZ_ACCOUNT_TIMEOUT_MS = 30;
    const started = Date.now();
    assert.equal(await p.ctx.dzFetchAccount(), undefined);
    assert.ok(Date.now() - started < 1000);
});

test("account: the same login with other rights rebuilds the Theme Hub", async () => {
    const p = stalePage({ authMs: 1, account: "u:bob", auth: { status: "OK", user: "bob", rights: 1, canlogout: true } });
    p.ctx.dzAccountRights = 2;
    let discarded = 0;
    p.ctx.dzHubDiscard = () => { discarded++; };
    await p.ctx.dzAccountMaybeChanged();
    assert.equal(discarded, 1);
    assert.equal(p.ctx.dzAccountRights, 1);
});

test("account: 2.10.0's unkeyed keys are dropped once a named login is confirmed, and kept for the shared identity", async () => {
    const legacy = () => new Map([["machinon.themeSettings", "{}"], ["dzPaintRecord", "{}"], ["machinon.colorOverride", "{}"]]);
    const named = stalePage({ authMs: 1, account: undefined, auth: { status: "OK", user: "bob", rights: 1, canlogout: true }, store: legacy() });
    await named.ctx.reconcileDomoticzSettingsInPlace();
    assert.deepEqual([...named.store.keys()].filter((k) => !/@|dzPaintAccount/.test(k)), []);
    const shared = stalePage({ authMs: 1, account: "*", auth: { status: "OK", user: "admin", rights: 2, canlogout: false }, store: legacy() });
    shared.store.set("dzPaintAccount", "*");
    await shared.ctx.reconcileDomoticzSettingsInPlace();
    assert.ok(shared.store.has("dzPaintRecord") && shared.store.has("machinon.colorOverride"));
});

test("account: a boot that read no cache takes core's account in place, without a rebuild or a load window", async () => {
    const p = stalePage({ authMs: 5, account: undefined, auth: { status: "OK", user: "admin", rights: 2, canlogout: false } });
    p.ctx.theme = clone(SHIPPED);
    p.ctx.theme.marker = "booted from theme.json";
    let loadingSeen = false;
    const timer = setInterval(() => { if (p.ctx.dzAccountLoading) loadingSeen = true; }, 1);
    await p.ctx.reconcileDomoticzSettingsInPlace();
    clearInterval(timer);
    assert.equal(p.ctx.dzAccount, "*");
    assert.equal(p.ctx.theme.marker, "booted from theme.json", "not rebuilt");
    assert.equal(loadingSeen, false, "writes were never held");
    assert.ok(p.store.has("machinon.themeSettings"), "the shared identity's cache is written");
});

test("account: a write waits for a slow getauth longer than the boot does, instead of failing", async () => {
    const p = stalePage({ authMs: 120, account: "u:bob", auth: { status: "OK", user: "bob", rights: 2, canlogout: true } });
    p.ctx.DZ_ACCOUNT_TIMEOUT_MS = 30;
    const res = await vm.runInContext("dzApiResetUser()", p.ctx);
    assert.equal(res.ok, true);
    assert.deepEqual(p.posts.map((x) => x.param), ["themesettings_set"]);
});

/* ---- A busy core (getauth slower than the boot's first try) ---- */
function busyPage(opts) {
    const p = stalePage(opts);
    p.aborts = 0;
    const fetch0 = p.ctx.fetch;
    p.ctx.fetch = (url, o) => {
        if (/param=getauth/.test(url) && o && o.signal) {
            o.signal.addEventListener("abort", () => { p.aborts++; });
        }
        return fetch0(url, o);
    };
    p.ctx.AbortController = AbortController;
    return p;
}

test("busy core: the boot waits for a slow getauth instead of giving up on the account", async () => {
    const store = new Map([["machinon.themeSettings@alice", JSON.stringify(cachedFor("alice"))]]);
    const p = busyPage({ authMs: 120, account: "u:alice", store, auth: { status: "OK", user: "alice", rights: 1, canlogout: true } });
    p.ctx.DZ_ACCOUNT_TIMEOUT_MS = 30;
    p.ctx.DZ_ACCOUNT_PATIENT_MS = 1000;
    p.ctx.theme = cachedFor("alice");
    await p.ctx.reconcileDomoticzSettingsInPlace();
    assert.equal(p.ctx.dzAccount, "u:alice");
    assert.equal(p.calls.auth, 1, "one request, no stacked retries");
    assert.deepEqual(clone(p.ctx.theme.user_schemes), cachedFor("alice").user_schemes, "alice's own cache stays");
});

test("busy core: a getauth that times out is not retried and its request is cancelled", async () => {
    const p = busyPage({ authMs: 400, account: "u:alice", auth: { status: "OK", user: "alice", rights: 1, canlogout: true } });
    p.ctx.DZ_ACCOUNT_PATIENT_MS = 60;
    await p.ctx.reconcileDomoticzSettingsInPlace();
    assert.equal(p.calls.auth, 1);
    assert.equal(p.aborts, 1);
    assert.equal(p.ctx.dzAccount, undefined);
});

test("busy core: a save from a page with no account yet takes core's account in place and is kept", async () => {
    const p = busyPage({ authMs: 1, authFails: true, account: "u:alice", auth: { status: "OK", user: "alice", rights: 1, canlogout: true } });
    await p.ctx.reconcileDomoticzSettingsInPlace();
    assert.equal(p.ctx.dzAccount, undefined, "boot could not name the account");
    const fetch1 = p.ctx.fetch;
    p.ctx.fetch = async (url, o) => {
        if (/param=getauth/.test(url)) { await wait(80); return { json: async () => ({ status: "OK", user: "alice", rights: 1, canlogout: true }) }; }
        return fetch1(url, o);
    };
    p.ctx.DZ_ACCOUNT_TIMEOUT_MS = 30;
    p.ctx.theme.features.fade_off_items.enabled = true;
    const res = await vm.runInContext("dzApiSaveSettings()", p.ctx);
    assert.equal(res.ok, true, JSON.stringify(res));
    assert.equal(p.ctx.dzAccount, "u:alice");
    assert.deepEqual(p.toasts, [], "no refusal");
    const user = p.posts.filter((x) => x.param === "themesettings_set");
    assert.equal(user.length, 1);
    assert.equal(JSON.parse(user[0].value).features.fade_off_items, true);
});

test("account: a getauth answer after its own timeout changes nothing", async () => {
    const p = busyPage({ authMs: 120, auth: { status: "OK", user: "bob", rights: 1, canlogout: true } });
    p.ctx.AbortController = undefined;
    vm.runInContext("dzLastAuthRights = 2", p.ctx);
    assert.equal(await p.ctx.dzFetchAccount(30), undefined);
    await wait(200);
    assert.equal(p.ctx.dzLastAuthRights, 2);
});

test("account: a write asked before an in-page logout says the user is logged out", async () => {
    const p = stalePage({ authMs: 1, account: "u:alice" });
    const pending = vm.runInContext("dzApiResetUser()", p.ctx);
    vm.runInContext("dzAccount = null", p.ctx);
    const res = await pending;
    assert.equal(res.ok, false);
    assert.deepEqual(p.toasts, ["toasts.save_refused_logged_out"]);
});

test("account: on a browser that has used the shared identity, a named login keeps its unkeyed keys", async () => {
    const legacy = () => new Map([["machinon.themeSettings", "{}"], ["dzPaintRecord", "{}"], ["machinon.colorOverride", "{}"],
                                  ["dzPaintAccount", "u:admin"]]);
    const mixed = legacy();
    mixed.set("dzPaintShared", "1");
    const p = stalePage({ authMs: 1, account: "u:admin", store: mixed, auth: { status: "OK", user: "admin", rights: 2, canlogout: true } });
    await p.ctx.reconcileDomoticzSettingsInPlace();
    assert.ok(mixed.has("machinon.themeSettings") && mixed.has("dzPaintRecord") && mixed.has("machinon.colorOverride"));
    const old = legacy();
    const q = stalePage({ authMs: 1, account: "u:admin", store: old, auth: { status: "OK", user: "admin", rights: 2, canlogout: true } });
    await q.ctx.reconcileDomoticzSettingsInPlace();
    assert.equal(old.has("dzPaintRecord"), false, "never used as the shared identity: 2.10.0 leftovers");
    const shared = new Map();
    const r = stalePage({ authMs: 1, account: "*", store: shared, auth: { status: "OK", user: "admin", rights: 2, canlogout: false } });
    await r.ctx.reconcileDomoticzSettingsInPlace();
    assert.equal(shared.get("dzPaintShared"), "1", "a shared-identity boot marks the browser");
});
