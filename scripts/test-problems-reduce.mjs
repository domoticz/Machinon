import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

function loadThemeGlobals(files) {
    const ctx = vm.createContext({ Math, console, JSON });
    for (const f of files) vm.runInContext(readFileSync(f, "utf8"), ctx, { filename: f });
    return ctx;
}
const dz = loadThemeGlobals(["src/js/problems.js"]);

const D = (o) => Object.assign({ idx: "1", Name: "x", HaveTimeout: false, BatteryLevel: 255, HardwareDisabled: false, LastUpdate: "2026-09-08 10:00:00" }, o);

test("timeout is a problem", () => {
    assert.equal(dz.dzProblemsReduce([D({ HaveTimeout: true })]).length, 1);
});
test("battery 10 is a problem, 11 is not, 255 means no battery", () => {
    assert.equal(dz.dzProblemsReduce([D({ BatteryLevel: 10 })])[0].battery, 10);
    assert.equal(dz.dzProblemsReduce([D({ BatteryLevel: 11 })]).length, 0);
    assert.equal(dz.dzProblemsReduce([D({ BatteryLevel: 255 })]).length, 0);
});
test("core precedence: disabled hardware is not a problem, timeout beats battery", () => {
    assert.equal(dz.dzProblemsReduce([D({ HardwareDisabled: true, HaveTimeout: true })]).length, 0);
    const row = dz.dzProblemsReduce([D({ HaveTimeout: true, BatteryLevel: 5 })])[0];
    assert.equal(row.kind, "timeout");
});
test("sort: timeouts first, then battery ascending, ties by name", () => {
    const rows = dz.dzProblemsReduce([
        D({ idx: "1", Name: "b", BatteryLevel: 9 }),
        D({ idx: "2", Name: "a", BatteryLevel: 3 }),
        D({ idx: "3", Name: "c", HaveTimeout: true }),
    ]);
    /* rows.map runs on a vm-realm array (dz.dzProblemsReduce built it inside
       the sandboxed context), so its own .map produces another vm-realm
       array; deepStrictEqual rejects that against this file's own-realm
       literal as "same structure but not reference-equal" even though every
       element matches (the exact cross-realm artifact documented in
       scripts/test-toast-policy.mjs). Array.from re-homes it in this
       realm before the comparison. */
    assert.deepEqual(Array.from(rows.map(r => r.idx)), ["3", "2", "1"]);
});
test("string BatteryLevel from the API parses", () => {
    assert.equal(dz.dzProblemsReduce([D({ BatteryLevel: "7" })]).length, 1);
});
test("fingerprint is stable for identical reductions and differs on change", () => {
    const a = dz.dzProblemsFingerprint(dz.dzProblemsReduce([D({ HaveTimeout: true })]));
    const b = dz.dzProblemsFingerprint(dz.dzProblemsReduce([D({ HaveTimeout: true })]));
    const c = dz.dzProblemsFingerprint(dz.dzProblemsReduce([D({ BatteryLevel: 5 })]));
    assert.equal(a, b);
    assert.notEqual(a, c);
});
