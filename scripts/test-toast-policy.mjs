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
