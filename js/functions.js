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

function setColorScheme() {
    var html = document.documentElement;
    if (theme.features.custom_color_scheme && theme.features.custom_color_scheme.enabled === true) {
        clearCustomColorScheme();
        applyCustomColorScheme(theme.color_scheme);
        html.setAttribute('data-dz-scheme', 'custom');
    } else {
        clearCustomColorScheme();
        if (theme.features.dark_theme && theme.features.dark_theme.enabled) {
            html.setAttribute('data-dz-scheme', 'dark');
        } else {
            html.removeAttribute('data-dz-scheme');
        }
    }
}

// Read the current base scheme's DEFAULT palette straight from the --dz-* tokens (single source of
// truth in dz-tokens.css / dark.css), so the theme-settings "reset scheme" button no longer needs a
// duplicated JS colour map. Temporarily strips any active custom-colour override and forces the base
// (light/dark) scheme attribute, reads the resolved tokens, then restores the real scheme via
// setColorScheme(). All synchronous, so no repaint happens between - the user sees no flicker.
function getSchemeDefaults() {
    var html = document.documentElement;
    clearCustomColorScheme();
    if (theme.features.dark_theme && theme.features.dark_theme.enabled) {
        html.setAttribute('data-dz-scheme', 'dark');
    } else {
        html.removeAttribute('data-dz-scheme');
    }
    var cs = getComputedStyle(html);
    var v = function (t) { return cs.getPropertyValue(t).trim(); };
    var defaults = {
        bg:       v('--dz-body-bg'),
        main:     v('--dz-accent-color'),
        navbar:   v('--dz-nav-bg'),
        item:     v('--dz-widget-bg'),
        text:     v('--dz-body-text'),
        alt_text: v('--secondary-text-color'),
        disabled: v('--dz-status-disabled')
    };
    setColorScheme();
    return defaults;
}

// --dz-* tokens the custom colour scheme may override (used to clear them on a scheme switch).
var DZ_CUSTOM_TOKENS = [
    '--dz-body-bg', '--dz-body-text', '--dz-nav-bg', '--dz-widget-bg', '--dz-widget-text',
    '--dz-accent-color', '--dz-input-border', '--dz-status-disabled', '--dz-accent-red',
    '--dz-btn-success-bg', '--dz-btn-warning-bg', '--secondary-text-color', '--dz-accent-values'
];

// Apply the user's custom colours as --dz-* overrides on <html> via setProperty.
// setProperty validates the value and cannot break out of the property, and hexToRGB reduces
// input to a numeric rgb(n,n,n), so untrusted theme.color_scheme values (settings -> DB) cannot
// inject CSS rules. Never compose a <style> element's text from these values.
function applyCustomColorScheme(cs) {
    var s = document.documentElement.style;
    var set = function (token, val) { if (val) { s.setProperty(token, hexToRGB(val)); } };
    set('--dz-body-bg', cs.background);
    set('--dz-body-text', cs.main_text);
    set('--dz-nav-bg', cs.navbar);
    set('--dz-widget-bg', cs.item);
    set('--dz-widget-text', cs.main_text);
    set('--dz-accent-color', cs.main_color);
    set('--dz-input-border', cs.border);
    set('--dz-status-disabled', cs.disabled);
    set('--dz-accent-red', cs.error);
    set('--dz-btn-success-bg', cs.success);
    set('--dz-btn-warning-bg', cs.warning);
    set('--secondary-text-color', cs.alt_text);
    if (cs.main_color) { s.setProperty('--dz-accent-values', hexToRGB(cs.main_color, true)); }
}

function clearCustomColorScheme() {
    var s = document.documentElement.style;
    for (var i = 0; i < DZ_CUSTOM_TOKENS.length; i++) { s.removeProperty(DZ_CUSTOM_TOKENS[i]); }
}

// Apply the user's card width settings as --dz-card-* overrides on <html> (consumed by the
// auto-fill grids in css/cards.css). parseInt reduces the stored value to a number before it
// reaches setProperty, so a non-numeric setting cannot inject CSS. Values are clamped to the
// same ranges as the settings inputs (the input min/max attributes do not stop typed or
// imported values); a non-numeric value falls back to the dz-tokens.css defaults by removing
// the override, and max is raised to min so the pair can never invert.
function applyCardWidths() {
    var s = document.documentElement.style;
    var clamp = function (v, lo, hi) {
        v = parseInt(v, 10);
        return isNaN(v) ? NaN : Math.min(Math.max(v, lo), hi);
    };
    var min = clamp(theme.card_min_width, 200, 800);
    var max = clamp(theme.card_max_width, 250, 1200);
    if (!isNaN(min) && !isNaN(max) && max < min) { max = min; }
    if (min > 0) { s.setProperty("--dz-card-min-width", min + "px"); } else { s.removeProperty("--dz-card-min-width"); }
    if (max > 0) { s.setProperty("--dz-card-max-width", max + "px"); } else { s.removeProperty("--dz-card-max-width"); }
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

function setSearch() {
    $('<div id="search"><input type="text" id="searchInput" autocomplete="off" onkeyup="searchFunction()" placeholder="Name, Desc, Idx, Status" title="' + language.type_to_search + '"><i class="ion-md-search"></i></div>').appendTo(".container-logo");
    window.addEventListener("keydown",function (e) {
        if (e.keyCode === 114 || (e.ctrlKey && e.keyCode === 70)) {
            $("#searchInput").focus();
            e.preventDefault();
        }
    })
    $("#search").click(function() {
        $("#searchInput").focus();
    });
    $("#searchInput").keyup(function(event) {
        if (event.keyCode === 13) {
            $("#searchInput").blur();
        }
        if (event.keyCode === 27) {
            $("#searchInput").val("");
            $("#searchInput").keyup();
        }
    });

}

function searchFunction() {
    var value = $("#searchInput").val().toLowerCase();
    $("div .item").each(function() {
        var element = $(this);
        if ($("#dashcontent").length || $("#weatherwidgets").length || $("#tempwidgets").length) {
            element = $(this).parent();
        }
		if ($("#dashcontent").length){
			var visibility = $(this).find("#name").html().toLowerCase().indexOf(value) > -1;
			element.toggle(visibility);
		}else{
			var visibility = $(this).find("#name").attr('data-search').toLowerCase().indexOf(value) > -1;
			element.toggle(visibility);
		}
    });
    $("div.row.divider, #dashcontent div.row").show();
    $("section").show();
    if (value.length) {
        removeEmptySectionDashboard();
    }
}

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
    if (location.hash == "#/Setup") {
        showThemeSettings();
    }
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

function removeEmptySectionDashboard() {
    $("#dashcontent section").each(function() {
        $(this).show();
        if (!$(this).children("div.row").children(":visible").length) {
            $(this).hide();
        }
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
       MutationObserver in custom.js already re-enhances when they appear
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

function hexToRGB(h, values_only) {
    // Handle undefined or invalid input
    if (!h || typeof h !== 'string') {
        return values_only ? "0,0,0" : "rgb(0,0,0)";
    }
    
    let r = 0, g = 0, b = 0;

    // 3 digits
    if (h.length == 4) {
        r = "0x" + h[1] + h[1];
        g = "0x" + h[2] + h[2];
        b = "0x" + h[3] + h[3];

    // 6 digits
    } else if (h.length == 7) {
        r = "0x" + h[1] + h[2];
        g = "0x" + h[3] + h[4];
        b = "0x" + h[5] + h[6];
    }

    if (values_only === true) 
        return +r + "," + +g + "," + +b;
    else 
        return "rgb("+ +r + "," + +g + "," + +b + ")";
}
