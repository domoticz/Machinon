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

/* iOS focus zoom (#233): Safari zooms in on a focused field under 16px and
   stays zoomed, stranding position-fixed UI off-screen. */
const CORE_VIEWPORT = "width=device-width, initial-scale=1.0, maximum-scale=5.0, minimum-scale=1.0, user-scalable=yes";
const UA = {
    iphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0 Mobile/15E148 Safari/604.1",
    ipad: "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    mac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0 Safari/605.1.15",
    android: "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36"
};

test("iOS is recognised on iPhone, iPad, and iPadOS posing as a Mac", () => {
    assert.equal(dz.dzIsIOS({ userAgent: UA.iphone, maxTouchPoints: 5 }), true);
    assert.equal(dz.dzIsIOS({ userAgent: UA.ipad, maxTouchPoints: 5 }), true);
    /* iPadOS Safari requests desktop sites with a Mac user agent; only the
       touch points give it away. */
    assert.equal(dz.dzIsIOS({ userAgent: UA.mac, maxTouchPoints: 5 }), true);
});

test("a real Mac, Android and a missing navigator are not iOS", () => {
    assert.equal(dz.dzIsIOS({ userAgent: UA.mac, maxTouchPoints: 0 }), false);
    assert.equal(dz.dzIsIOS({ userAgent: UA.android, maxTouchPoints: 5 }), false);
    assert.equal(dz.dzIsIOS(undefined), false);
    assert.equal(dz.dzIsIOS({}), false);
});

test("the viewport caps maximum-scale at 1 and keeps everything else core set", () => {
    assert.equal(dz.dzViewportNoFocusZoom(CORE_VIEWPORT),
        "width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=yes");
});

test("a viewport without maximum-scale gets one, and applying twice changes nothing", () => {
    assert.equal(dz.dzViewportNoFocusZoom("width=device-width, initial-scale=1"),
        "width=device-width, initial-scale=1, maximum-scale=1.0");
    const once = dz.dzViewportNoFocusZoom(CORE_VIEWPORT);
    assert.equal(dz.dzViewportNoFocusZoom(once), once);
});

function viewportPage(nav, content) {
    const ctx = loadPage();
    const meta = { content, getAttribute() { return this.content; }, setAttribute(k, v) { this[k] = v; } };
    ctx.navigator = nav;
    ctx.document.querySelector = (sel) => (sel === 'meta[name="viewport"]' && content !== null ? meta : null);
    return { ctx, meta };
}

test("the viewport is rewritten on iOS only", () => {
    const ios = viewportPage({ userAgent: UA.iphone, maxTouchPoints: 5 }, CORE_VIEWPORT);
    ios.ctx.dzPreventFocusZoom();
    assert.match(ios.meta.content, /maximum-scale=1\.0/);

    /* Everywhere else maximum-scale=1 is a real pinch-zoom lock. */
    const android = viewportPage({ userAgent: UA.android, maxTouchPoints: 5 }, CORE_VIEWPORT);
    android.ctx.dzPreventFocusZoom();
    assert.equal(android.meta.content, CORE_VIEWPORT);
});

test("a page without a viewport tag is left alone", () => {
    const { ctx } = viewportPage({ userAgent: UA.iphone, maxTouchPoints: 5 }, null);
    assert.doesNotThrow(() => ctx.dzPreventFocusZoom());
});

/* Just enough DOM for dzPlaceSetupApply: nodes that know their parent, and a
   document that answers the four selectors it asks. */
function node(className) {
    const n = { className: className || "", parentNode: null, children: [],
        appendChild(child) {
            if (child.parentNode) {
                const siblings = child.parentNode.children;
                siblings.splice(siblings.indexOf(child), 1);
            }
            child.parentNode = n;
            n.children.push(child);
            return child;
        } };
    return n;
}

function setupPage({ markup = true } = {}) {
    const content = node(), home = node("pull-right"), apply = node("sub-tabs-apply");
    if (markup) home.appendChild(apply);
    const doc = {
        createElement: () => node(),
        querySelector(sel) {
            if (sel === "#settingscontent a.sub-tabs-apply") return markup ? apply : null;
            if (sel === "#settingscontent #tabs > li.pull-right") return markup ? home : null;
            if (sel === "#settingscontent #content") return content;
            if (sel === "#settingscontent .dz-setup-apply") {
                return content.children.find((c) => c.className === "dz-setup-apply") || null;
            }
            return null;
        }
    };
    return { doc, content, home, apply };
}

test("at phone width Apply moves out of the scrolling strip into one bar", () => {
    /* iOS does not paint a fixed element inside a scrolling ancestor, so the
       button has to leave the strip to be seen at all. */
    const page = setupPage();
    dz.dzPlaceSetupApply(page.doc, true);
    assert.equal(page.apply.parentNode.className, "dz-setup-apply");
    assert.equal(page.apply.parentNode.parentNode, page.content);
    assert.equal(page.home.children.length, 0, "the strip item is left empty, which the CSS collapses");

    dz.dzPlaceSetupApply(page.doc, true);
    assert.equal(page.content.children.length, 1, "a repeat call reuses the bar");
});

test("widening the viewport puts Apply back in the strip", () => {
    const page = setupPage();
    dz.dzPlaceSetupApply(page.doc, true);
    dz.dzPlaceSetupApply(page.doc, false);
    assert.equal(page.apply.parentNode, page.home);
});

test("unrecognised Setup markup is left alone", () => {
    /* No button found means core changed the page; adding an empty bar
       would only take space from the tab content. */
    const page = setupPage({ markup: false });
    dz.dzPlaceSetupApply(page.doc, true);
    assert.equal(page.content.children.length, 0);
});
