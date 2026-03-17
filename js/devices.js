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
        if (((location.hash === "#/Dashboard") && $(this).parent().attr("id").startsWith("light")) || (location.hash === "#/LightSwitches")) {
            if (bigText.siblings("#img").find("img").hasClass("lcursor") && 
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
            timers = $(this).find(".timers_log");
            $(timers).append($(this).find('.options .btnsmall[data-i18n="Log"]').html("<i class='ion-ios-stats' title='" + $.t("Log") + "'></i>"));
            $(timers).append($(this).find('.options .btnsmall[href*="Log"]:not(.btnsmall[data-i18n="Log"])').html("<i class='ion-ios-stats' title='" + $.t("Log") + "'></i>"));
            $(timers).append($(this).find('.options .btnsmall[data-i18n="Timers"]').html("<i class='ion-ios-timer disabledText' title='" + $.t("Timers") + "'></i>"));
            $(timers).append($(this).find('.options .btnsmall-sel[data-i18n="Timers"]').html("<i class='ion-ios-timer' title='" + $.t("Timers") + "'></i>"));
            /* Check favorite state from Angular scope (ng-hide timing unreliable) */
            var itemEl = $(this).closest('.item')[0] || $(this).parents('.item')[0];
            var scope = (typeof angular !== "undefined" && itemEl) ? angular.element(itemEl).scope() : null;
            var device = scope?.device || scope?.ctrl?.device || scope?.item;
            var isFavorite = device ? device.Favorite !== 0 : false;
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
                /* Find favorite toggle — spans (Switches) or bare imgs (Weather/Temperature) */
                var clickTarget = currentlyFav
                    ? $(tr).find('.options span[ng-show*="Favorite != 0"] img, .options > img[ng-show*="Favorite != 0"]')
                    : $(tr).find('.options span[ng-show*="Favorite == 0"] img, .options > img[ng-show*="Favorite == 0"]');
                if (clickTarget.length) clickTarget.click();
                /* Update star icon after toggle */
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

