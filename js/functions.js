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

function setLogo() {
    let containerLogo = '<header class="logo"><div class="container-logo">';
    if (theme.logo && theme.logo.length) {
        containerLogo += '<img class="header__icon" src="images/' + theme.logo + '"';
        $("<style>#login:before {content: url(../images/" + theme.logo + ") !important;}</style>").appendTo("head");
    } else {
        containerLogo += '<img class="header__icon" src="images/logo.png">';
        $("<style>#login:before {content: url(../images/logo.png) !important;}</style>").appendTo("head");
    }
    containerLogo += "</div></header>";
    $(containerLogo).insertBefore(".navbar-inner");
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

// --dz-* tokens the custom colour scheme may override (used to clear them on a scheme switch).
var DZ_CUSTOM_TOKENS = [
    '--dz-body-bg', '--dz-body-text', '--dz-nav-bg', '--dz-widget-bg', '--dz-widget-text',
    '--dz-accent-color', '--dz-input-border', '--dz-status-disabled', '--dz-accent-red',
    '--dz-btn-success-bg', '--dz-btn-warning-bg', '--secondary-text-color', '--main-blue-color-values'
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
    if (cs.main_color) { s.setProperty('--main-blue-color-values', hexToRGB(cs.main_color, true)); }
}

function clearCustomColorScheme() {
    var s = document.documentElement.style;
    for (var i = 0; i < DZ_CUSTOM_TOKENS.length; i++) { s.removeProperty(DZ_CUSTOM_TOKENS[i]); }
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
     checkIconsmain = setInterval(function() {
        if ($("#iconsmain #fileupload").length && $("#iconsmain label.fileupload").length === 0) {
            clearInterval(checkIconsmain);
   
            $("#iconsmain #fileupload").parent().prepend('<label for="fileupload" class="fileupload btn btn-info">' + $.t("Upload") + "</label>");
            $("#iconsmain > div table:first").find("td:last").append($("#iconsmain > table td:last").children());
            $("#iconsmain #fileupload").on("change", function() {
                $(this).next().click();
                $(this).val("");
            });
        }
    }, 100);
}

function ajaxSuccessCallback(event, xhr, settings) {
    setPageTitle();
    
    if (settings.url.startsWith("json.htm?type=command&param=getdevices") || settings.url.startsWith("json.htm?type=command&param=getscenes")) {
        let counter = 0;
        let intervalId = setInterval(function() {
            if ($("#main-view").find(".item").length > 0) {
                setAllDevicesFeatures();
                setAllDevicesIconsStatus();
                clearInterval(intervalId);
            } else {
                counter++;
                if (counter >= 5) {
                    clearInterval(intervalId);
                }
            }
            setDevicesNativeSelectorForMobile();
        }, 100);
    } else if (settings.url.startsWith("json.htm?type=command&param=switchscene")) {
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
