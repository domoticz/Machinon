import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/* The theme's src/js files are plain browser scripts that declare globals with
   `var` / `function`, not ES modules. Run them in a vm context and read the
   globals back out, so the SHIPPING file is what gets tested, with no build
   step and no change to how the browser loads it. */
export function loadThemeGlobals(files) {
    const ctx = vm.createContext({ Math, console, JSON });
    for (const f of files) {
        vm.runInContext(readFileSync(f, "utf8"), ctx, { filename: f });
    }
    return ctx;
}

const dz = loadThemeGlobals(["src/js/color-oklch.js"]);

test("hex -> oklch -> hex round-trips within 1 per channel", () => {
    // Not asserted as exact: the round trip goes through cbrt and pow, so a
    // last-ulp difference can move a channel by one. A real error in the
    // matrices moves it by far more than that.
    for (const hex of ["#E2703A", "#3B7DD8", "#4FAE6A", "#8B5CF6",
                       "#FFFFFF", "#000000", "#808080", "#FF0000"]) {
        const { L, C, h } = dz.dzHexToOklch(hex);
        const back = dz.dzOklchToHex(L, C, h);
        for (let i = 1; i < 7; i += 2) {
            const d = Math.abs(parseInt(hex.substr(i, 2), 16) - parseInt(back.substr(i, 2), 16));
            assert.ok(d <= 1, `round-trip failed for ${hex}: got ${back}`);
        }
    }
});

test("contrast ratio matches known WCAG values", () => {
    assert.equal(dz.dzContrastRatio("#FFFFFF", "#000000").toFixed(2), "21.00");
    assert.equal(dz.dzContrastRatio("#FFFFFF", "#FFFFFF").toFixed(2), "1.00");
    // #767676 on white is the canonical 4.5:1 boundary colour
    assert.ok(Math.abs(dz.dzContrastRatio("#767676", "#FFFFFF") - 4.54) < 0.02);
});

test("oklch -> hex clamps out-of-gamut chroma instead of producing garbage", () => {
    // C=0.4 at L=0.5 is far outside sRGB for any hue
    for (let h = 0; h < 360; h += 30) {
        const hex = dz.dzOklchToHex(0.5, 0.4, h);
        assert.match(hex, /^#[0-9A-F]{6}$/, `bad hex at h=${h}: ${hex}`);
    }
});

test("solveLightness hits the requested ratio from either direction", () => {
    const down = dz.dzSolveLightness(0.02, 250, "#FFFFFF", 7.0, false);
    assert.ok(dz.dzContrastRatio(down, "#FFFFFF") >= 7.0);
    const up = dz.dzSolveLightness(0.02, 250, "#000000", 7.0, true);
    assert.ok(dz.dzContrastRatio(up, "#000000") >= 7.0);
});
