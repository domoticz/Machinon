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
    const floors = [
        ["main_text",   "background", P.body],
        ["alt_text",    "background", P.alt],
        ["main_color",  "background", P.acc],
        ["accent_text", "main_color", 4.5],
        ["disabled",    "background", P.disabledRatio || 3.2],
        ["error",       "background", P.acc],
        ["success",     "background", P.acc],
        ["warning",     "background", P.acc]
    ];
    /* Only a hardBorder look solves its border to a real ratio; the other
       looks place it at a fixed perceptual offset with no ratio floor to
       hold, so only sweep it where there is one. */
    if (P.hardBorder) { floors.push(["border", "background", P.borderRatio]); }
    return floors;
}

test("parity with the Python prototype (<=1 per channel)", () => {
    /* Frozen golden-file baseline: the exact output of the Python design
       prototype that this generator was ported from, for a fixed set of
       seeds. It lives under scripts/fixtures (tracked by git, unlike
       docs/superpowers/ which is gitignored) so CI can read it on a clean
       checkout. If the generator's design is ever deliberately changed,
       regenerate this fixture from the NEW generator and review the diff
       like any other behaviour change; it is not meant to pin the old
       behaviour forever. */
    const fixture = JSON.parse(
        readFileSync("scripts/fixtures/scheme-generator-parity.json", "utf8"));
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

test("text falls back to a solve when the look's anchor undershoots its floor", () => {
    /* The 864-scheme sweep above never exercises the solve fallback inside
       floored(): across every swept hue/chroma/look/variant combination the
       raw anchor colour already clears its floor, so the branch that calls
       dzSolveLightness for main_text/alt_text is dead weight as far as that
       sweep can tell. Prove it independently by installing a temporary look
       whose anchor sits deliberately too close to its own background to
       clear "body", and confirming the returned text still meets the floor
       (which is only possible via the solve, not the raw anchor). DZ_LOOKS
       is restored afterwards so no other test sees the temporary look. */
    const original = dz.DZ_LOOKS;
    const bad = Object.assign({}, original.soft, { anchor: 0.94 });
    original.__badAnchorTest = bad;
    try {
        const accent = "#3B7DD8";
        const hs = dz.dzHexToOklch(accent).h;
        const tC = bad.nC * 1.5;

        // Sanity check on the test fixture itself: the raw anchor must NOT
        // clear the floor, otherwise this test would not reach the fallback
        // branch at all and would pass for the wrong reason.
        const rawAnchorColor = dz.dzOklchToHex(bad.anchor, tC, hs);
        const rawRatio = dz.dzContrastRatio(rawAnchorColor, dz.dzOklchToHex(bad.light[1], bad.nC, hs));
        assert.ok(rawRatio < bad.body,
            `test setup invalid: raw anchor already clears the floor (${rawRatio.toFixed(2)} >= ${bad.body})`);

        const cs = dz.dzGenerateScheme({ accent, surface: null, look: "__badAnchorTest" }, "light");
        const textRatio = dz.dzContrastRatio(cs.main_text, cs.background);
        const altRatio = dz.dzContrastRatio(cs.alt_text, cs.background);
        assert.ok(textRatio >= bad.body - 0.01,
            `main_text did not fall back to a solve: ${textRatio.toFixed(2)} < ${bad.body}`);
        assert.ok(altRatio >= bad.alt - 0.01,
            `alt_text did not fall back to a solve: ${altRatio.toFixed(2)} < ${bad.alt}`);
    } finally {
        delete original.__badAnchorTest;
    }
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
