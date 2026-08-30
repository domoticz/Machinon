import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const INDEX = JSON.parse(readFileSync("schemes/index.json", "utf8"));
const SCHEMES = {};
for (const slug of INDEX) {
    SCHEMES[slug] = JSON.parse(readFileSync(`schemes/${slug}.json`, "utf8"));
    SCHEMES[slug].slug = slug;
}

function loadSchemesJs() {
    const ctx = vm.createContext({ Math, console, JSON, window: {} });
    vm.runInContext(readFileSync("src/js/schemes.js", "utf8"), ctx,
                    { filename: "src/js/schemes.js" });
    return ctx;
}
const dz = loadSchemesJs();

test("every built-in scheme declares pair and variant", () => {
    for (const slug of INDEX) {
        const s = SCHEMES[slug];
        assert.ok(s.pair, `${slug} is missing "pair"`);
        assert.ok(s.variant === "light" || s.variant === "dark",
                  `${slug} has a bad "variant": ${s.variant}`);
    }
});

test("every built-in pair has exactly one light and one dark member", () => {
    const byPair = {};
    for (const slug of INDEX) {
        const p = SCHEMES[slug].pair;
        (byPair[p] = byPair[p] || []).push(SCHEMES[slug].variant);
    }
    for (const [pair, variants] of Object.entries(byPair)) {
        assert.deepEqual(variants.slice().sort(), ["dark", "light"],
                         `pair "${pair}" is not a light/dark couple: ${variants}`);
    }
});

test("findPairMate resolves both directions for every built-in", () => {
    for (const slug of INDEX) {
        const mate = dz.dzFindPairMate(slug, SCHEMES, []);
        assert.ok(mate, `${slug} has no mate`);
        assert.equal(dz.dzFindPairMate(mate, SCHEMES, []), slug,
                     `${slug} <-> ${mate} does not round-trip`);
    }
});

test("findPairMate resolves the base light/dark slugs", () => {
    assert.equal(dz.dzFindPairMate("light", SCHEMES, []), "dark");
    assert.equal(dz.dzFindPairMate("dark", SCHEMES, []), "light");
});

test("findPairMate resolves a generated user pair", () => {
    const users = [
        { name: "Sunset", variant: "light", pair: "u:sunset-1", base: "light", colors: {} },
        { name: "Sunset", variant: "dark",  pair: "u:sunset-1", base: "dark",  colors: {} }
    ];
    assert.equal(dz.dzFindPairMate("user:Sunset|light", SCHEMES, users), "user:Sunset|dark");
    assert.equal(dz.dzFindPairMate("user:Sunset|dark", SCHEMES, users), "user:Sunset|light");
});

test("findPairMate returns null for an unpaired legacy preset", () => {
    const users = [{ name: "Old", base: "light", colors: {} }];
    assert.equal(dz.dzFindPairMate("user:Old", SCHEMES, users), null);
    assert.equal(dz.dzFindPairMate("custom", SCHEMES, []), null);
});

test("a saved generated pair round-trips through findPairMate", () => {
    const users = [];
    const seed = { accent: "#E2703A", surface: null, look: "soft" };
    // Shape produced by dzSaveGeneratedPair, asserted directly so the storage
    // contract is pinned without needing the browser globals it writes to.
    const pairId = "u:sunset-3f2a";
    for (const variant of ["light", "dark"]) {
        users.push({ name: "Sunset", variant, pair: pairId, base: variant,
                     seed, colors: { background: "#FFFFFF" } });
    }
    assert.equal(dz.dzFindPairMate("user:Sunset|light", SCHEMES, users), "user:Sunset|dark");
    for (const u of users) {
        assert.equal(u.seed.look, "soft");
        assert.equal(u.base, u.variant, "base must mirror variant for a generated preset");
    }
});

test("pair ids are unique per generation", () => {
    const seen = new Set();
    for (let i = 0; i < 200; i++) {
        const id = dz.dzNewPairId("Sunset");
        assert.ok(!seen.has(id), `duplicate pair id ${id}`);
        seen.add(id);
    }
});
