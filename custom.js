var theme = {}, themeName = "", baseURL = "", switchState = {}, isMobile, newVersionText = "", gitVersion, lang, user, themeFolder, checkUpdate, userVariableThemeLoaded = false;
isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
var msgCount = 0;
var supported_lang = "en fr de sv nl pl";
var light_theme = {
    bg: "#f1f1f1",
    main: "#0b96cd",
    navbar: "#ffffff",
    item: "#ffffff",
    text: "#1a1a1a",
    alt_text: "#6d6e6d",
    border: "#d3d3d3",
    disabled: "#d3d3d3",
    error: "#c74343",
    success: "#5bb75b",
    warning: "#FF8C00"
};
var dark_theme = {
    bg: "#333639",
    main: "#0b96cd",
    navbar: "#232324",
    item: "#515558",
    text: "#ffffff",
    alt_text: "#cccccc",
    border: "#6d6e6d",
    disabled: "#808080",
    error: "#e05555",
    success: "#6dc96d",
    warning: "#FFA033"
};

/* $.ajax({	
    url: "styles/machinon/js/moment.js",
    async: false,	
    dataType: "script",	
}); */

$.ajax({
    url: "styles/machinon/js/livestamp.js",
    async: false,
    dataType: "script"
});

fetch('json.htm?type=command&param=getsettings', {
    method: 'GET',
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    },
    credentials: 'include'
}).then(response => {
    return response.json();
}).then(data => {
    lang = (0 <= supported_lang.split(" ").indexOf(data.Language)) ?data.Language : 'en';
    themeFolder = data.WebTheme;
    user = data.WebUserName;
    checkUpdate = data.UseAutoUpdate;

    /* Load required script files and then init the theme */
    $.when(
        $.getScript("styles/machinon/js/themesettings.js"),
        $.getScript("styles/machinon/js/functions.js"),
        $.getScript("styles/machinon/js/devices.js"),
        $.getScript("styles/machinon/lang/machinon." + lang + ".js"),
        $.Deferred(function(deferred) {
            $(deferred.resolve);
        })
    ).done(function() {
        moment.locale(lang);
        init_theme();
    });
}).catch(error => {
    console.error(error);
});

function init_theme() {
    checkUserVariableThemeSettings();
    loadSettings();

    window.onhashchange = locationHashChanged;

    /* Set $scope variable when angular is available */
    var $scope = null;
    checkAngular = setInterval(function() {
        if (($scope === null) && (typeof angular !== "undefined") && (typeof angular.element(document.body).injector() !== "undefined")) {
            clearInterval(checkAngular);
            $scope = angular.element(document.body).injector().get('$rootScope');

            $scope.$on('device_update', function (event, data) {
                searchFunction();
                if (data.Type === "Light/Switch") {
                    setDeviceOpacity(data.idx, data.Status);
                    if (theme.features.icon_image.enabled === true) {
                        /* We have to delay it a few otherwise it's get overwritten by standard icon */
                        setTimeout(setDeviceCustomIcon, 10, data.idx, data.Status);
                    }
                    if (theme.features.switch_instead_of_bigtext.enabled === true && data.SwitchType === "On/Off") {
                        setDeviceSwitch(data.idx, data.Status);
                    }
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
    }, 100);

    $(document).ready(function() {
        MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                $("#main-view").children("div.container").removeClass("container").addClass("container-fluid");
                removeRowDivider();
                setCorrectDashboardLinksforMobile();
            });
        });
        var targetNode = document.getElementById("holder");
        observer.observe(targetNode, {
            childList: true,
            subtree: true
        });
        enableThemeFeatures();
        locationHashChanged();
        setColorScheme();
        setLogo();
        setSearch();
        setDevicesNativeSelectorForMobile();
        $(document).ajaxSuccess(ajaxSuccessCallback);

        if (theme.background_img && theme.background_img.length) {
            if (theme.background_img.startsWith("http")) {
                bg_url = theme.background_img;
            } else {
                bg_url = "./images/" + theme.background_img;
            }
            $("html").addClass(theme.background_type);
            $("html").css("background-image", "url(" + bg_url + ")");
            $("body").attr('style', function(i,s) { return (s || '') + 'background: transparent !important;' });
        }
        $("#cSetup").click(function() {
            showThemeSettings();
        });

        $(".navbar").append('<div class="menu-toggle"><div></div></div>')
        var navBarInner = $(".navbar-inner"), navBarToggle = $(".menu-toggle");
        $(".menu-toggle").prop("title", language.mainmenu);
        navBarToggle.click(function() {
            navBarInner.toggleClass("slide");
        });
        navBarInner.find(".container li").not(".dropdown").not(".dropdown-submenu").click(function() {
            navBarInner.removeClass("slide");
        });
        $("#holder").click(function() {
            navBarInner.removeClass("slide");
        });
        $(window).scroll(function() {
            50 < $(this).scrollTop() ? $("div.menu-toggle").addClass("scrolled") : $("div.menu-toggle").removeClass("scrolled");
        });
        if (theme.features.navbar_icons_text.enabled !== false) {
            $(".navbar").addClass("notext");
        }
    });
}
