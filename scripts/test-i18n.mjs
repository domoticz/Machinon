import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/* Same pattern as scripts/test-toast-policy.mjs: run the SHIPPING file in a vm
   context with no document, which also proves the module never touches the DOM
   at load time. dzT reads the global `language` at call time, so tests set
   ctx.language directly. */
function loadThemeGlobals(files) {
    const ctx = vm.createContext({ Math, console, JSON });
    for (const f of files) vm.runInContext(readFileSync(f, "utf8"), ctx, { filename: f });
    return ctx;
}

const ctx = loadThemeGlobals(["src/js/i18n.js"]);

test("dzDeepMerge overlays leaf values and keeps base keys the overlay lacks", () => {
    const base = { a: "A", nest: { x: "X", y: "Y" } };
    const overlay = { nest: { y: "Y2" }, extra: "E" };
    const out = ctx.dzDeepMerge(base, overlay);
    assert.equal(out.a, "A");
    assert.equal(out.nest.x, "X");       // per-key fallback: base survives
    assert.equal(out.nest.y, "Y2");      // overlay wins on shared leaves
    assert.equal(out.extra, "E");
    assert.equal(base.nest.y, "Y");      // base not mutated
});

test("dzDeepMerge does not merge arrays or null, overlay replaces them", () => {
    const out = ctx.dzDeepMerge({ a: [1], b: { c: 1 } }, { a: [2, 3], b: null });
    assert.deepEqual(out.a, [2, 3]);
    assert.equal(out.b, null);
});

test("dzT resolves a nested path from the language table", () => {
    ctx.language = { hub: { groups: { general: "General" } } };
    assert.equal(ctx.dzT("hub.groups.general"), "General");
});

test("dzT interpolates {param} tokens and stringifies values", () => {
    ctx.language = { toasts: { icons_installing: "Installing {n}/{total}: {name}" } };
    assert.equal(ctx.dzT("toasts.icons_installing", { n: 1, total: 3, name: "fan" }),
        "Installing 1/3: fan");
});

test("dzT leaves unknown {tokens} intact rather than injecting undefined", () => {
    ctx.language = { t: { k: "Hello {who}" } };
    assert.equal(ctx.dzT("t.k", { other: "x" }), "Hello {who}");
});

test("dzT on a missing path returns the last segment and does not throw", () => {
    ctx.language = { hub: {} };
    assert.equal(ctx.dzT("hub.settings.nope.label"), "label");
});

test("dzT on a path that resolves to a non-string returns the last segment", () => {
    ctx.language = { hub: { settings: {} } };
    assert.equal(ctx.dzT("hub.settings"), "settings");
});
