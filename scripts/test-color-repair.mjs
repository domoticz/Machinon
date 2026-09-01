/* Tests for src/js/color-repair.js.
 *
 * Runs the SHIPPING browser files in a node vm with only { Math }, the same
 * pattern as test-color-oklch.mjs: if either file ever reaches for a DOM or a
 * theme global, these tests fail rather than a user's page.
 *
 * Run: node --test scripts/test-color-repair.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadThemeGlobals() {
    const ctx = createContext({ Math });
    for (const f of ["color-oklch.js", "color-repair.js"]) {
        runInContext(readFileSync(join(ROOT, "src", "js", f), "utf8"), ctx, { filename: f });
    }
    return ctx;
}

const G = loadThemeGlobals();

/* The shipped values, from dz-tokens.css and dark.css. */
const STATUS = {
    light: { timeout: "#C44041", lowbat: "#8E6900", protected: "#00008B" },
    dark: { timeout: "#F56D69", lowbat: "#FFC107", protected: "#6595FF" },
};
const IDENTITY_LIGHT = {
    import: "#a37300", export: "#3e8c42", gas: "#e83700",
    water: "#0883bb", price: "#9d55ff", sun: "#8c730e", moon: "#567ac6",
};
/* Every shipped scheme's card, from schemes/*.json plus the two bases. */
const CARDS = {
    "machinon-light": ["#ffffff", "light"], "machinon-dark": ["#18202b", "dark"],
    "magenta-light": ["#FFFFFF", "light"], "magenta-dark": ["#21191F", "dark"],
    "paper-light": ["#ffffff", "light"], "paper-dark": ["#1E1E1E", "dark"],
    "gruvbox-light": ["#f2e5bc", "light"], "gruvbox-dark": ["#3c3836", "dark"],
};

test("no shipped status value changes on any shipped card", () => {
    for (const [name, [card, side]] of Object.entries(CARDS)) {
        for (const [k, v] of Object.entries(STATUS[side])) {
            assert.equal(
                G.dzRepairAgainstSurface(v, card, G.DZ_REPAIR_TARGET_STATUS), v,
                `${name}/${k} must be left alone, it already clears its floor`
            );
        }
    }
});

test("a hand-built dark palette gets protected repaired from invisible", () => {
    const card = "#1b2027";
    const before = G.dzContrastRatio(STATUS.light.protected, card);
    assert.ok(before < 1.2, `precondition: navy on this card is ~1.07, got ${before}`);
    const after = G.dzRepairAgainstSurface(STATUS.light.protected, card, G.DZ_REPAIR_TARGET_STATUS);
    assert.notEqual(after, STATUS.light.protected);
    assert.ok(G.dzContrastRatio(after, card) >= G.DZ_REPAIR_TARGET_STATUS - 0.02);
});

test("hue is held when a colour is repaired", () => {
    const card = "#1b2027";
    for (const v of Object.values(STATUS.light)) {
        const out = G.dzRepairAgainstSurface(v, card, G.DZ_REPAIR_TARGET_STATUS);
        const dh = Math.abs(G.dzHexToOklch(out).h - G.dzHexToOklch(v).h);
        assert.ok(dh < 1.0, `hue drifted ${dh.toFixed(2)} degrees on ${v} -> ${out}`);
    }
});

test("a mid-toned card keeps chroma instead of washing out to near-white", () => {
    /* Solving one direction only runs to the gamut corner here. Each repaired
       colour must stay a colour, not become paper. */
    const card = "#7a7f86";
    for (const v of Object.values(STATUS.light)) {
        const out = G.dzRepairAgainstSurface(v, card, G.DZ_REPAIR_TARGET_STATUS);
        assert.ok(G.dzHexToOklch(out).C > 0.02, `${v} -> ${out} lost its hue on a mid-toned card`);
        assert.ok(G.dzContrastRatio(out, card) >= G.DZ_REPAIR_TARGET_STATUS - 0.02);
    }
});

test("every identity colour is repaired on a mid-toned card", () => {
    const card = "#7a7f86";
    for (const [k, v] of Object.entries(IDENTITY_LIGHT)) {
        assert.ok(G.dzContrastRatio(v, card) < 1.2, `precondition: ${k} fails badly here`);
        const out = G.dzRepairAgainstSurface(v, card, G.DZ_REPAIR_TARGET_IDENTITY);
        assert.ok(G.dzContrastRatio(out, card) >= G.DZ_REPAIR_TARGET_IDENTITY - 0.02,
            `${k} -> ${out} still fails`);
    }
});

test("the tile mix matches color-mix(in srgb, X 15%, Y)", () => {
    /* Chromium's computed value for #D6514F at 15% over #f2f2f2, checked on the
       rig, was srgb(0.932549 0.854314 0.853137). Times 255 that is
       237.80 / 217.85 / 217.55, i.e. #EEDADA once rounded to 8 bits. */
    assert.equal(G.dzRepairMix("#D6514F", "#f2f2f2", 0.15).toUpperCase(), "#EEDADA");
});

test("the toast tile is repaired against ITS surface, not the card", () => {
    /* card #727272 with navbar #111111: repairing against the card alone gives
       #280002, which on its own tile is 1.01:1. The tile solve must not. */
    const menu = "#111111";
    const out = G.dzRepairAgainstTile(STATUS.light.timeout, menu, G.DZ_REPAIR_TARGET_STATUS);
    const tile = G.dzRepairMix(out, menu, 0.15);
    assert.ok(G.dzContrastRatio(out, tile) >= G.DZ_REPAIR_TARGET_STATUS - 0.02,
        `${out} on tile ${tile} = ${G.dzContrastRatio(out, tile).toFixed(2)}`);
});

test("a card value and a tile value genuinely differ when the surfaces disagree", () => {
    const card = "#727272", menu = "#111111";
    const forCard = G.dzRepairAgainstSurface(STATUS.light.timeout, card, G.DZ_REPAIR_TARGET_STATUS);
    const forTile = G.dzRepairAgainstTile(STATUS.light.timeout, menu, G.DZ_REPAIR_TARGET_STATUS);
    assert.notEqual(forCard, forTile);
    /* And the card value really would have failed on the tile - this is the
       measurement that forced two values instead of one. */
    const bad = G.dzContrastRatio(forCard, G.dzRepairMix(forCard, menu, 0.15));
    assert.ok(bad < 3.0, `expected the card value to fail on the tile, got ${bad.toFixed(2)}`);
});

test("a missing or empty input is returned unchanged", () => {
    assert.equal(G.dzRepairAgainstSurface("", "#ffffff", 4.0), "");
    assert.equal(G.dzRepairAgainstSurface("#C44041", "", 4.0), "#C44041");
    assert.equal(G.dzRepairAgainstTile("#C44041", null, 4.0), "#C44041");
});

test("repair is idempotent", () => {
    const card = "#1b2027";
    const once = G.dzRepairAgainstSurface(STATUS.light.protected, card, G.DZ_REPAIR_TARGET_STATUS);
    const twice = G.dzRepairAgainstSurface(once, card, G.DZ_REPAIR_TARGET_STATUS);
    assert.equal(twice, once);
});
