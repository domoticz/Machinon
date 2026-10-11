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
