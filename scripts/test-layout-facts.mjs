import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/* The layout collector's pure halves, run out of the shipping file. The DOM
   reading is deliberately thin and lives in dzLayoutFacts; everything that
   decides what a reader SEES is here, where it can be driven with values a
   real browser would be tedious to coax into producing. */
function loadPage() {
    const ctx = vm.createContext({
        Math, console, JSON,
        document: { readyState: "complete", addEventListener() {} },
        window: {}
    });
    vm.runInContext(readFileSync("src/js/page.js", "utf8"), ctx, { filename: "src/js/page.js" });
    return ctx;
}

const dz = loadPage();

test("an element is named by tag and class, never by id or text", () => {
    /* An id can carry a device idx (itemtable54) and text carries device names.
       This artifact is meant to be safe to paste into a public issue. */
    const el = { tagName: "DIV", id: "itemtable54", className: "item itemBlock statusTimeout extra another",
                 textContent: "Living room lamp" };
    const described = dz.dzLayoutDescribe(el);
    assert.equal(described, "div.item.itemBlock.statusTimeout");
    assert.equal(described.indexOf("itemtable54"), -1);
    assert.equal(described.indexOf("Living room"), -1);
});

test("describing something unusable degrades instead of throwing", () => {
    assert.equal(dz.dzLayoutDescribe(null), "unknown");
    assert.equal(dz.dzLayoutDescribe({}), "unknown");
    assert.equal(dz.dzLayoutDescribe({ tagName: "SECTION", className: "" }), "section");
});

test("card widths reduce to a range, a median and a count of distinct widths", () => {
    const s = dz.dzLayoutWidths([412, 412, 412, 336]);
    assert.equal(s.cards_painted, 4);
    assert.equal(s.card_width, "336-412 (median 412)");
    assert.equal(s.narrowest, 336);
});

test("the bucket count is what says a grid disagrees with itself", () => {
    /* "Squashed cards" is a grid where the cards are not all one width, and the
       number of distinct widths says so without listing every card. */
    const even = dz.dzLayoutWidths([412, 412, 413, 411]);
    assert.equal(even.width_buckets, 1, "a pixel of rounding is one width, not four");
    const ragged = dz.dzLayoutWidths([412, 336, 280, 500]);
    assert.equal(ragged.width_buckets, 4);
});

test("a page with no cards says none rather than reporting a nonsense range", () => {
    const s = dz.dzLayoutWidths([]);
    assert.deepEqual({ ...s }, { cards_painted: 0, card_width: "none", width_buckets: 0, narrowest: null });
});

test("a card below the configured minimum is a violation, with two pixels of slack", () => {
    /* Fractional grid maths can round a card a pixel under its minimum with
       nothing actually wrong, and a guard that cries at that is ignored. */
    const ctx = loadPage();
    ctx.document.scrollingElement = { scrollWidth: 1440, clientWidth: 1440 };
    ctx.document.querySelectorAll = () => [];
    const justUnder = ctx.dzLayoutViolations({ cards_painted: 4, card_width: "319-412 (median 412)" }, 320);
    assert.deepEqual(Array.from(justUnder), [], "one pixel under is rounding");
    const genuinely = ctx.dzLayoutViolations({ cards_painted: 4, card_width: "280-412 (median 412)" }, 320);
    assert.equal(genuinely.length, 1);
    assert.match(genuinely[0], /^card_below_min: 280px against --dz-card-min-width 320px$/);
});

test("horizontal overflow is reported with the element that causes it", () => {
    const ctx = loadPage();
    ctx.document.scrollingElement = { scrollWidth: 2248, clientWidth: 1440 };
    ctx.window.innerWidth = 1440;
    ctx.document.querySelectorAll = (sel) => (sel === "#main-view *" ? [
        { tagName: "DIV", className: "item itemBlock", getBoundingClientRect: () => ({ width: 412, right: 1400 }) },
        { tagName: "DIV", className: "dz-probe-wide", getBoundingClientRect: () => ({ width: 2200, right: 2248 }) }
    ] : []);
    const bad = ctx.dzLayoutViolations({ cards_painted: 0, card_width: "none" }, 320);
    assert.equal(bad.length, 1);
    assert.equal(bad[0], "h_overflow: 808px, widest div.dz-probe-wide to 2248px");
});

test("a measurement that throws becomes a reported violation, not a broken snapshot", () => {
    /* The collector runs inside machinonDiag(), which a user reaches through a
       button: it may report that it could not measure, but it may not take the
       rest of the artifact down with it. */
    const ctx = loadPage();
    Object.defineProperty(ctx.document, "scrollingElement", {
        get() { throw new Error("detached"); }
    });
    const bad = ctx.dzLayoutViolations({ cards_painted: 0, card_width: "none" }, 320);
    assert.equal(bad.length, 1);
    assert.match(bad[0], /^measure_failed: detached$/);
});
