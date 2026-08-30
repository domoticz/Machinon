import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

function loadThemeGlobals(files) {
    const ctx = vm.createContext({ Math, console, JSON });
    for (const f of files) {
        vm.runInContext(readFileSync(f, "utf8"), ctx, { filename: f });
    }
    return ctx;
}

const dz = loadThemeGlobals([
    "src/js/color-oklch.js",
    "src/js/scheme-generator.js"
]);

const KEYS = ["background", "item", "navbar", "main_color", "main_text", "alt_text",
              "border", "disabled", "error", "success", "warning", "accent_text"];

/* Floors from the spec's contrast contract. Each entry is
   [foreground key, background key, ratio-picking function]. */
function floorsFor(look) {
    const P = dz.DZ_LOOKS[look];
    return [
        ["main_text",   "background", P.body],
        ["alt_text",    "background", P.alt],
        ["main_color",  "background", P.acc],
        ["accent_text", "main_color", 4.5],
        ["disabled",    "background", P.disabledRatio || 3.2],
        ["error",       "background", P.acc],
        ["success",     "background", P.acc],
        ["warning",     "background", P.acc]
    ];
}

test("parity with the Python prototype (<=1 per channel)", () => {
    const fixture = JSON.parse(
        readFileSync("docs/superpowers/plans/2026-08-30-generator-parity-fixture.json", "utf8"));
    const drift = [];
    for (const [caseKey, expected] of Object.entries(fixture)) {
        const [look, accent, variant, surfaceRaw] = caseKey.split("|");
        const surface = surfaceRaw === "null" ? null : surfaceRaw;
        const got = dz.dzGenerateScheme({ accent, surface, look }, variant);
        for (const k of KEYS) {
            const a = expected[k], b = got[k];
            assert.match(b, /^#[0-9A-F]{6}$/, `${caseKey} ${k} is not a hex colour: ${b}`);
            for (let i = 1; i < 7; i += 2) {
                const d = Math.abs(parseInt(a.substr(i, 2), 16) - parseInt(b.substr(i, 2), 16));
                assert.ok(d <= 1, `${caseKey} ${k}: expected ${a}, got ${b} (channel drift ${d})`);
            }
            if (a !== b) { drift.push(`${caseKey} ${k}: ${a} -> ${b}`); }
        }
    }
    if (drift.length) {
        console.log(`  note: ${drift.length} value(s) differ by exactly 1 (float/rounding noise):`);
        drift.forEach(d => console.log("    " + d));
    }
});

test("every generated scheme clears every contrast floor", () => {
    const hues = [];
    for (let h = 0; h < 360; h += 10) { hues.push(h); }
    const chromas = [0.02, 0.08, 0.15, 0.30];
    let checked = 0;
    for (const look of dz.DZ_LOOK_ORDER) {
        for (const h of hues) {
            for (const C of chromas) {
                const accent = dz.dzOklchToHex(0.6, C, h);
                for (const variant of ["light", "dark"]) {
                    const cs = dz.dzGenerateScheme({ accent, surface: null, look }, variant);
                    for (const [fg, bg, floor] of floorsFor(look)) {
                        const r = dz.dzContrastRatio(cs[fg], cs[bg]);
                        assert.ok(r >= floor - 0.01,
                            `${look}/${variant} accent=${accent}: ${fg} vs ${bg} = ${r.toFixed(2)}, needs ${floor}`);
                    }
                    checked++;
                }
            }
        }
    }
    assert.equal(checked, dz.DZ_LOOK_ORDER.length * hues.length * chromas.length * 2);
    assert.equal(checked, 864, "3 looks x 36 hues x 4 chromas x 2 variants");
    console.log(`  swept ${checked} generated schemes`);
});

test("every scheme defines exactly the 12 keys applyCustomColorScheme consumes", () => {
    const cs = dz.dzGenerateScheme({ accent: "#E2703A", surface: null, look: "soft" }, "light");
    assert.deepEqual(Object.keys(cs).sort(), [...KEYS].sort());
});

test("the energy and sun/moon identities are never generated", () => {
    const cs = dz.dzGenerateScheme({ accent: "#E2703A", surface: null, look: "deep" }, "dark");
    for (const k of ["sun", "moon", "energy_import", "energy_export",
                     "energy_gas", "energy_water", "energy_price"]) {
        assert.equal(cs[k], undefined, `${k} must inherit from the base underlay, not be generated`);
    }
});

test("generation is deterministic", () => {
    const seed = { accent: "#8B5CF6", surface: "#4FAE6A", look: "deep" };
    assert.deepEqual(dz.dzGenerateSchemePair(seed), dz.dzGenerateSchemePair(seed));
});

test("a pair returns a light and a dark variant that differ", () => {
    const pair = dz.dzGenerateSchemePair({ accent: "#3B7DD8", surface: null, look: "soft" });
    assert.ok(pair.light && pair.dark);
    assert.notEqual(pair.light.background, pair.dark.background);
});

test("omitting the surface seed tints the neutrals with the accent hue", () => {
    const withSurface = dz.dzGenerateScheme(
        { accent: "#E2703A", surface: "#3B7DD8", look: "deep" }, "light");
    const without = dz.dzGenerateScheme(
        { accent: "#E2703A", surface: null, look: "deep" }, "light");
    assert.notEqual(withSurface.background, without.background);
    // Deep has the strongest neutral chroma, so the hue difference must show.
    const a = dz.dzHexToOklch(withSurface.background).h;
    const b = dz.dzHexToOklch(without.background).h;
    assert.ok(Math.abs(a - b) > 20, `surface hue did not take effect (${a} vs ${b})`);
});
