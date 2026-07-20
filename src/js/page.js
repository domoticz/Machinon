/* Page chrome and navigation: hash-route reactions, page title, logo,
   dashboard row merging, core-popup clamping, and the shared one-shot DOM
   waiter the other modules use instead of polling. */

/* One-shot DOM waiters: run fn once selector matches, immediately or when it
   renders. A repeated call with the same key re-arms the waiter instead of
   stacking a second one. Replaces the per-feature polling loops, which kept
   timers spinning for the whole session when their element never appeared. */
var domWaiters = {};
function whenElementRenders(key, selector, fn) {
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
    /* #/Setup needs no theme hook anymore: the injected Theme tab is gone
       (Task 8); theme settings live in the hub (src/js/theme-hub.js), a click
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
   (settings-store.js applyThemeDeltaInPlace, perf-report F3) can re-run it when
   the Domoticz-stored value differs from what the defaults painted. An empty
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
function clampCorePopups() {
    ["rgbw_popup", "setpoint_popup", "thermostat3_popup", "rfy_popup"].forEach(function (id) {
        var pop = document.getElementById(id);
        if (!pop) return;
        new MutationObserver(function () {
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
        }).observe(pop, { attributes: true, attributeFilter: ["style"] });
    });
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
       MutationObserver in devices.js already re-enhances when they appear
       (setAllDevicesFeatures on unprocessed items, plus the mobile passes). */
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
