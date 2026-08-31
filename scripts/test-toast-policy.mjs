import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/* Same pattern as scripts/test-color-oklch.mjs: src/js files are plain browser
   scripts declaring globals with var/function, so run the SHIPPING file in a vm
   context and read the globals back. The context has no `document`, which also
   proves the module does not touch the DOM at load time. */
function loadThemeGlobals(files) {
    const ctx = vm.createContext({ Math, console, JSON });
    for (const f of files) vm.runInContext(readFileSync(f, "utf8"), ctx, { filename: f });
    return ctx;
}

const dz = loadThemeGlobals(["src/js/toasts.js"]);

test("a key warns once, then is suppressed until it is cleared", () => {
    const s = dz.dzToastCreateState();
    assert.equal(dz.dzToastShouldSuppress(s, "timeout:42"), false);
    dz.dzToastMarkSeen(s, "timeout:42");
    assert.equal(dz.dzToastShouldSuppress(s, "timeout:42"), true);
    // A different device is unaffected.
    assert.equal(dz.dzToastShouldSuppress(s, "timeout:43"), false);
    // Re-arms only when the condition actually cleared.
    dz.dzToastClearKey(s, "timeout:42");
    assert.equal(dz.dzToastShouldSuppress(s, "timeout:42"), false);
});

test("a null key is never suppressed", () => {
    // Core toasts carry no device identity; they must never be deduped away.
    const s = dz.dzToastCreateState();
    assert.equal(dz.dzToastShouldSuppress(s, null), false);
    dz.dzToastMarkSeen(s, null);
    assert.equal(dz.dzToastShouldSuppress(s, null), false);
});

test("the group summary names up to three devices then counts the rest", () => {
    assert.equal(dz.dzToastSummary(["Hall"], 1), "Hall");
    assert.equal(dz.dzToastSummary(["Hall", "Garage"], 2), "Hall, Garage");
    assert.equal(dz.dzToastSummary(["Hall", "Garage", "Attic"], 3), "Hall, Garage, Attic");
    assert.equal(dz.dzToastSummary(["Hall", "Garage", "Attic"], 7),
                 "Hall, Garage, Attic and 4 more");
});

test("a grouped deadline extends once to the cap and never past it", () => {
    // The trap this guards: a deadline reset per arrival starves under exactly
    // the storm it exists to handle. Extension is one-way and capped.
    assert.equal(dz.dzToastDeadline(dz.DZ_TOAST_BASE_MS, false), 4000);
    assert.equal(dz.dzToastDeadline(dz.DZ_TOAST_BASE_MS, true), 8000);
    // A caller asking for longer than the cap keeps its own longer deadline:
    // the cap raises short toasts, it does not shorten deliberate ones.
    assert.equal(dz.dzToastDeadline(20000, true), 20000);
    // Sticky stays sticky.
    assert.equal(dz.dzToastDeadline(false, true), false);
});

test("the log is bounded and evicts oldest first", () => {
    const s = dz.dzToastCreateState();
    for (let i = 0; i < dz.DZ_TOAST_LOG_MAX + 10; i++) {
        dz.dzToastPushLog(s, { title: "t" + i, type: "info" });
    }
    assert.equal(s.log.length, dz.DZ_TOAST_LOG_MAX);
    assert.equal(s.log[0].title, "t10");
    assert.equal(s.log[s.log.length - 1].title, "t" + (dz.DZ_TOAST_LOG_MAX + 9));
});

/* ---- Persisted warn-repeat policy (theme.warn_repeat) ---- */

/* A plain in-memory map behind the { get, set, remove, keys } interface
   dzWarnRepeatAllows/dzWarnRecord/dzWarnPrune expect. */
function makeMemoryStore() {
    const m = new Map();
    return {
        get(key) { return m.has(key) ? m.get(key) : undefined; },
        set(key, value) { m.set(key, value); },
        remove(key) { m.delete(key); },
        keys() { return Array.from(m.keys()); }
    };
}

/* Every method throws, simulating localStorage in a private window or with
   storage disabled/full. */
function makeThrowingStore() {
    const boom = () => { throw new Error("storage unavailable"); };
    return { get: boom, set: boom, remove: boom, keys: boom };
}

test("visit never consults the store", () => {
    // A throwing store alone is not proof: a caught exception could still
    // happen to return the right answer. Count calls directly instead.
    let calls = 0;
    const store = makeThrowingStore();
    const counting = {
        get(...a) { calls++; return store.get(...a); },
        set(...a) { calls++; return store.set(...a); },
        remove(...a) { calls++; return store.remove(...a); },
        keys(...a) { calls++; return store.keys(...a); }
    };
    assert.equal(dz.dzWarnRepeatAllows(counting, "timeout:1", "visit", 0), true);
    dz.dzWarnRecord(counting, "timeout:1", "visit", 0);
    assert.equal(calls, 0, "visit mode must never call any store method");
});

test("daily suppresses at now + 23h59m and allows at now + 24h01m", () => {
    const store = makeMemoryStore();
    const t0 = 1000000;
    dz.dzWarnRecord(store, "timeout:1", "daily", t0);
    const almostADay = t0 + (23 * 60 + 59) * 60 * 1000;
    const justOverADay = t0 + (24 * 60 + 1) * 60 * 1000;
    assert.equal(dz.dzWarnRepeatAllows(store, "timeout:1", "daily", almostADay), false);
    assert.equal(dz.dzWarnRepeatAllows(store, "timeout:1", "daily", justOverADay), true);
});

test("episode suppresses indefinitely and allows only after the key is cleared", () => {
    const store = makeMemoryStore();
    const t0 = 1000000;
    dz.dzWarnRecord(store, "battery:2", "episode", t0);
    // Far beyond a day, still suppressed: episode mode never times out on its own.
    const muchLater = t0 + 365 * 24 * 60 * 60 * 1000;
    assert.equal(dz.dzWarnRepeatAllows(store, "battery:2", "episode", muchLater), false);
    store.remove("battery:2"); // the condition cleared, then re-triggered
    assert.equal(dz.dzWarnRepeatAllows(store, "battery:2", "episode", muchLater), true);
});

test("a cleared key allows immediately in daily, i.e. clearing beats the timer", () => {
    const store = makeMemoryStore();
    const t0 = 1000000;
    dz.dzWarnRecord(store, "timeout:3", "daily", t0);
    const oneHourLater = t0 + 60 * 60 * 1000; // well inside the 24h window
    assert.equal(dz.dzWarnRepeatAllows(store, "timeout:3", "daily", oneHourLater), false);
    store.remove("timeout:3"); // condition cleared and re-triggered
    assert.equal(dz.dzWarnRepeatAllows(store, "timeout:3", "daily", oneHourLater), true);
});

test("dzWarnPrune drops entries older than 30 days and keeps newer ones", () => {
    const store = makeMemoryStore();
    const now = 40 * 24 * 60 * 60 * 1000;
    store.set("timeout:old", now - (31 * 24 * 60 * 60 * 1000));
    store.set("timeout:new", now - (1 * 24 * 60 * 60 * 1000));
    dz.dzWarnPrune(store, now);
    assert.equal(store.get("timeout:old"), undefined);
    assert.equal(store.get("timeout:new"), now - (1 * 24 * 60 * 60 * 1000));
});

test("a throwing storage object degrades to visit behaviour rather than suppressing everything", () => {
    const store = makeThrowingStore();
    // The dangerous failure mode is suppressing a warning nobody ever saw;
    // the safe one is warning too often. Must be true (allowed), not false.
    assert.equal(dz.dzWarnRepeatAllows(store, "timeout:9", "daily", 1000000), true);
    assert.equal(dz.dzWarnRepeatAllows(store, "battery:9", "episode", 1000000), true);
    // Recording must not throw out through the caller either.
    assert.doesNotThrow(() => dz.dzWarnRecord(store, "timeout:9", "daily", 1000000));
    assert.doesNotThrow(() => dz.dzWarnPrune(store, 1000000));
});
