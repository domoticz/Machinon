var theme = {}, themeName = "", isMobile, lang, themeFolder;
isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
var supported_lang = "en fr de sv nl pl";
// The scheme colour palette now lives solely in the --dz-* tokens (dz-tokens.css / dark.css). The
// theme-settings "reset scheme" button reads the current scheme's defaults via getSchemeDefaults()
// in src/js/scheme.js, so no duplicated light_theme/dark_theme JS objects are needed here.

/* The theme's always-loaded modules, in load order. Feature-toggled files
   (theme.json "files") are separate and load on demand via the feature loader. */
var THEME_MODULES = [
    "src/js/settings-transport.js",
    "src/js/settings-store.js",
    "src/js/feature-loader.js",
    "src/js/theme-manifest.js",
    "src/js/settings-ui.js",
    "src/js/scheme.js",
    "src/js/schemes.js",
    "src/js/iconpack.js",
    "src/js/search.js",
    "src/js/page.js",
    "src/js/theme-hub-previews.js",
    "src/js/theme-hub.js",
    "src/js/devices.js",
    "src/js/card-drag-handle.js",
    "src/js/floorplan-stage.js",
    "src/js/menu-icons.js"
];

/* Ordered script loader: script elements with async=false execute in insertion
   order and use the browser cache ($.getScript appended a cache-busting query
   on every page load). Resolves when all files have executed. */
function loadThemeScripts(files) {
    return Promise.all(files.map(function(file) {
        return new Promise(function(resolve, reject) {
            var s = document.createElement("script");
            s.src = "styles/machinon/" + file;
            s.async = false;
            s.onload = resolve;
            s.onerror = function() { reject(new Error(file + " failed to load")); };
            document.head.appendChild(s);
        });
    }));
}

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

    /* Load required script files (plus DOM ready) and then init the theme */
    Promise.all([
        loadThemeScripts(THEME_MODULES.concat(["lang/machinon." + lang + ".js"])),
        new Promise(function(resolve) { $(resolve); })
    ]).then(function() {
        moment.locale(lang);
        /* Load livestamp after moment is available (livestamp requires moment at parse time).
           Use fetch+eval instead of $.getScript to avoid RequireJS intercepting
           livestamp's anonymous define() call (causes "Mismatched anonymous define" error). */
        fetch("styles/machinon/js/livestamp.js").then(function(r) { return r.text(); }).then(function(src) {
            var _define = window.define;
            window.define = undefined;
            try { (0, eval)(src); } finally { window.define = _define; }
            init_theme();
        }).catch(function() {
            console.log("Machinon - livestamp.js failed to load, continuing without it");
            init_theme();
        });
    });
}).catch(error => {
    console.error(error);
});

function init_theme() {
    loadSettings().then(function() {

    window.onhashchange = locationHashChanged;

    /* Set $scope variable when angular is available. This is the one polling
       wait kept on purpose: core owns the Angular app, so there is no event a
       theme can subscribe to before the injector exists. Bounded: clears as
       soon as Angular has booted. */
    var $scope = null;
    var checkAngular = setInterval(function() {
        if (($scope === null) && (typeof angular !== "undefined") && (typeof angular.element(document.body).injector() !== "undefined")) {
            clearInterval(checkAngular);
            $scope = angular.element(document.body).injector().get('$rootScope');
            initDeviceLiveUpdates($scope);
        }
    }, 100);

    $(document).ready(function() {
        initDeviceObserver();
        enableThemeFeatures();
        locationHashChanged();
        setColorScheme();
        applyCardWidths();
        clampCorePopups();
        setLogo();
        setSearch();
        setDevicesNativeSelectorForMobile();
        $(document).ajaxSuccess(ajaxSuccessCallback);

        /* Set drag clone width to match the actual card width */
        $(document).on("dragstart drag", ".ui-draggable", function(e, ui) {
            if (ui && ui.helper) {
                ui.helper.width($(this).width());
            }
        });

        applyBackground();
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
        applyNavbarIconsText();

        // ACE measures glyph width at init; when JetBrains Mono arrives later than the
        // editor (font-display: swap), cursor/selection metrics go stale. Re-measure
        // every live editor once the webfonts settle.
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(function () {
                document.querySelectorAll('.ace_editor').forEach(function (el) {
                    if (el.env && el.env.editor) {
                        el.env.editor.renderer.updateFontSize();
                    }
                });
            });
        }

        /* Perf-report F3: the defaults (cold) or cache (warm) are now painted and
           wired above. Merge the Domoticz-stored settings and apply only the delta
           in place. Runs last so the DOM the appliers touch (navbar, logo header)
           exists, and replaces the old first-visit setTimeout(location.reload). */
        reconcileDomoticzSettingsInPlace();
    });
    }); /* end loadSettings().then() */
}
