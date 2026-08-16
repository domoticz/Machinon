/* SelectorStyle-1 popup containment: app/widgets/dzLightWidget.js (core) opens
   the level dropdown as a jQuery UI selectmenu with no `position` option of
   its own ($select.selectmenu({width: false, change: ...})), so the widget
   falls back to ITS OWN default in jquery-ui.min.js (ui/widgets/selectmenu.js):
   `position: {my: "left top", at: "left bottom", collision: "none"}`. "none"
   is jQuery UI's own explicit choice, not core disabling anything -- but it
   means $.position's built-in viewport collision handling (flip/fit) never
   engages, so a popup opened low on a short/scrolled viewport runs off the
   bottom uncorrected.

   Fixed at the cause, not with a position-nudge fallback (armFlyoutContainment/
   clampCorePopups's pattern, src/js/page.js): this default is a WIDGET-LEVEL setting on
   $.ui.selectmenu.prototype.options, reachable from theme JS before any card ever opens
   one, so re-pointing it here engages jQuery UI's OWN collision math instead of
   reimplementing viewport arithmetic ourselves. "flip" (the popup re-opens ABOVE its
   button instead, fully contained) is the well-known fix for this exact upstream default
   (jquery/jquery-ui#1272); jQuery UI's own $.position() then recomputes fresh on every
   open() call, so this needs no resize-while-open listener the way the flyout nudge does
   -- there is nothing to re-arm, every open is a new position() call. One assignment,
   safe to call more than once (idempotent), so unlike armFlyoutContainment there is no
   re-entrancy guard to write.

   MUST run before the first card's initWidgets() calls .selectmenu() -- true for every
   caller today: jquery-ui.min.js loads synchronously ahead of custom.js
   (index.html), and custom.js's THEME_MODULES (this file included) finish executing
   before Angular ever boots (custom.js's own comment on THIS_BLOCK_MUST_STAY_AT_TOP
   documents the same ordering guarantee) -- long before any device card can render a
   .selectorlevels select. The $.ui.selectmenu guard below is defensive only: this file
   loads unconditionally, but there is no contract that jquery-ui.min.js always ships the
   selectmenu widget (a future core swap-out is not this theme's problem to crash on). */
function patchSelectMenuCollision() {
    if (!$.ui || !$.ui.selectmenu) return;
    $.ui.selectmenu.prototype.options.position.collision = "flip";
}

function setDevicesNativeSelectorForMobile() {
    if (!isMobile) return;
    $(".selectorlevels span.ui-selectmenu-button").each(function() {
        $(this).hide();
        var selectorId = $(this).attr("id").split("-", 1)[0];
        $("#" + selectorId + ":not(.ui-widget)").on("change", function(e) {
            var selected = $(this).children("option:selected");
            SwitchSelectorLevel($(this).attr("data-idx"), selected.text(), selected.val());
        });
        $("#" + selectorId).addClass("ui-widget ui-corner-all").show();
    });
}

function setCorrectDashboardLinksforMobile() {
    if (!isMobile) return;
    $("table.mobileitem td#name > img").each(function() {
        var script = $(this).attr("onclick");
        $(this).wrap('<a onclick="' + script + '"></a>');
    });
}

/* Localized switch state labels, shared by every consumer (switch.js and the
   helpers below). Per-tick memo: $.t lookups are cheap but not free at 138
   cards x several calls. Cleared on the next macrotask so late i18n init
   can never freeze untranslated labels (the reason switchLabels recomputes
   at all). */
var dzLabelsMemo = null;
function switchLabels() {
    if (dzLabelsMemo) return dzLabelsMemo;
    dzLabelsMemo = {
        on: $.t("On"),
        off: $.t("Off"),
        open: $.t("Open"),
        closed: $.t("Closed")
    };
    setTimeout(function() { dzLabelsMemo = null; }, 0);
    return dzLabelsMemo;
}

/* Core's toggleability vocabulary, mirrored from dzLightWidget.js
   (isRegularSwitch/deviceIconClick): these SwitchTypes render a clickable
   icon, but the click is a special action, not an On/Off toggle. A theme
   toggle on them lies about state or fires the wrong command outright: a
   Smoke Detector click ALWAYS sends On (triggers the alarm), push buttons
   are momentary, door locks key their state off InternalState and their
   Locked/Unlocked status breaks the checked mapping, a doorbell click
   rings it. Sensors (contacts, motion, dusk) are read-only. */
var NON_TOGGLE_SWITCH_TYPES = [
    "Doorbell",
    "Push On Button",
    "Push Off Button",
    "Door Contact",
    "Contact",
    "Motion Sensor",
    "Smoke Detector",
    "Dusk Sensor",
    "Door Lock",
    "Door Lock Inverted",
    "Security Panel",
    "Media Player"
];

/* The device object core bound to this card's widget scope. Every card
   surface (classic pages, Dynamic Dashboard tiles and its Favorites/Room
   widgets) renders through an Angular-compiled dzLightWidget, so the
   scope is reachable from the .item element; scenes expose no device and
   return undefined here on purpose. */
function getCardDevice(item) {
    var el = item.closest(".item")[0];
    var scope = (typeof angular !== "undefined" && el) ? angular.element(el).scope() : null;
    return scope ? (scope.device || (scope.ctrl && scope.ctrl.device)) : null;
}

/* Switch-detection gate, shared by the initial pass below and the
   MutationObserver re-enhance pass (initDeviceObserver). A card is a plain
   on/off switch when core's device data says its SwitchType actually
   toggles, its icon is clickable (lcursor), and it carries no dimmer
   slider, selector levels or button group. The DOM heuristics alone are
   NOT sufficient: core marks special-action icons clickable too (see
   NON_TOGGLE_SWITCH_TYPES), so an unreachable scope FAILS CLOSED. The only
   cards without a device scope are scenes (which have their own gated
   branches and are rejected by the #img heuristic anyway) and cards probed
   mid-render: after a drag drop core re-renders the whole list
   (ShowLights) and the fresh cards' scopes attach a beat after the DOM
   lands, so a DOM-only fallback would re-grow toggles on smoke detectors in
   that window. A real switch rejected in that window is picked up by the
   next observer pass once its scope is bound. */
function isPlainOnOffSwitch(item) {
    var device = getCardDevice(item);
    if (!device) return false;
    if (device.Type === "Security" ||
        NON_TOGGLE_SWITCH_TYPES.indexOf(device.SwitchType) !== -1) {
        return false;
    }
    return item.find("#bigtext").siblings("#img").find("img").hasClass("lcursor") &&
        item.find(".dimslider").length === 0 &&
        item.find(".selectorlevels").length === 0 &&
        item.find(".btn-group").length === 0;
}

/* A card is in light-switch context on the Light/Switches page, or on the
   Dashboard when inside a light_* group, or on a Dynamic Dashboard tile or
   its Favorites widget (.dd-dz-favorites re-renders the classic cards
   WITHOUT the .dd-dz-inner wrapper). Neither container has a light_ parent
   id, so a binary On/Off status is also required there to avoid toggling
   sensors (e.g. temperature) that pass the icon heuristics. */
function isLightSwitchContext(item, status) {
    var parentId = item.parent().attr("id") || "";
    var inDynamicDashboard = (item.closest(".dd-dz-inner").length > 0 || item.closest(".dd-dz-favorites").length > 0) &&
        (status === "On" || status === "Off");
    return ((location.hash === "#/Dashboard") && (parentId.startsWith("light") || inDynamicDashboard)) ||
        (location.hash === "#/LightSwitches");
}

/* Status for setDeviceSwitch: visible bigtext, else its data-status, else
   inferred from the icon filename (an earlier enhancement pass may have
   emptied the bigtext, and push buttons on the Dynamic Dashboard render
   with no text at all). The icon speaks only when its filename actually
   carries a state: inventing "Off" for stateless icons would put toggles
   on text sensors. */
function readSwitchStatus(item) {
    var bigText = item.find("#bigtext");
    var status = bigText.text().trim();
    if (!status) status = (bigText.attr("data-status") || "").trim();
    if (!status) {
        var imgSrc = bigText.siblings("#img").find("img").attr("src") || "";
        if (imgSrc.indexOf("_On") > -1) { status = "On"; }
        else if (imgSrc.indexOf("_Off") > -1) { status = "Off"; }
    }
    return status;
}

/* Wrap-corner tagging for the joined Selector-level segmented control
   (SelectorStyle 0, css/cards.css ".item .btn-group:not(.span3 *)"). CSS
   has no selector for "the first/last button of a particular wrapped flex
   row" (flex-wrap only resets its line breaks at layout time, so there is
   nothing static to select on -- css/cards.css's own comment on the shell
   rule documents the same structural limit for its ~2px wrapped-row
   seam), so deciding which button needs which corner radius at a wrap is
   fundamentally a JS-only question. Tags every button that sits at a true
   convex corner of the STAIR-STEP silhouette (never the shell's bounding
   box) with the corner(s) it actually needs:

   - the LAST button of the FIRST (topmost) row -- data-wrap-corner-tr,
     always tagged when a wrap happened: the shell's top-right corner,
     always exterior regardless of row width, since the first row is
     always exactly as wide as the shell itself.
   - the FIRST button of the LAST (bottommost) row -- data-wrap-corner-bl,
     always tagged when a wrap happened, UNCONDITIONALLY: this rule rounds
     a REAL BUTTON's own corner, which can never paint empty space
     regardless of where the shell's bounding box happens to extend to, so
     the corner is always a genuine convex exterior point of the
     silhouette whenever this button is first in a wrapped row, narrower
     last row or not.
   - the LAST button of the LAST (bottommost) row (always the group's true
     :last-child too) -- data-wrap-corner-br, tagged when a wrap happened,
     to SQUARE its top-right corner. buttons.css's plain ":last-child"
     rule rounds BOTH right corners unconditionally (correct for the
     unwrapped single-row case, where both really are exterior), but when
     wrapped, this button's top-right is an INTERIOR SEAM against the row
     above, not an exterior corner -- left rounded, it pinches the joined
     right edge inward ~10px right at the row seam instead of staying a
     continuous straight line down to the true bottom-right corner. The
     css/cards.css rule this tag drives forces top-right back to 0 and
     restates bottom-right explicitly (still the family radius, still a
     true exterior corner, unaffected) rather than leaving that property
     to fall through to the lower-specificity :last-child rule.

   The one corner that never needs tagging: the group's true :first-child
   (top-left) is already handled by the existing first-child CSS rule,
   untouched by this function, in both the wrapped and unwrapped case.

   FAIL CLOSED: an untagged button simply stays at whatever buttons.css's
   plain first/last-child/interior rules already give it -- if this
   function never runs for some reason (a code path that skips it, or a
   future regression), the worst case is a plain square top-right/bottom-left
   corner, or the seam pinch: nothing this function does can ever paint a
   rounded outline around empty space, since every rule it drives targets
   an actual rendered button.

   Idempotent and safe to call repeatedly: clears its own tags before
   recomputing every time, so a re-run after a resize or a content change
   never leaves a stale tag on the wrong button. Called from
   dzRunDevicePass("deferred") (the tail of both setAllDevicesFeatures'
   back-compat synchronous run and the coalesced idle pass dzScheduleDeferredPass
   arms after every flush, whose own try/catch means a throw here can never
   skip the observer's takeRecords() drain after it), and from
   armSelectorWrapCornerRetag's debounced window resize listener below, since
   wrap state depends on viewport/tile width and can change with no DOM
   mutation for the MutationObserver in initDeviceObserver to catch. */
function retagSelectorWrapCorners() {
    $("#main-view .item .btn-group").each(function() {
        var $shell = $(this);
        if ($shell.closest(".span3").length) return; // compact dashboard: css/cards.css excludes it identically

        var $btns = $shell.children(".btn");
        $btns.removeAttr("data-wrap-corner-tr").removeAttr("data-wrap-corner-bl").removeAttr("data-wrap-corner-br");
        if ($btns.length < 2) return;

        /* Group by row via offsetTop, shell-relative (the shell carries
           position:relative, css/cards.css) so this needs no viewport-
           relative getBoundingClientRect math. Rounded to the nearest
           pixel: sub-pixel layout can otherwise split one visual row into
           two row-buckets that differ by a fraction of a pixel. */
        var rows = new Map(); // rounded offsetTop -> [button...]
        $btns.each(function() {
            var top = Math.round(this.offsetTop);
            if (!rows.has(top)) rows.set(top, []);
            rows.get(top).push(this);
        });
        if (rows.size < 2) return; // single row: no wrap, existing first/last-child CSS already correct

        var tops = Array.from(rows.keys()).sort(function(a, b) { return a - b; });
        var firstRow = rows.get(tops[0]).sort(function(a, b) { return a.offsetLeft - b.offsetLeft; });
        var lastRow = rows.get(tops[tops.length - 1]).sort(function(a, b) { return a.offsetLeft - b.offsetLeft; });

        firstRow[firstRow.length - 1].setAttribute("data-wrap-corner-tr", "");
        lastRow[0].setAttribute("data-wrap-corner-bl", "");
        lastRow[lastRow.length - 1].setAttribute("data-wrap-corner-br", "");
    });
}

/* Debounced window-resize re-arm for retagSelectorWrapCorners, same local-
   timer idiom + re-entrancy guard as page.js's armFlyoutContainment (100ms
   debounce, armed once). A pure window resize (dragging the browser edge,
   a devtools panel opening, a monitor/zoom change, mobile rotation) never
   mutates the DOM, so initDeviceObserver's MutationObserver-based re-
   enhance pass has nothing to fire on even though the selector's wrap
   state may have changed at the new width. */
var selectorWrapCornerResizeArmed = false;
function armSelectorWrapCornerRetag() {
    if (selectorWrapCornerResizeArmed) return;
    selectorWrapCornerResizeArmed = true;
    var resizeTimer = null;
    window.addEventListener("resize", function() {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(retagSelectorWrapCorners, 100);
    });
}

/* Stage-split enhancement (perf work 2026-08-16). "visible" is everything
   the user can see flip at paint time: data-idx tagging, the toggle swap,
   fade-off, custom/wind icons, status warning icons. "deferred" is work
   that is invisible until interacted with or low-urgency: the options
   menu build, the time-ago rewrite, selector wrap-corner retag; it runs
   in one coalesced idle callback per flush burst (dzScheduleDeferredPass).
   Every mutation stays guarded by its own marker, so both stages are
   idempotent per card and safe to re-run on every flush. */
function dzEnhanceDeviceCard($item, stage) {
    /* idx resolution: name attr, else parent id (dashboard groups), else own id */
    let idx = $item.find("#name").attr("data-idx");
    if (typeof idx === "undefined" || idx === "") {
        idx = $item.parent().attr("id");
        if (typeof idx === "undefined") {
            idx = $item.attr("id");
        } else {
            idx = idx.replace(/^\D+/g, "");
        }
    }
    var $trs = $item.find("tr");

    if (stage === "visible") {
        $trs.attr("data-idx", idx);
        $item.find("#name").removeAttr("title");

        var status = readSwitchStatus($item);

        setDeviceOpacity(idx, status, $trs);

        /* Switch instead of bigtext: same eligibility chain the old initial
           and re-enhance passes shared; readSwitchStatus is the superset
           status source the re-enhance pass already used (bigtext, then
           data-status, then a state-carrying icon filename). This branch
           now feeds that superset into setDeviceOpacity, so empty-bigtext
           cards with state-carrying _Off icons (Dynamic Dashboard) now fade
           where they previously never did, matching classic-page behavior. */
        if ($trs.find(".switch").length === 0) {
            var isGroupCard = $item.find("#img2").length > 0 &&
                ($item.parents("#scenecontent").length > 0 ||
                 $item.parents("#dashScenes").length > 0);
            if (isGroupCard && theme.features.switch_instead_of_bigtext_scenes.enabled === true) {
                setDeviceSwitch(idx, status);
                $item.find("#bigtext").hide();
            } else if ($item.find("#img2").length === 0 &&
                       isLightSwitchContext($item, status) &&
                       isPlainOnOffSwitch($item)) {
                if (theme.features.switch_instead_of_bigtext.enabled === true) {
                    setDeviceSwitch(idx, status);
                } else {
                    $item.find("#bigtext").show();
                }
            }
        }

        if (theme.features.icon_image.enabled === true) {
            setDeviceCustomIcon(idx, status, $trs);
        }
        if (theme.features.wind_direction.enabled === true) {
            setDeviceWindDirectionIcon(idx, undefined, $trs);
        }
        return;
    }

    /* deferred stage */
    if ($trs.find(".options-cell").length === 0) {
        setDeviceOptions(idx, $trs);
    }
    var lastupdateEl = $item.find("#lastupdate");
    /* setDeviceLastUpdate renders its non-time_ago marker as
       <i id='lastSeen' class='ion-ios-pulse'>, so this single class check
       already covers both branches' output. */
    var alreadyProcessed = lastupdateEl.find("i.ion-ios-pulse").length > 0;
    if (!alreadyProcessed) {
        var lastupd;
        if (theme.features.time_ago.enabled === true) {
            lastupd = lastupdateEl.text();
        } else {
            lastupd = moment(lastupdateEl.text(), ["YYYY-MM-DD HH:mm:ss", "L LT"]).format();
        }
        setDeviceLastUpdate(idx, lastupd, $trs);
    }
}

function dzRunDevicePass(stage) {
    $("#main-view .item").each(function() {
        dzEnhanceDeviceCard($(this), stage);
    });
    if (stage === "visible") {
        setAllDevicesIconsStatus();
    } else {
        retagSelectorWrapCorners();
    }
}

/* At most ONE pending deferred pass, keep-first: while one is pending,
   scheduling is a no-op, so the pass runs no later than ~300ms after the
   FIRST flush of a burst even if flushes keep coming (cancel-and-reschedule
   here would starve stage B for the whole storm, the same trap the
   two-timer debounce above exists to avoid). The pass scans the live DOM
   when it fires, so it covers every later burst too; a flush arriving
   while it RUNS re-arms, because the handle is cleared before the pass. */
var dzDeferredHandle = null;
function dzScheduleDeferredPass() {
    if (dzDeferredHandle !== null) return;
    var run = function() {
        dzDeferredHandle = null;
        try {
            dzRunDevicePass("deferred");
        } catch (e) {
            console.warn("deferred device pass threw", e);
        }
    };
    if (window.requestIdleCallback) {
        dzDeferredHandle = requestIdleCallback(run, { timeout: 300 });
    } else {
        dzDeferredHandle = setTimeout(run, 300);
    }
}

/* Back-compat single-shot: theme-hub.js re-enhances through this name after
   icon or feature changes, and it is the harnesses' probe point. */
function setAllDevicesFeatures() {
    dzRunDevicePass("visible");
    dzRunDevicePass("deferred");
}

function setAllDevicesIconsStatus() {
    $("div.item.statusProtected").each(function() {
        if ($(this).find("#name > i.ion-ios-lock").length === 0) {
            $(this).find("#name").prepend("<i class='ion-ios-lock' title='" + $.t("Protected") + "'></i>&nbsp;");
        }
    });
    $("div.item.statusTimeout").each(function() {
        if ($(this).find("#name > i.ion-ios-wifi").length === 0) {
            if (theme.features.notification.enabled === true) {
                // Noty renders its text as HTML; device names come from hardware/plugins,
                // so they must be escaped before entering the toast markup.
                var timeoutName = $("<span>").text($(this).find("#name").text()).html();
                generate_noty('warning', "Sensor " + timeoutName + " " + language.is + " " + language.timedout, 4000);
            }
            $(this).find("#name").prepend("<i class='ion-ios-wifi blink warning-text' title='" + $.t("Sensor Timeout") + "'></i>&nbsp;");
        }
    });
    $("div.item.statusLowBattery").each(function() {
        if ($(this).find("#name > i.ion-ios-battery-dead").length === 0) {
            if (theme.features.notification.enabled === true) {
                var batteryName = $("<span>").text($(this).find("#name").text()).html();
                generate_noty('warning', batteryName + ' ' + $.t("Battery Level") + ' ' + $.t("Low"), 4000)
            }
            $(this).find("#name").prepend("<i class='ion-ios-battery-dead blink warning-text' title='" + $.t("Battery Low Level") + "'></i>&nbsp;");
        }
    });
}

/* $trs: the card's own tr set when the caller already holds it (the
   enhancement passes), else resolved by idx (live-update handlers). The
   global query is O(all cards) per call, which made the initial pass
   O(n^2) at page size. */
function setDeviceOptions(idx, $trs) {
    var rows = ($trs && $trs.length) ? $trs : $("tr[data-idx='" + idx + "']");
    rows.each(function() {
        /* Create options menu */
        let subnav = $(this).find(".options");
        let subnavButton = $(this).find(".options-cell");
        if (subnav.length && subnavButton.length == 0) {
            /* Display idx in the options */
            $(subnav).append('<a class="btnsmall" id="idno"><i>Idx: ' + idx + "</i></a>");
            $(this).append('<td class="options-cell" title="' + $.t("More options") + '"><i class="ion-md-more"></i></td>');
            $(this).on("click", "td.options-cell", function(e) {
                e.preventDefault();
                $(this).siblings("td.options").slideToggle(400);
                $(this).siblings("td.options").unbind("mouseleave");
                $(this).siblings("td.options").mouseleave(function() {
                    $(this).slideToggle(400);
                    $(this).unbind("mouseleave");
                });
            });
            $(this).append('<td class="timers_log"></td>');
            var timers = $(this).find(".timers_log");
            $(timers).append($(this).find('.options .btnsmall[data-i18n="Log"]').html("<i class='ion-ios-stats' title='" + $.t("Log") + "'></i>"));
            $(timers).append($(this).find('.options .btnsmall[href*="Log"]:not(.btnsmall[data-i18n="Log"])').html("<i class='ion-ios-stats' title='" + $.t("Log") + "'></i>"));
            $(timers).append($(this).find('.options .btnsmall[data-i18n="Timers"]').html("<i class='ion-ios-timer disabledText' title='" + $.t("Timers") + "'></i>"));
            $(timers).append($(this).find('.options .btnsmall-sel[data-i18n="Timers"]').html("<i class='ion-ios-timer' title='" + $.t("Timers") + "'></i>"));
            /* Check favorite state from Angular scope (ng-hide timing unreliable) */
            var itemEl = $(this).closest('.item')[0] || $(this).parents('.item')[0];
            var scope = (typeof angular !== "undefined" && itemEl) ? angular.element(itemEl).scope() : null;
            var device = scope?.device || scope?.ctrl?.device || scope?.item;
            var isFavorite = device ? device.Favorite !== 0 : false;
            var icon;
            if (isFavorite) {
                icon = '<i class="ion-ios-star lcursor" title="' + $.t("Remove from Dashboard") + '"></i>';
            } else {
                icon = '<i class="ion-ios-star-outline lcursor" title="' + $.t("Add to Dashboard") + '"></i>';
            }
            var favTd = $('<td class="favorite">' + icon + "</td>");
            favTd.on("click", function() {
                /* Re-read current state at click time, not creation time */
                var currentScope = angular.element(itemEl).scope();
                var currentDevice = currentScope?.device || currentScope?.ctrl?.device || currentScope?.item;
                var currentlyFav = currentDevice ? currentDevice.Favorite !== 0 : false;
                /* Find core's favorite toggle img by its ng-click action, which is
                   stable across markups: upstream fdab5e10c changed the wrapping
                   spans from ng-show to ng-if, so presentation attributes cannot be
                   relied on. With ng-if only the current state's img is in the DOM.
                   Matched without the first letter: light widgets call
                   makeFavorite(n), weather/temperature call MakeFavorite(n). */
                var clickTarget = currentlyFav
                    ? rows.find('.options img[ng-click*="akeFavorite(0)"]')
                    : rows.find('.options img[ng-click*="akeFavorite(1)"]');
                if (!clickTarget.length) { return; }
                clickTarget.click();
                /* Update star icon after toggle (only when the toggle really fired,
                   otherwise the star would lie about the stored state) */
                var $icon = $(this).find("i");
                if (currentlyFav) {
                    $icon.removeClass("ion-ios-star").addClass("ion-ios-star-outline").attr("title", $.t("Add to Dashboard"));
                } else {
                    $icon.removeClass("ion-ios-star-outline").addClass("ion-ios-star").attr("title", $.t("Remove from Dashboard"));
                }
            });
            $(this).append(favTd);
        }
    });
}

/* $trs: the card's own tr set when the caller already holds it (the
   enhancement passes), else resolved by idx (live-update handlers). The
   global query is O(all cards) per call, which made the initial pass
   O(n^2) at page size. */
function setDeviceCustomIcon(idx, status, $trs) {
    var switchState = switchLabels();
    var rows = ($trs && $trs.length) ? $trs : $("tr[data-idx='" + idx + "']");

    var icons = theme.icons;
    for (var i = 0; i < icons.length; i++) {
        if (icons[i].idx == idx) {
            rows.find("#img img").attr("src", "images/" + icons[i].img);
            /* Mutually exclusive: the visible stage re-runs this on every
               flush now, so a device that changes state must drop the other
               class or it accumulates both, and custom.css's .user rule
               (opacity: 0.4) permanently dims an On device's icon. */
            if (status == switchState.on || status == 'On') {
                rows.find("#img img").removeClass("user").addClass("userOn");
            } else {
                rows.find("#img img").removeClass("userOn").addClass("user");
            }
        }
    }
}

/* Core names its wind icons Wind<DIR>.png with an uppercase compass direction;
   match that shape exactly. The old substring selector ([src*='Wind']) hijacked
   ANY icon containing "Wind": a device with the built-in Window picker icon got
   rewritten to images/wind-direction/Window48_On.png, a 404. */
/* $trs: the card's own tr set when the caller already holds it (the
   enhancement passes), else resolved by idx (live-update handlers). The
   global query is O(all cards) per call, which made the initial pass
   O(n^2) at page size. */
function setDeviceWindDirectionIcon(idx, direction, $trs) {
    var rows = ($trs && $trs.length) ? $trs : $("tr[data-idx='" + idx + "']");
    rows.find("#img img").each(function() {
        var src = $(this).attr("src") || "";
        if (direction === undefined) {
            var m = src.match(/images\/Wind([A-Z]{1,3})\.png$/);
            if (!m) { return; }
            $(this).attr("src", 'images/wind-direction/Wind' + m[1] + '.png');
        } else if (/images\/(wind-direction\/)?Wind[A-Z]{1,3}\.png$/.test(src)) {
            $(this).attr("src", 'images/wind-direction/Wind' + direction + '.png');
        }
    });
}

/* $trs: the card's own tr set when the caller already holds it (the
   enhancement passes), else resolved by idx (live-update handlers). The
   global query is O(all cards) per call, which made the initial pass
   O(n^2) at page size. */
function setDeviceLastUpdate(idx, lastupdate, $trs) {
    /* Strip "Last Seen:" or similar prefix - extract date portion */
    if (typeof lastupdate === "string") {
        var dateMatch = lastupdate.match(/\d{4}[-/]\d{2}[-/]\d{2}[\sT]\d{2}:\d{2}:\d{2}/);
        if (dateMatch) lastupdate = dateMatch[0];
    }

    /* If browser is a bit late, avoid future date */
    if (moment(lastupdate).isAfter(moment()))
        lastupdate = moment();

    var rows = ($trs && $trs.length) ? $trs : $("tr[data-idx='" + idx + "']");
    rows.each(function() {
        let lastupdateEl = $(this).find("#lastupdate");
        /* Core renders its bar-ranges strip (<dz-bar>, views/widgets/utility_widget.html)
           inside this same cell. Rewriting the cell with .html()/.text() destroys that live
           Angular element, so detach it first and put it back after. */
        let barEl = lastupdateEl.children("dz-bar").detach();
        if (theme.features.time_ago.enabled === true) {
            /* Modify existing #lastupdate in-place instead of creating new #timeago */
            let livestampSpan = lastupdateEl.find("span[data-livestamp]");
            if (livestampSpan.length === 0) {
                lastupdateEl.html('<i class="ion-ios-pulse"></i> <span data-livestamp="' + moment(lastupdate).format() + '" title="' + moment(lastupdate).format("L LT") + '"></span>');
            } else {
                livestampSpan.attr("title", moment(lastupdate).format("L LT"));
                livestampSpan.livestamp(moment(lastupdate).format());
            }
        } else {
            var lastupd = moment(lastupdate);
            lastupd.locale(window.navigator.language);
            lastupdateEl.attr("title", $.t("Last Seen"));
            lastupdateEl.text(lastupd.format("L LT"));
            if (lastupdateEl.find("#lastSeen").length === 0) {
                lastupdateEl.prepend("<i id='lastSeen' class='ion-ios-pulse'></i> ");
            }
        }
        if (barEl.length) { lastupdateEl.prepend(barEl); }
    });
}

/* $trs: the card's own tr set when the caller already holds it (the
   enhancement passes), else resolved by idx (live-update handlers). The
   global query is O(all cards) per call, which made the initial pass
   O(n^2) at page size. */
function setDeviceOpacity(idx, status, $trs) {
    var switchState = switchLabels();

    if (theme.features.fade_off_items.enabled === true) {
        var rows = ($trs && $trs.length) ? $trs : $("tr[data-idx='" + idx + "']");
        if (status === switchState.off  || status === 'Off' || status === switchState.closed || status === 'Closed') {
            rows.parents(".item").addClass("fadeOff");
        } else {
            rows.parents(".item").removeClass("fadeOff");
        }
    }
}

/* Live device/scene updates pushed by core through $rootScope (websocket).
   Registered once by the bootstrap (custom.js) as soon as Angular is up. */
function initDeviceLiveUpdates($scope) {
    $scope.$on('device_update', function (event, data) {
        searchFunction();
        if (data.Type === "Light/Switch") {
            setDeviceOpacity(data.idx, data.Status);
            if (theme.features.icon_image.enabled === true) {
                /* We have to delay it a few otherwise it's get overwritten by standard icon */
                setTimeout(setDeviceCustomIcon, 10, data.idx, data.Status);
            }
        }
        /* Sync EXISTING toggles only, on any device type. Creation stays with
           the enhancement passes, which check page context and switch type:
           gating creation here on Type === "Light/Switch" + SwitchType ===
           "On/Off" would create toggles without those checks and leave every
           other toggleable type (X10 Siren, Lighting 2 on/off) stale on
           remote state changes. */
        if (theme.features.switch_instead_of_bigtext.enabled === true &&
            $("tr[data-idx='" + data.idx + "'] .switch").length > 0) {
            setDeviceSwitch(data.idx, data.Status);
        }
        if (data.Type.startsWith("Temp") || (data.Type === "Wind")) {
            /* Temp/Wind widgets are all refreshed, we need to format them again after a delay */
            setTimeout(function() {
                $("dzweatherwidget[id='" + data.idx + "']").find("tbody > tr").each(function() {
                    $(this).attr("data-idx", data.idx);
                });
                $("dztemperaturewidget[id='" + data.idx + "']").find("tbody > tr").each(function() {
                    $(this).attr("data-idx", data.idx);
                });
                setDeviceOptions(data.idx);
                let lastupd = moment(data.LastUpdate, ["YYYY-MM-DD HH:mm:ss", "L LT"]).format();
                setDeviceLastUpdate(data.idx, lastupd);
            }, 10);
        }
        if (data.Type === "Wind") {
            if (theme.features.wind_direction.enabled === true) {
                /* We have to delay it a few otherwise it's get overwritten by standard icon */
                setTimeout(setDeviceWindDirectionIcon, 10, data.idx, data.DirectionStr);
            }
        }
        setTimeout(function() {
            let lastupd = moment(data.LastUpdate, ["YYYY-MM-DD HH:mm:ss", "L LT"]).format();
            setDeviceLastUpdate(data.idx, lastupd);
            setAllDevicesIconsStatus();
            /* Blue border pulse on updated card (if Domoticz flash setting enabled) */
            if ($scope.config && $scope.config.ShowUpdatedEffect === true) {
                var tr = $("tr[data-idx='" + data.idx + "']");
                tr.addClass("update-pulse");
                setTimeout(function() { tr.removeClass("update-pulse"); }, 800);
            }
        }, 10);
    }, function errorCallback(response) {
        console.error("Cannot connect to websocket");
    });

    $scope.$on('scene_update', function (event, data) {
        if (theme.features.switch_instead_of_bigtext_scenes.enabled === true) {
            setDeviceSwitch(data.idx, data.Status);
        }
        let lastupd = moment(data.LastUpdate, ["YYYY-MM-DD HH:mm:ss", "L LT"]).format();
        setDeviceLastUpdate(data.idx, lastupd);
        setDeviceOpacity(data.idx, data.Status);
    }, function errorCallback(response) {
        console.error("Cannot connect to websocket");
    });
}

/* Shared debounce registry: other modules that need to react once the DOM
   settles after a mutation burst (card-drag-handle.js, floorplan-stage.js)
   register here instead of running their own MutationObserver, so one burst
   schedules one 50ms flush instead of one per module. devices.js loads first
   (custom.js THEME_MODULES), so this is defined before any caller runs.
   Callbacks are invoked with no arguments: both registered subscribers
   (card-drag-handle.js applyHandle, floorplan-stage.js applyClass) are
   documented cheap no-ops when idle and never consumed the raw mutation
   records, so the flush does not pass them. */
var domSettledCallbacks = [];
function dzOnDomSettled(callback) {
    domSettledCallbacks.push(callback);
}

/* The theme's central re-enhancement pass: one debounced MutationObserver on
   #holder re-applies the progressive enhancements (and the page chrome that
   Angular rerenders wipe) after every digest, then flushes dzOnDomSettled
   subscribers. Registered once by the bootstrap (custom.js) on DOM ready.
   Watches attributes/class too: card-drag-handle needs class mutations
   (jQuery UI marking elements ui-draggable) alongside childList/subtree. */
function initDeviceObserver() {
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    /* Debounce with a max-wait, two timers. The settle timer resets on
       every mutation (trailing edge, 50ms of quiet). The deadline timer is
       armed on the FIRST mutation of a burst and never touched again, so a
       continuous render storm cannot starve the flush: clearing and
       re-arming a single near-0ms timer on every mutation lets each
       mutation's microtask cancel the pending macrotask forever (measured:
       a flush 1.9s after burst start that way). Whichever timer fires
       first runs the flush and disarms both. */
    var SETTLE_MS = 50;
    var MAX_WAIT_MS = 150;
    var settleTimer = null;
    var deadlineTimer = null;
    var observer = new MutationObserver(function() {
        if (settleTimer) clearTimeout(settleTimer);
        settleTimer = setTimeout(flushEnhancements, SETTLE_MS);
        if (deadlineTimer === null) {
            deadlineTimer = setTimeout(flushEnhancements, MAX_WAIT_MS);
        }
    });
    function flushEnhancements() {
        if (settleTimer) { clearTimeout(settleTimer); settleTimer = null; }
        if (deadlineTimer) { clearTimeout(deadlineTimer); deadlineTimer = null; }
        $("#main-view").children("div.container").removeClass("container").addClass("container-fluid");
        removeRowDivider();
        setCorrectDashboardLinksforMobile();
        setDevicesNativeSelectorForMobile();

        /* Re-apply progressive enhancements if device cards are present.
           Stage-split (perf work 2026-08-16): the visible stage runs
           synchronously here (toggle swap, fade, icons -- what the user
           sees at paint time); the deferred stage (options menu, time-ago,
           wrap-corner retag) is coalesced into one idle callback per burst
           by dzScheduleDeferredPass so a mutation storm never re-triggers
           it more than once. dzEnhanceDeviceCard's per-card guards
           (.switch/.options-cell existence checks) make both stages
           idempotent, so this replaces both the old unprocessed-items
           branch and the per-item switch/options re-apply loop. */
        if ($("#main-view").find(".item").length > 0) {
            dzRunDevicePass("visible");
            dzScheduleDeferredPass();
        }
        domSettledCallbacks.forEach(function(callback, index) {
            try {
                callback();
            } catch (e) {
                console.warn("dzOnDomSettled callback " + index + " (" + (callback.name || "anonymous") + ") threw", e);
            }
        });

        /* The class swap above (and possibly a registered callback) mutates
           attributes under the observed subtree, which the attributes:true
           filter picks up as new records. Drain them now, synchronously,
           before the pending delivery microtask runs: an emptied record
           queue is skipped by that microtask (spec: notify only fires for
           observers with a non-empty queue), so the observer re-arms clean
           instead of re-triggering this same debounce for its own writes. */
        observer.takeRecords();
    }
    observer.observe(document.getElementById("holder") || document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class"]
    });
}

