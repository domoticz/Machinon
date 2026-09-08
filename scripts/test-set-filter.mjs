import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

function loadThemeGlobals(files) {
    const ctx = vm.createContext({ Math, console, JSON });
    for (const f of files) vm.runInContext(readFileSync(f, "utf8"), ctx, { filename: f });
    return ctx;
}

const dz = loadThemeGlobals(["src/js/set-filter.js"]);

function fakeCard(idx, sceneAncestor) {
    let queries = 0;
    return {
        get queries() { return queries; },
        querySelector: sel => {
            queries++;
            return (sel === "[data-idx]" && idx != null)
                ? { getAttribute: () => String(idx) } : null;
        },
        closest: sel => (sceneAncestor && sel.indexOf(sceneAncestor) !== -1) ? {} : null
    };
}

test("device card keys as d:<idx>", () => {
    assert.equal(dz.dzSetCardKey(fakeCard(54, null)), "d:54");
});
test("Scenes-page card keys as s:<idx>", () => {
    assert.equal(dz.dzSetCardKey(fakeCard(3, "#scenecontent")), "s:3");
});
test("Dynamic Dashboard scene widget (.dd-widget--dz-scene ancestry) keys as s:<idx>", () => {
    assert.equal(dz.dzSetCardKey(fakeCard(3, ".dd-widget--dz-scene")), "s:3");
});
test("classic dashboard favourite scene (#dashScenes ancestry) keys as s:<idx>", () => {
    assert.equal(dz.dzSetCardKey(fakeCard(3, "#dashScenes")), "s:3");
});
test("card without data-idx keys as null (cameras hide under any set)", () => {
    assert.equal(dz.dzSetCardKey(fakeCard(null, null)), null);
});
test("key is computed once per element and cached (MERGED-2)", () => {
    const card = fakeCard(7, null);
    dz.dzSetCardKey(card);
    const after = card.queries;
    dz.dzSetCardKey(card);
    assert.equal(card.queries, after);
});
test("null key is cached too, not recomputed", () => {
    const card = fakeCard(null, null);
    dz.dzSetCardKey(card);
    const after = card.queries;
    dz.dzSetCardKey(card);
    assert.equal(card.queries, after);
});
