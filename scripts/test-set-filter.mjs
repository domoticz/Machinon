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

/* ---- The diagnostics seam ----

   Loaded WITH src/js/diag.js and a fake DOM, so these assert what actually
   lands in the recorder's ring rather than that a stub was called. The
   distinction is not academic: every defect in the diagnostics feature so far
   was caught by a check that verified the recorded result and missed by one
   that verified the machinery ran. */
function loadWithDom(files) {
    const chip = { hidden: true, style: {}, querySelector: () => ({ textContent: "" }) };
    const document = {
        querySelectorAll: () => document.__cards,
        getElementsByClassName: () => [],
        getElementById: id => (id === "dz-set-chip" ? chip : null),
        __cards: []
    };
    const ctx = vm.createContext({
        Math, console, JSON, document,
        performance: { now: () => 0 },
        location: { hash: "#/Dashboard" },
        window: { addEventListener: () => {}, matchMedia: () => ({ matches: true }) },
        $: () => ({ trigger: () => {} })
    });
    ctx.window.document = document;
    for (const f of files) vm.runInContext(readFileSync(f, "utf8"), ctx, { filename: f });
    return ctx;
}

function domCard(idx) {
    const classes = new Set();
    return {
        querySelector: sel => (sel === "[data-idx]" ? { getAttribute: () => String(idx) } : null),
        closest: () => null,
        classList: {
            contains: c => classes.has(c),
            toggle: (c, on) => { if (on) classes.add(c); else classes.delete(c); },
            remove: c => classes.delete(c)
        }
    };
}

function armedRing(ctx) {
    return ctx.machinonDiag({ quiet: true }).history.entries.set_filter || [];
}

test("arming records the set size and the route, never the label", () => {
    const ctx = loadWithDom(["src/js/diag.js", "src/js/set-filter.js"]);
    ctx.dzDiagSetEnabled(true);
    ctx.document.__cards = [domCard(54), domCard(231)];
    ctx.dzApplySetFilter({ "d:54": true, "d:231": true }, "Schuur - Sensor - Lux");
    const armed = armedRing(ctx).filter(e => e.event === "armed");
    assert.equal(armed.length, 1);
    assert.equal(armed[0].members, 2);
    assert.equal(armed[0].route, "#/Dashboard");
    assert.equal(JSON.stringify(armed[0]).indexOf("Schuur"), -1,
        "the chip label is a device name by construction and must not travel");
});

test("the reapply records how many cards the armed set actually matched", () => {
    /* The count only comes into being inside the reapply loop: at arm time no
       render has happened, which is why this is its own event and not a field
       on `armed`. */
    const ctx = loadWithDom(["src/js/diag.js", "src/js/set-filter.js"]);
    ctx.dzDiagSetEnabled(true);
    ctx.document.__cards = [domCard(54), domCard(231), domCard(999)];
    ctx.dzApplySetFilter({ "d:54": true, "d:231": true }, "two devices");
    const reapplied = armedRing(ctx).filter(e => e.event === "reapplied");
    assert.equal(reapplied.length, 1);
    assert.equal(reapplied[0].cards_matched, 2, "two of the three cards are in the set");
    assert.equal(reapplied[0].members, 2);
});

test("a later reapply matching a different number of cards appends, it does not fold away", () => {
    /* The failure this stops: a filter that matches nothing on the first
       render and everything on the second would otherwise be recorded, once,
       as the state that was wrong. */
    const ctx = loadWithDom(["src/js/diag.js", "src/js/set-filter.js"]);
    ctx.dzDiagSetEnabled(true);
    ctx.document.__cards = [];
    ctx.dzApplySetFilter({ "d:54": true }, "one device");
    ctx.document.__cards = [domCard(54)];
    ctx.dzReapplySetFilter();
    /* Array.from: the ring is built in the vm realm, so its arrays fail a
       reference-equal prototype check against this one. */
    const counts = Array.from(armedRing(ctx).filter(e => e.event === "reapplied").map(e => e.cards_matched));
    assert.deepEqual(counts, [0, 1]);
});

test("a reapply that changes nothing coalesces instead of filling the ring", () => {
    const ctx = loadWithDom(["src/js/diag.js", "src/js/set-filter.js"]);
    ctx.dzDiagSetEnabled(true);
    ctx.document.__cards = [domCard(54)];
    ctx.dzApplySetFilter({ "d:54": true }, "one device");
    for (let i = 0; i < 20; i++) ctx.dzReapplySetFilter();
    const reapplied = armedRing(ctx).filter(e => e.event === "reapplied");
    assert.equal(reapplied.length, 1, "21 identical render passes are one entry");
    assert.equal(reapplied[0].__seen, 21);
});

test("clearing records the set that was armed, not the empty one it leaves behind", () => {
    const ctx = loadWithDom(["src/js/diag.js", "src/js/set-filter.js"]);
    ctx.dzDiagSetEnabled(true);
    ctx.document.__cards = [domCard(54), domCard(231)];
    ctx.dzApplySetFilter({ "d:54": true, "d:231": true }, "two devices");
    ctx.dzClearSetFilter(true);
    const cleared = armedRing(ctx).filter(e => e.event === "cleared");
    assert.equal(cleared.length, 1);
    assert.equal(cleared[0].members, 2, "reporting 0 here would hide what was disarmed");
});

test("the seam records nothing at all while the recorder is off", () => {
    const ctx = loadWithDom(["src/js/diag.js", "src/js/set-filter.js"]);
    ctx.document.__cards = [domCard(54)];
    ctx.dzApplySetFilter({ "d:54": true }, "one device");
    assert.equal(ctx.machinonDiag({ quiet: true }).history.recorder, "off");
});

test("the seam is silent, not fatal, in a context with no recorder loaded at all", () => {
    /* set-filter.js is loaded on its own by the tests above and by any harness
       that wants the pure key logic; a bare dzLog reference there is a
       ReferenceError, i.e. a filter that no longer filters. */
    const ctx = loadWithDom(["src/js/set-filter.js"]);
    ctx.document.__cards = [domCard(54)];
    ctx.dzApplySetFilter({ "d:54": true }, "one device");
    ctx.dzClearSetFilter(true);
    assert.equal(ctx.dzSetFilter, null);
});
