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
    $("#searchInput").val("");

    if (location.hash == "#/Dashboard" && !isMobile || location.hash == "#/LightSwitches" || location.hash == "#/Scenes" || location.hash == "#/Temperature" || location.hash == "#/Weather" || location.hash == "#/Utility") {
        $("#search").removeClass("readonly");
    } else {
        $("#search").addClass("readonly");
    }
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
        $('<header class="logo"><div class="container-logo"><img class="header__icon"></div></header>').insertBefore(".navbar-inner");
    }
    var img = $("header.logo img.header__icon");
    img.attr("src", "images/" + (theme.logo && theme.logo.length ? theme.logo : "logo.png"));
    img.toggle(!(theme.features.hide_logo && theme.features.hide_logo.enabled));
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

function ajaxSuccessCallback(event, xhr, settings) {
    setPageTitle();

    /* No per-request enhancement here for getdevices/getscenes: the cards
       those responses produce render in a later Angular digest, and the
       MutationObserver in devices.js already enhances when they appear
       (the visible enhancement stage runs on every flush, the deferred stage
       follows within ~300ms, plus the mobile passes). */
    if (settings.url.startsWith("json.htm?type=command&param=switchscene")) {
        let id = settings.url.split("&")[2];
        id = id.substr(4);
        let scene = $(".item#" + id);
        let statusElem = scene.find("#status .wrapper");
        statusElem.hide();
        let switcher = statusElem.parent().siblings(".switch").find("input");
        if (switcher.length) {
            let statusText = settings.url.split("&")[3];
            statusText = statusText.substr(10);
            switcher.attr("checked", statusText == "On");
        }
    }
}
