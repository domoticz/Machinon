import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/* Same pattern as scripts/test-toast-policy.mjs: src/js files are plain browser
   scripts declaring globals with var/function, so run the SHIPPING file in a vm
   context and read the globals back. The context has no `document`, which also
   proves the module does not touch the DOM at load time. */
function loadThemeGlobals(files) {
    const ctx = vm.createContext({ Math, console, JSON });
    for (const f of files) vm.runInContext(readFileSync(f, "utf8"), ctx, { filename: f });
    return ctx;
}

const dz = loadThemeGlobals(["src/js/problems.js"]);

test("idx maps to its page", () => {
    const map = dz.dzProblemsBuildRouteMap({ light: ["5"], temp: ["9"], weather: [], utility: ["12"] });
    assert.equal(map["5"], "#/LightSwitches");
    assert.equal(map["9"], "#/Temperature");
    assert.equal(map["12"], "#/Utility");
});
test("precedence when an idx appears in two lists", () => {
    const map = dz.dzProblemsBuildRouteMap({ light: ["5"], temp: ["5"], weather: [], utility: [] });
    assert.equal(map["5"], "#/LightSwitches");
});
test("unknown idx resolves to null", () => {
    assert.equal(dz.dzProblemsRoute({ "5": "#/LightSwitches" }, "99"), null);
    assert.equal(dz.dzProblemsRoute(null, "5"), null);
});
