/* Page chrome and navigation: hash-route reactions, page title, logo,
   dashboard row merging, core-popup clamping, and the shared one-shot DOM
   waiter the other modules use instead of polling. */

/* One-shot DOM waiters: run fn once selector matches, immediately or when it
   renders. A repeated call with the same key re-arms the waiter instead of
   stacking a second one. Replaces the per-feature polling loops, which kept
   timers spinning for the whole session when their element never appeared. */
var domWaiters = {};
function whenElementRenders(key, selector, fn) {
    /* Boot race guard: custom.js injects THEME_MODULES as async=false
       scripts, which can execute while the parser is still blocked on
       js/require.min.js, i.e. before <body> exists. In that state the
       observe() below got null and its TypeError aborted the CALLER's whole
       module init (the intermittently missing Theme menu entry, prod
       2.0.2). While the document is still parsing, defer the whole check
       to DOMContentLoaded: every boot-time caller targets static
       index.html markup, so the immediate path hits there, and a waiter
       armed at DOM-ready can never observe a mid-parse, half-built menu
       (the second, fail-closed-forever variant of the same race). The
       observer path below stays for genuinely dynamic content
       (#iconsmain). */
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function() {
            whenElementRenders(key, selector, fn);
        });
        return;
    }
    if ($(selector).length) {
        fn();
        return;
    }
    if (domWaiters[key]) domWaiters[key].disconnect();
    domWaiters[key] = new MutationObserver(function() {
        if ($(selector).length) {
            domWaiters[key].disconnect();
            delete domWaiters[key];
            fn();
        }
    });
    domWaiters[key].observe(document.getElementById("holder") || document.body, { childList: true, subtree: true });
}

function locationHashChanged() {
    setPageTitle();
    $(".current_page_item:not(:first)").removeClass("current_page_item");
    /* The query is NOT cleared here: core persists it in
       myglobals.LastSearchFilter and ScheduleLiveSearchRestore reapplies it
       once the input and the page container both exist. Clearing here would
       race that restore and discard the filter on every navigation. */

    /* #search does not exist yet on the very first call: custom.js's
       init_theme calls locationHashChanged() before setSearch() builds the
       box (loadSettings().then -> $(document).ready(...), locationHashChanged
       then setSearch, in that order), so a direct page load straight into a
       non-whitelisted route (e.g. #/ProblemDevices) used to find no #search here,
       silently no-op, and then get a freshly built box with no readonly
       class at all - the mobile pill expanded where it should not, and only
       a LATER hashchange (navigating away and back) ever corrected it.
       whenElementRenders (this file, above) defers to the moment #search
       actually exists - immediately, on every hashchange after boot, since
       it already does by then - and the condition is read fresh inside the
       callback rather than closed over a stale value, so a hash change that
       lands while the very first call is still waiting is not raced. */
    whenElementRenders("search-readonly", "#search", function() {
        if (location.hash == "#/Dashboard" && !isMobile || location.hash == "#/LightSwitches" || location.hash == "#/Scenes" || location.hash == "#/Temperature" || location.hash == "#/Weather" || location.hash == "#/Utility") {
            $("#search").removeClass("readonly");
        } else {
            $("#search").addClass("readonly");
        }
    });
    if ((location.hash == "#/Dashboard") && theme.features.dashboard_camera.enabled) {
        if (typeof cameraPreview === "function")
            theme.features.dashboard_camera_section && cameraPreview(theme.features.dashboard_camera_section.enabled);
    }
    if (location.hash == "#/CustomIcons") {
        setCustomIconsPage();
    }
    /* #/Setup needs no theme hook anymore: there is no injected Theme tab;
       theme settings live in the hub (src/js/theme-hub.js), a click
       pseudo-route with no hash of its own. */
}

function setPageTitle() {
    var pagedetect = window.location.href.split("#/")[1];
    var title = (typeof $.t !== "undefined" ? $.t(pagedetect) : pagedetect );
    document.title = 'Domoticz - ' + title;
}

function isAdmin() {
    if (typeof angular !== "undefined") {
        var injector = angular.element($("html")).injector();
        var permissions = injector.get("permissions");
        return permissions.hasPermission("Admin");
    } else return false;
}

function removeRowDivider() {
    if ($("#dashcontent").length) {
        $("#dashcontent > section").each(function() {
            $("div.row.divider:not(:first)", this).children().appendTo($(this).find("div.row.divider:first"));
            if ($("div.row.divider:first > div:first", this).hasClass("span3")) {
                $("div.row.divider:first", this).parent().addClass("compact");
            }
            $("div.row.divider:not(:first)", this).hide();
        });
    } else {
        $("div.row.divider:not(:first)").children().appendTo("div.row.divider:first");
        $("div.row.divider:not(:first)").hide();
    }
}

// Renders the navbar logo; idempotent, so the settings panel can re-apply it live. The
// container also hosts the search box (setSearch), so hide_logo hides only the image.
// theme.logo is user data (settings -> DB): it reaches the DOM through .attr(), never
// through string-built markup or a composed <style> element. The old #login:before style
// injection is gone with the page it targeted (core's views/login.html has no #login).
function setLogo() {
    if ($("header.logo").length === 0) {
        $('<header class="logo"><div class="container-logo"></div></header>').insertBefore(".navbar-inner");
    }
    var container = $("header.logo .container-logo");
    var hide = !!(theme.features.hide_logo && theme.features.hide_logo.enabled);
    // Drop whichever logo node is present (img or inline svg); #search stays.
    container.children(".header__icon").remove();
    if (theme.logo && theme.logo.length) {
        // Custom uploaded logo: an <img>, shown as-is (never recoloured).
        var img = $('<img class="header__icon">').attr("src", "images/" + theme.logo);
        if (hide) img.hide();
        container.prepend(img);
        return;
    }
    // Default: inline the SVG wordmark so its .lg-mark/.lg-ring pick up the scheme
    // accent (css/nav.css). Inlined once, then cached; DOMParser keeps the SVG
    // namespace (jQuery's HTML parser would not). insertBefore #search if present.
    var mount = function (markup) {
        container.children(".header__icon").remove();
        var svg = document.importNode(
            new DOMParser().parseFromString(markup, "image/svg+xml").documentElement, true);
        svg.setAttribute("class", "header__icon");
        if (hide) svg.style.display = "none";
        container.prepend(svg);
    };
    if (setLogo._svg) { mount(setLogo._svg); return; }
    setLogo._pending = setLogo._pending || fetch("images/machinon/brand/logo.svg").then(function (r) { return r.text(); });
    setLogo._pending.then(function (t) { setLogo._svg = t; mount(t); });
}

/* Apply the user's dashboard background image (settings -> theme.background_img).
   Extracted from custom.js's ready block so the in-place settings reconcile
   (settings-store.js applyThemeDeltaInPlace) can re-run it when the
   Domoticz-stored value differs from what the defaults painted. An empty
   value sets no background, matching the original inline behavior (the defaults
   ship none). */
function applyBackground() {
    if (theme.background_img && theme.background_img.length) {
        var bg_url;
        if (theme.background_img.startsWith("http")) {
            bg_url = theme.background_img;
        } else {
            bg_url = "./images/" + theme.background_img;
        }
        $("html").addClass(theme.background_type);
        $("html").css("background-image", "url(" + bg_url + ")");
        $("body").attr("style", function(i, s) { return (s || "") + "background: transparent !important;"; });
    }
}

/* Toggle the navbar label suppression (navbar_icons_text feature). Extracted for
   the same in-place reconcile path; toggleClass so a live change either way is
   honored without a reload. */
function applyNavbarIconsText() {
    var feat = theme.features && theme.features.navbar_icons_text;
    $(".navbar").toggleClass("notext", !!feat && feat.enabled !== false);
}

// Core positions its device popups (index.html: rgbw_popup, setpoint_popup,
// thermostat3_popup, rfy_popup) at the raw click coordinates with no viewport clamping
// (js/domoticz.js, ShowRGBWPopupInt: top = mouseY, left = mouseX + 15), so a popup opened
// near the bottom or right edge is partly unreachable. Nudge it back into view whenever core
// shows or moves it. Mitigation for a core behavior; drop this when core clamps.
var corePopupClampArmed = false;
function clampCorePopups() {
    var CORE_POPUP_IDS = ["rgbw_popup", "setpoint_popup", "thermostat3_popup", "rfy_popup"];
    function nudgeIntoViewport(pop) {
        if (pop.style.display === "none") return;
        var r = pop.getBoundingClientRect();
        if (!r.width) return;
        // Already-clamped popups yield dx = dy = 0, so the style write below cannot loop.
        var dx = Math.min(0, window.innerWidth - 10 - r.right);
        var dy = Math.min(0, window.innerHeight - 10 - r.bottom);
        if (dx || dy) {
            pop.style.left = Math.max(10, r.left + dx + window.scrollX) + "px";
            pop.style.top = Math.max(10, r.top + dy + window.scrollY) + "px";
        }
    }
    CORE_POPUP_IDS.forEach(function (id) {
        var pop = document.getElementById(id);
        if (!pop) return;
        new MutationObserver(function () {
            nudgeIntoViewport(pop);
        }).observe(pop, { attributes: true, attributeFilter: ["style"] });
    });
    // Re-clamp on window resize too (debounced ~100ms, armFlyoutContainment's
    // idiom): a popup left open across a resize keeps coordinates computed for
    // the previous viewport size. Armed once; only popups core is currently
    // showing get touched. The resize nudge's own style write re-fires the
    // observer above, but a second nudge on an already-clamped popup is a
    // no-op (dx = dy = 0), so it settles immediately.
    if (corePopupClampArmed) return;
    corePopupClampArmed = true;
    var resizeTimer = null;
    window.addEventListener("resize", function () {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            CORE_POPUP_IDS.forEach(function (id) {
                var pop = document.getElementById(id);
                if (pop) nudgeIntoViewport(pop);
            });
        }, 100);
    });
}

// Bootstrap 2 opens a .dropdown-submenu's nested .dropdown-menu top-aligned with its
// trigger (bootstrap.css ".dropdown-submenu > .dropdown-menu { top: 0; left: 100%; }"),
// with no notion of the viewport below it. Fine while the trigger sits high enough for
// the (fixed-height) nested list to fit underneath, but Setup > "More options" sits low
// in a tall Setup list, and its own 19-item nested list (index.html ~1305-1343, the
// theme cannot edit this markup) runs off the bottom of the viewport regardless of
// window height: the trigger's own on-screen position determines the overflow, not the
// viewport height, so a taller window does not fix it. A CSS max-height clamp cannot
// work here (see css/nav.css, the comment above this dropdown-menu region): scoped to
// every ".dropdown-submenu > .dropdown-menu" it would also clip Plans/Data push's own
// third-level flyouts, which are themselves nested ".dropdown-submenu > .dropdown-menu".
// The trigger's on-screen position is config-dependent (HaveUpdate, EnableTabCustom
// change how many items sit above it), so no fixed CSS breakpoint can predict it; this
// measures the ACTUAL opened position and nudges it, the same technique
// clampCorePopups uses above for core's raw-positioned popups, generalized to a
// CSS-anchored submenu: adjust the same axis Bootstrap's own rule already uses (top),
// clamped so the list never simply trades a bottom overflow for a top one -- its
// content is fixed-height but shorter than every tested viewport at the sizes this
// theme targets, so there is normally room to fully resolve within that clamp. At a
// very short viewport the clamp itself saturates: once r.top - 10 would go negative
// the Math.max(0, ...) floor holds the shift at 0 (never negative -- never pushes the
// list further down), so past that point the list simply keeps whatever residual
// bottom overflow the viewport is too short to avoid; this is a deliberate "never make
// it worse" floor, not a bug. Class-toggle only where CSS truly cannot know the runtime
// position (three dropdown-submenu triggers total: More options, Plans, Data push --
// selector below covers all, future submenus adopt this for free.)
//
// Re-contained on window resize too (debounced ~100ms, same local-timer idiom
// devices.js's initDeviceObserver uses), not just on open: a flyout left open across a
// real resize (dragging the window edge, a devtools panel opening, a monitor/zoom
// change) keeps whatever "top" offset was computed for the PREVIOUS viewport size,
// which can under- or over-correct once the viewport actually changes. Only menus
// Bootstrap is currently showing (display !== "none") are touched; nothing recomputes
// for closed ones. clampCorePopups (above) re-arms across resizes the same way.
var flyoutContainmentArmed = false;
function armFlyoutContainment() {
    if (flyoutContainmentArmed) return; // re-entrancy guard: never double-bind
    flyoutContainmentArmed = true;

    var pairs = [];
    document.querySelectorAll(".navbar .dropdown-submenu > a").forEach(function (trigger) {
        var menu = trigger.nextElementSibling;
        if (!menu || !menu.classList.contains("dropdown-menu")) return;
        pairs.push(menu);
        trigger.addEventListener("mouseenter", function () {
            containFlyout(menu);
        });
    });

    var resizeTimer = null;
    window.addEventListener("resize", function () {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            pairs.forEach(function (menu) {
                if (getComputedStyle(menu).display !== "none") containFlyout(menu);
            });
        }, 100);
    });
}

function containFlyout(menu) {
    menu.style.top = "";
    // Below 980px (css/sidemenu.css) every nested .dropdown-menu is forced to
    // position:relative and renders in flow inside the mobile flyout's own
    // scroll panel, not as a floating overlay -- a viewport-relative nudge on
    // the CSS "top" offset does not apply to that layout; fail closed (no-op).
    if (getComputedStyle(menu).position !== "absolute") return;
    var r = menu.getBoundingClientRect();
    if (!r.height) return;
    var overflow = r.bottom - (window.innerHeight - 10);
    if (overflow > 0) {
        menu.style.top = -Math.min(overflow, Math.max(0, r.top - 10)) + "px";
    }
}

function setCustomIconsPage() {
    whenElementRenders("iconsmain", "#iconsmain #fileupload", function() {
        /* Already enhanced (the old 100ms poll never stopped in this case) */
        if ($("#iconsmain label.fileupload").length) return;

        $("#iconsmain #fileupload").parent().prepend('<label for="fileupload" class="fileupload btn btn-info">' + $.t("Upload") + "</label>");
        $("#iconsmain > div table:first").find("td:last").append($("#iconsmain > table td:last").children());
        $("#iconsmain #fileupload").on("change", function() {
            $(this).next().click();
            $(this).val("");
        });
    });
}

/* jQuery ajaxSuccess handler (registered in custom.js). It takes no arguments on
   purpose: nothing here is per-request. The cards a getdevices/getscenes response
   produces render in a later Angular digest, and the MutationObserver in devices.js
   already enhances them when they appear (the visible enhancement stage runs on every
   flush, the deferred stage follows within ~300ms, plus the mobile passes). */
function ajaxSuccessCallback() {
    setPageTitle();
}

/* ---- Layout facts, for the diagnostics artifact ----

   WHY THIS EXISTS. Most reports against this theme are about how a page LOOKS,
   and an artifact cannot see that. It does not need to: the reporter sends a
   screenshot, and a screenshot is good evidence of appearance. What a screenshot
   cannot carry is the environment that DECIDED the layout, and that is where
   these reports stall. Issue #188 was "squashed in Chrome, correct in Firefox";
   #200 was popups opening off-screen; a floorplan report had to have its
   overflow measured by hand before it could be answered at all. Zoom, device
   pixel ratio, a browser minimum font size, a webfont that failed to load and
   Windows high-contrast mode all rewrite a layout while leaving it looking
   deliberate.

   So this reports two things: facts that decide layout, and violations of
   invariants the theme's own CSS is supposed to hold, measured against the live
   tokens rather than against numbers copied out of a stylesheet.

   It runs ONLY when a snapshot is taken, never on a render pass, never on a
   timer, and holds nothing. Measured at 6-9ms on a full dashboard, of which the
   overflow culprit search is most of it, and that only runs when there IS an
   overflow. Nothing here observes, so a page nobody asks about pays nothing. */

/* Elements are named by tag and class, never by id or text: an id can carry a
   device idx (itemtable54) and text carries device names, and this artifact is
   meant to be safe to paste into a public issue. The class is what a maintainer
   needs anyway, since that is what the CSS is written against. */
function dzLayoutDescribe(el) {
    try {
        if (!el || !el.tagName) return "unknown";
        var cls = (el.className && el.className.toString ? el.className.toString() : "").trim();
        var parts = cls ? cls.split(/\s+/).slice(0, 3) : [];
        return el.tagName.toLowerCase() + (parts.length ? "." + parts.join(".") : "");
    } catch (e) { return "unknown"; }
}

/* Card widths reduced to the three numbers that diagnose a grid: the range, the
   median, and how many DISTINCT widths there are. A grid whose cards disagree by
   more than rounding is the "squashed cards" report, and the bucket count says
   so in one number without listing every card. */
function dzLayoutWidths(widths) {
    var sorted = (widths || []).slice().sort(function(a, b) { return a - b; });
    if (!sorted.length) return { cards_painted: 0, card_width: "none", width_buckets: 0, narrowest: null };
    var buckets = {};
    sorted.forEach(function(w) { buckets[Math.round(w / 4) * 4] = true; });
    return {
        cards_painted: sorted.length,
        card_width: sorted[0] + "-" + sorted[sorted.length - 1] +
                    " (median " + sorted[Math.floor(sorted.length / 2)] + ")",
        width_buckets: Object.keys(buckets).length,
        narrowest: sorted[0]
    };
}

function dzLayoutFacts() {
    var de = document.documentElement;
    var vv = window.visualViewport;
    var cs = getComputedStyle(de);
    var out = {};

    out.dpr = window.devicePixelRatio || 1;
    /* A phone's browser chrome is not part of innerHeight, and an emulated
       viewport has none at all, which is why a 100vh defect passes every
       headless check and fails on a real phone. The two disagreeing is the
       fact worth carrying. */
    out.visual_scale = vv ? Math.round(vv.scale * 100) / 100 : 1;
    out.chrome_px = vv ? Math.round(window.innerHeight - vv.height) : 0;
    /* Browser zoom and a per-user minimum font size both silently rewrite every
       layout the CSS assumes, and neither is visible in a screenshot. */
    out.root_font_px = parseFloat(cs.fontSize) || 0;
    out.body_font_px = parseFloat(getComputedStyle(document.body).fontSize) || 0;

    try {
        out.forced_colors = window.matchMedia("(forced-colors: active)").matches;
        out.prefers_contrast = window.matchMedia("(prefers-contrast: more)").matches;
        out.reduced_motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) { /* older engines: leave the three absent rather than guessed */ }

    /* A webfont that did not load moves every alignment in the theme, and the
       page still looks deliberate, just wrong. */
    try {
        out.fonts = document.fonts ? String(document.fonts.status) : "unknown";
        out.icon_font = document.fonts ? document.fonts.check("16px Ionicons") : false;
    } catch (e) { out.fonts = "error"; }

    /* Read from the live tokens, not from theme.json: what is measured is then
       what is PAINTED, which is the whole point of measuring at all. */
    var cardMin = parseFloat(cs.getPropertyValue("--dz-card-min-width")) || 0;
    var cardMax = parseFloat(cs.getPropertyValue("--dz-card-max-width")) || 0;
    out.card_bounds = cardMin + "-" + cardMax;

    var widths = [];
    Array.prototype.slice.call(document.querySelectorAll("#main-view .itemBlock")).forEach(function(card) {
        var w = card.getBoundingClientRect().width;
        if (w > 0) widths.push(Math.round(w));
    });
    var summary = dzLayoutWidths(widths);
    out.cards_painted = summary.cards_painted;
    out.card_width = summary.card_width;
    out.width_buckets = summary.width_buckets;

    out.gutter_px = window.innerWidth - de.clientWidth;
    var header = document.querySelector(".navbar-fixed-top");
    out.header_px = header ? Math.round(header.getBoundingClientRect().height) : 0;

    /* A user stylesheet or an extension rewriting the page is invisible to
       everyone except the reporter, and explains an otherwise impossible
       screenshot. Counted, never named: the name is the user's business. */
    var foreign = 0;
    try {
        Array.prototype.slice.call(document.styleSheets).forEach(function(sheet) {
            var href = sheet.href || "";
            if (href && href.indexOf(location.origin) !== 0) foreign += 1;
        });
    } catch (e) { /* cross-origin sheet: not ours to count */ }
    out.foreign_css = foreign;

    out.violations = dzLayoutViolations(out, cardMin);
    return out;
}

/* Invariants the theme's own CSS is supposed to hold. Each one is a thing a
   maintainer would otherwise have to ask the reporter to measure. */
function dzLayoutViolations(facts, cardMin) {
    var bad = [];
    try {
        /* Two pixels of slack: a card can round below its minimum through
           fractional grid maths without anything being wrong. */
        var summary = { narrowest: null };
        if (facts.cards_painted) {
            summary.narrowest = parseInt(String(facts.card_width).split("-")[0], 10);
        }
        if (cardMin && summary.narrowest && summary.narrowest < cardMin - 2) {
            bad.push("card_below_min: " + summary.narrowest + "px against --dz-card-min-width " + cardMin + "px");
        }

        var se = document.scrollingElement || document.documentElement;
        if (se.scrollWidth > se.clientWidth + 1) {
            /* The culprit search is the expensive half of this collector, so it
               runs only once an overflow is known to exist. */
            var worst = null, edge = se.clientWidth;
            Array.prototype.slice.call(document.querySelectorAll("#main-view *")).forEach(function(el) {
                var r = el.getBoundingClientRect();
                if (r.width > 0 && r.right > edge + 1) { edge = r.right; worst = el; }
            });
            bad.push("h_overflow: " + (se.scrollWidth - se.clientWidth) + "px, widest " +
                     dzLayoutDescribe(worst) + " to " + Math.round(edge) + "px");
        }

        /* Anything floating that paints outside the window, which is the shape
           of the floorplan popup report (#200). */
        Array.prototype.slice.call(document.querySelectorAll(
            ".dz-toast, #dz-set-chip, .ui-dialog, .dz-floorplan-popup, .dz-popup")).forEach(function(el) {
            var r = el.getBoundingClientRect();
            if (!r.width || getComputedStyle(el).display === "none") return;
            if (r.left < -1 || r.right > window.innerWidth + 1 || r.top < -1) {
                bad.push("offscreen: " + dzLayoutDescribe(el) + " at " + Math.round(r.left) + "," +
                         Math.round(r.top) + " " + Math.round(r.width) + "x" + Math.round(r.height));
            }
        });
    } catch (e) { bad.push("measure_failed: " + ((e && e.message) || e)); }
    return bad;
}

if (typeof dzDiagRegister === "function") {
    dzDiagRegister("layout", function() { return dzLayoutFacts(); });
}
