function setDevicesNativeSelectorForMobile() {
    if (!isMobile) return;
    $(".selectorlevels span.ui-selectmenu-button").each(function() {
        $(this).hide();
        var selectorId = $(this).attr("id").split("-", 1)[0];
        $("#" + selectorId + ":not(.ui-widget").on("change", function(e) {
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

function setAllDevicesFeatures() {
    switchState = {
        on: $.t("On"),
        off: $.t("Off"),
        open: $.t("Open"),
        closed: $.t("Closed")
    };

    /* Browse all items to apply themes features and styles */
    $("#main-view .item").each(function() {
        /* Get device data from Angular scope (structural, future-proof) */
        var elemScope = typeof angular !== 'undefined' && angular.element(this).scope();
        var dev = null;
        if (elemScope) {
            dev = (elemScope.ctrl && (elemScope.ctrl.device || elemScope.ctrl.scene)) || elemScope.item;
        }

        /* Get idx from Angular scope, fall back to DOM */
        var idx = (dev && String(dev.idx)) ||
                  $(this).attr('id') ||
                  ($(this).parent().attr('id') || '').replace(/^\D+/g, '');
        $(this).find("tr").attr('data-idx', idx);

        /* Get status from Angular scope, fall back to DOM text */
        let bigText = $(this).find("#bigtext");
        let status = (dev && (dev.Status || dev.Data || '')) || bigText.text().trim();

        /* Apply style and redefine options */
        setDeviceOptions(idx, dev);

        /* Feature - Fade off items */
        setDeviceOpacity(idx, status);

        /* Feature - Show timeago for last update */
        var lastupd;
        var lastUpdateRaw = (dev && dev.LastUpdate) || null;
        /* Fallback: extract date from DOM text (handles "Last Seen: YYYY-MM-DD..." prefix) */
        if (!lastUpdateRaw) {
            var rawText = $(this).find("#lastupdate").text();
            var dateMatch = rawText.match(/\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/);
            lastUpdateRaw = dateMatch ? dateMatch[0] : rawText;
        }
        if (theme.features.time_ago.enabled === true) {
            lastupd = lastUpdateRaw;
        } else {
            lastupd = moment(lastUpdateRaw, [ "YYYY-MM-DD HH:mm:ss", "L LT" ]).format();
        }
        setDeviceLastUpdate(idx, lastupd);

        /* Feature - Switch instead of text */
        var isDashboard = location.hash === "#/Dashboard";
        var isLightSwitches = location.hash === "#/LightSwitches";
        var parentId = $(this).parent().attr("id") || '';
        if ((isDashboard && parentId.startsWith("light")) || isLightSwitches) {
            if ($(this).find("#img img").hasClass("lcursor") &&
                ($(this).find(".dimslider").length == 0) &&
                ($(this).find(".selectorlevels").length == 0) &&
                ($(this).find(".btn-group").length == 0)
            ) {
                if (theme.features.switch_instead_of_bigtext.enabled && $(this).find("#img2").length == 0) {
                    setDeviceSwitch(idx, status);
                } else {
                    bigText.show();
                }
            }
        }

        /* Feature - Switch instead of text for scenes */
        if (theme.features.switch_instead_of_bigtext_scenes.enabled === true) {
            var isScenePage = location.hash === "#/Scenes";
            var isSceneOnDash = isDashboard && ($(this).parents("[id^='dashScene']").length > 0);
            if ((isScenePage || isSceneOnDash) && $(this).find("table[id='itemtabledoubleicon'],table[id='itemtablesmalldoubleicon']").length > 0) {
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
            var windDir = (dev && dev.DirectionStr) || undefined;
            setDeviceWindDirectionIcon(idx, windDir);
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
                generate_noty('warning', "Sensor " + $(this).find('#name').text() + " " + language.is + " " + language.timedout, 4000);
            }
            $(this).find("#name").prepend("<i class='ion-ios-wifi blink warning-text' title='" + $.t("Sensor Timeout") + "'></i>&nbsp;");
        }
    });
    $("div.item.statusLowBattery").each(function() {
        if ($(this).find("#name > i.ion-ios-battery-dead").length === 0) {
            if (theme.features.notification.enabled === true) {
                generate_noty('warning', $(this).find('#name').text() + ' ' + $.t("Battery Level") + ' ' + $.t("Low"), 4000)
            }
            $(this).find("#name").prepend("<i class='ion-ios-battery-dead blink warning-text' title='" + $.t("Battery Low Level") + "'></i>&nbsp;");
        }
    });
}

function setDeviceOptions(idx, dev) {
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
            timers = $(this).find(".timers_log");
            $(timers).append($(this).find('.options .btnsmall[data-i18n="Log"]').html("<i class='ion-ios-stats' title='" + $.t("Log") + "'></i>"));
            $(timers).append($(this).find('.options .btnsmall[href*="Log"]:not(.btnsmall[data-i18n="Log"])').html("<i class='ion-ios-stats' title='" + $.t("Log") + "'></i>"));
            $(timers).append($(this).find('.options .btnsmall[data-i18n="Timers"]').html("<i class='ion-ios-timer disabledText' title='" + $.t("Timers") + "'></i>"));
            $(timers).append($(this).find('.options .btnsmall-sel[data-i18n="Timers"]').html("<i class='ion-ios-timer' title='" + $.t("Timers") + "'></i>"));
            var isFavorite = false;
            if (dev && dev.Favorite !== undefined) {
                isFavorite = dev.Favorite !== 0;
            } else {
                /* Fallback: check DOM for favorite state */
                var noFavImg = $(this).find('.options span:not(.ng-hide) img[src*="nofavorite"]');
                isFavorite = noFavImg.length === 0;
            }
            if (isFavorite) {
                icon = '<i class="ion-ios-star lcursor" title="' + $.t("Remove from Dashboard") + '" onclick="MakeFavorite(' + idx + ',0);"></i></td>';
            } else {
                icon = '<i class="ion-ios-star-outline lcursor" title="' + $.t("Add to Dashboard") + '" onclick="MakeFavorite(' + idx + ',1);"></i></td>';
            }
            $(this).append('<td class="favorite">' + icon + "</td>");
        }
    });
}

function setDeviceCustomIcon(idx, status) {
    switchState = {
        on: $.t("On"),
        off: $.t("Off"),
    };

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

    /* If browser is a bit late, avoid future date */
    if (moment(lastupdate).isAfter(moment()))
        lastupdate = moment();

    $(tr).each(function() {
        if (theme.features.time_ago.enabled === true) {
            let lastupdated = $(this).find("#timeago");
            if (lastupdated.length == 0) {
                $(this).append('<td id="timeago" class="timeago" title="' + $.t("Last Seen") + '"><i class="ion-ios-pulse"></i> <span data-livestamp="' + moment(lastupdate).format() + '" title="' + moment(lastupdate).format("L LT") + '"></span></td>');
                $(this).find("#lastupdate").hide();
            } else {
                $(this).find("#timeago > span").attr("title", moment(lastupdate).format("L LT"));
                $(this).find("#timeago > span").livestamp( moment(lastupdate).format());
            }
        } else {
            var lastupd = moment(lastupdate);
            lastupd.locale(window.navigator.language);
            $(this).find("#lastupdate").attr("title", $.t("Last Seen"));
            $(this).find("#lastupdate").text(lastupd.format("L LT"));
            if ($(this).find("#lastSeen").length == 0) {
                $(this).find("#lastupdate").prepend("<i id='lastSeen' class='ion-ios-pulse'></i> ");
            }
        }
    });
}

function setDeviceOpacity(idx, status) {
    switchState = {
        on: $.t("On"),
        off: $.t("Off"),
        open: $.t("Open"),
        closed: $.t("Closed")
    };

    if (theme.features.fade_off_items.enabled === true) {
        let tr = "tr[data-idx='" + idx + "']";
        if (status === switchState.off  || status === 'Off' || status === switchState.closed || status === 'Closed') {
            $(tr).parents(".item").addClass("fadeOff");
        } else {
            $(tr).parents(".item").removeClass("fadeOff");
        }
    }
}

