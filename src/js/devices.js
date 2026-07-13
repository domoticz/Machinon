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
   helpers below). Recomputed per call on purpose: $.t only returns translated
   strings once core's i18n is initialized, so caching the first result could
   freeze untranslated labels. */
function switchLabels() {
    return {
        on: $.t("On"),
        off: $.t("Off"),
        open: $.t("Open"),
        closed: $.t("Closed")
    };
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
   NON_TOGGLE_SWITCH_TYPES), so cards whose scope is unreachable only get
   a toggle if the DOM checks pass, which keeps scenes working. */
function isPlainOnOffSwitch(item) {
    var device = getCardDevice(item);
    if (device && (device.Type === "Security" ||
        NON_TOGGLE_SWITCH_TYPES.indexOf(device.SwitchType) !== -1)) {
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
   carries a state: inventing "Off" for stateless icons put toggles on
   text sensors (caught by dz-dd-matrix.js). */
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

function setAllDevicesFeatures() {
    /* Browse all items to apply themes features and styles */
    $("#main-view .item").each(function() {
        /* Set idx on tr, for easy retrieval */
        let idx = $(this).find("#name").attr('data-idx');
        if (typeof idx === "undefined" || idx === "") {
            /* Fallback: try parent id (dashboard items like light_37, temp_1) */
            idx = $(this).parent().attr('id');
            if (typeof idx === "undefined") {
                idx = $(this).attr('id');
            } else {
                idx = idx.replace(/^\D+/g, '');
            }
        }
        $(this).find("tr").attr('data-idx', idx);

        /* Remove native title tooltip — our CSS ::after tooltip handles it */
        $(this).find("#name").removeAttr("title");

        let bigText = $(this).find("#bigtext");
        let status = bigText.text().trim();
        if (status.length == 0) {
            status = bigText.attr("data-status")?.trim();
        }

        /* Apply style and redefine options */
        setDeviceOptions(idx);

        /* Feature - Fade off items */
        setDeviceOpacity(idx, status);

        /* Feature - Show timeago for last update */
        var lastupd;
        var lastupdateEl = $(this).find("#lastupdate");
        var alreadyProcessed = lastupdateEl.find("i.ion-ios-pulse").length > 0;
        if (alreadyProcessed) {
            /* Already processed by setDeviceLastUpdate — skip to avoid overwriting
               livestamp text like "18 hours ago" which moment can't parse */
        } else if (theme.features.time_ago.enabled === true) {
            lastupd = lastupdateEl.text();
            setDeviceLastUpdate(idx, lastupd);
        } else {
            lastupd = moment(lastupdateEl.text(), [ "YYYY-MM-DD HH:mm:ss", "L LT" ]).format();
            setDeviceLastUpdate(idx, lastupd);
        }

        /* Feature - Switch instead of text */
        if (isLightSwitchContext($(this), status) && isPlainOnOffSwitch($(this))) {
            if (theme.features.switch_instead_of_bigtext.enabled && $(this).find("#img2").length == 0) {
                setDeviceSwitch(idx, status);
            } else {
                bigText.show();
            }
        }

        /* Feature - Switch instead of text for scenes */
        if (theme.features.switch_instead_of_bigtext_scenes.enabled === true) {
            if (($(this).parents("#scenecontent").length > 0) || ($(this).parents("#dashScenes").length > 0 && $(this).find("#itemtablesmalldoubleicon").length > 0)) {
                setDeviceSwitch(idx, status);
                bigText.hide();
            }
            
        }

        /* Feature - Set custom icons */
        if (theme.features.icon_image.enabled === true) {
            setDeviceCustomIcon(idx, status);
        }

        /* Feature - Show wind direction */
        if (theme.features.wind_direction.enabled === true) {
            setDeviceWindDirectionIcon(idx);
        }
	});
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

function setDeviceOptions(idx) {
    let tr = "tr[data-idx='" + idx + "']";
    $(tr).each(function() {
        /* Create options menu */
        let subnav = $(this).find(".options");
        let subnavButton = $(this).find(".options-cell");
        if (subnav.length && subnavButton.length == 0) {
            /* Display idx in the options */
            $(subnav).append('<a class="btnsmall" id="idno"><i>Idx: ' + idx + "</i></a>");
            $(this).append('<td class="options-cell" title="' + $.t("More options") + '"><i class="ion-md-more"></i</td>');
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
                    ? $(tr).find('.options img[ng-click*="akeFavorite(0)"]')
                    : $(tr).find('.options img[ng-click*="akeFavorite(1)"]');
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

function setDeviceCustomIcon(idx, status) {
    var switchState = switchLabels();

    var icons = theme.icons;
    for (var i = 0; i < icons.length; i++) {
        if (icons[i].idx == idx) {
            let tr = "tr[data-idx='" + idx + "']";
            $(tr).find("#img img").attr("src", "images/" + icons[i].img);
            if (status == switchState.on || status == 'On') {
                $(tr).find("#img img").addClass("userOn");
            } else {
                $(tr).find("#img img").addClass("user");
            }
        }
    }
}

function setDeviceWindDirectionIcon(idx, direction) {
    let tr = "tr[data-idx='" + idx + "']";
    $(tr).find("#img img[src*='Wind']").each(function() {
        if (direction === undefined) {
            let src = $(this).attr("src").split('/Wind');
            direction = src[1];
        } else {
            direction += '.png';
        }
        $(this).attr("src", 'images/wind-direction/Wind' + direction);
    }); 
}

function setDeviceLastUpdate(idx, lastupdate) {
    let tr = "tr[data-idx='" + idx + "']";

    /* Strip "Last Seen:" or similar prefix — extract date portion */
    if (typeof lastupdate === "string") {
        var dateMatch = lastupdate.match(/\d{4}[-/]\d{2}[-/]\d{2}[\sT]\d{2}:\d{2}:\d{2}/);
        if (dateMatch) lastupdate = dateMatch[0];
    }

    /* If browser is a bit late, avoid future date */
    if (moment(lastupdate).isAfter(moment()))
        lastupdate = moment();

    $(tr).each(function() {
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

function setDeviceOpacity(idx, status) {
    var switchState = switchLabels();

    if (theme.features.fade_off_items.enabled === true) {
        let tr = "tr[data-idx='" + idx + "']";
        if (status === switchState.off  || status === 'Off' || status === switchState.closed || status === 'Closed') {
            $(tr).parents(".item").addClass("fadeOff");
        } else {
            $(tr).parents(".item").removeClass("fadeOff");
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
           the enhancement passes, which check page context and switch type; the
           old Light/Switch + SwitchType === "On/Off" gate here both created
           toggles without those checks and left every other toggleable type
           (X10 Siren, Lighting 2 on/off) stale on remote state changes. */
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

/* The theme's central re-enhancement pass: one debounced MutationObserver on
   #holder re-applies the progressive enhancements (and the page chrome that
   Angular rerenders wipe) after every digest. Registered once by the
   bootstrap (custom.js) on DOM ready. */
function initDeviceObserver() {
    MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    var mutationTimer = null;
    var observer = new MutationObserver(function(mutations) {
        /* Debounce: wait for Angular digest to settle */
        if (mutationTimer) clearTimeout(mutationTimer);
        mutationTimer = setTimeout(function() {
            $("#main-view").children("div.container").removeClass("container").addClass("container-fluid");
            removeRowDivider();
            setCorrectDashboardLinksforMobile();
            setDevicesNativeSelectorForMobile();

            /* Re-apply progressive enhancements if device cards are present */
            if ($("#main-view").find(".item").length > 0) {
                /* Initialize unprocessed items (no data-idx = setAllDevicesFeatures hasn't run) */
                var hasUnprocessed = $("#main-view .item tr:not([data-idx])").length > 0;
                if (hasUnprocessed && typeof setAllDevicesFeatures === "function") {
                    setAllDevicesFeatures();
                    setAllDevicesIconsStatus();
                }

                var switchEnabled = theme.features.switch_instead_of_bigtext.enabled === true ||
                    theme.features.switch_instead_of_bigtext_scenes.enabled === true;
                $("#main-view .item").each(function() {
                    let tr = $(this).find("tr[data-idx]");
                    if (!tr.length) return;
                    let idx = tr.attr("data-idx");
                    if (!idx) return;

                    /* Re-apply options menu if wiped */
                    if (tr.find(".options-cell").length === 0) {
                        setDeviceOptions(idx);
                    }

                    /* Re-apply switch toggle if enabled and wiped — heuristics shared
                       with setAllDevicesFeatures() via the helpers above */
                    if (switchEnabled && tr.find(".switch").length === 0) {
                        let item = $(this);
                        let bigText = item.find("#bigtext");
                        if (isPlainOnOffSwitch(item) && item.find("#img2").length === 0) {
                            /* The Dynamic Dashboard binary check uses the full status
                               chain (bigtext, data-status, icon filename): push buttons
                               on that board render an EMPTY bigtext and no data-status,
                               so the icon name is their only signal. Sensors stay safe:
                               a non-binary value fails the check, and an empty-value
                               sensor icon is not clickable, so isPlainOnOffSwitch
                               already rejected it (dz-dd-matrix.js guards this). */
                            let isScene = item.parents("#scenecontent").length > 0 ||
                                (item.parents("#dashScenes").length > 0 && item.find("#itemtablesmalldoubleicon").length > 0);
                            if (isLightSwitchContext(item, readSwitchStatus(item)) && theme.features.switch_instead_of_bigtext.enabled === true) {
                                setDeviceSwitch(idx, readSwitchStatus(item));
                            } else if (isScene && theme.features.switch_instead_of_bigtext_scenes.enabled === true) {
                                setDeviceSwitch(idx, readSwitchStatus(item));
                                bigText.hide();
                            }
                        }
                    }
                });
            }
        }, 50);
    });
    observer.observe(document.getElementById("holder"), {
        childList: true,
        subtree: true
    });
}

