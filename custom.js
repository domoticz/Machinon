var theme = {}, themeName = "", isMobile, lang, themeFolder;
isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
var supported_lang = "en fr de sv nl pl";
// The scheme colour palette now lives solely in the --dz-* tokens (dz-tokens.css / dark.css). The
// hub's "Reset colours to the selected scheme" action reads the current scheme's defaults via
// getSchemeDefaults() in src/js/scheme.js, so no duplicated light_theme/dark_theme JS objects are
// needed here.

/* The theme's always-loaded modules, in load order. Feature-toggled files
   (theme.json "files") are separate and load on demand via the feature loader. */
var THEME_MODULES = [
    "src/js/settings-transport.js",
    "src/js/settings-store.js",
    "src/js/feature-loader.js",
    "src/js/theme-manifest.js",
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

/* ===================================================================== *
 *  Real routes for the theme's own pages                                 *
 * ===================================================================== *

   The theme owns two real, bookmarkable Angular routes: #/Theme (plus
   #/Theme/:tab) for the theme hub and #/SetupMenu for the settings tile grid.
   Core owns the Angular app, so they are registered by appending ONE .config()
   block to core's 'app.routes' module, plus one .run() block that only listens
   for $routeChangeError (no core path is REPLACED, which is the thing a .run()
   would otherwise be needed for: a config block runs before core's own .when()
   calls and would lose a key it shares with them).

   THIS BLOCK MUST STAY AT CUSTOM.JS TOP LEVEL. index.html loads the theme's
   custom.js synchronously and only then RequireJS, which pulls Angular in
   asynchronously, so top-level code here is the last chance to reach
   $routeProvider; the THEME_MODULES files above are injected as async=false
   scripts and land after Angular has booted. Angular also assigns
   window.angular EARLY as a bare object and attaches .module later
   (setupModuleLoader), so the hook intercepts the .module assignment, not just
   the window.angular one. Both traps are proven by the rig harnesses
   ~/docker/domoticz-test/scripts/dz-route-feasibility.js and
   dz-route-multipage.js.

   FAIL CLOSED: dzRoutesActive turns true only once the config block has
   actually run. Both pages keep their pre-route entry path (the Setup menu
   click pseudo-route), so if core ever moves the hook out of reach the theme
   degrades to that behaviour with one structured warning, and the guard
   harness (dz-route-guard.js) fails loudly. */
window.dzRoutesActive = false;

var DZ_HUB_TEMPLATE = "styles/default/templates/dz-theme-hub.html";
var DZ_GRID_TEMPLATE = "styles/default/templates/dz-setup-grid.html";
/* Templates are requested under styles/default/ on purpose: core rewrites
   /styles/default/<path> to the ACTIVE theme folder per file when the file
   exists there (cWebem.cpp), which is how a theme ships its own templates. */

/* Routed pages can be entered by URL long before the code that renders them
   exists: the theme's init (settings + THEME_MODULES) and the feature files it
   loads through RequireJS both land well after Angular has routed. So a routed
   controller waits for a named milestone instead of guessing, and gives up with
   one structured warning rather than leaving a page silently blank. */
var DZ_ROUTE_WAIT_MS = 12000; // theme boot takes seconds; this only catches a broken boot
var dzRouteMilestones = {};
var dzRouteMilestoneWaiters = {};

function dzRouteMilestone(name) {
    dzRouteMilestones[name] = true;
    var waiting = dzRouteMilestoneWaiters[name];
    delete dzRouteMilestoneWaiters[name];
    if (waiting) waiting.forEach(function (fn) { fn(); });
}

function dzWhenRouteMilestone(name, onReady, onMissing) {
    if (dzRouteMilestones[name]) { onReady(); return; }
    var done = false;
    var timer = setTimeout(function () {
        if (done) return;
        done = true;
        onMissing();
    }, DZ_ROUTE_WAIT_MS);
    dzRouteMilestoneWaiters[name] = dzRouteMilestoneWaiters[name] || [];
    dzRouteMilestoneWaiters[name].push(function () {
        if (done) return;
        done = true;
        clearTimeout(timer);
        onReady();
    });
}

/* Both routed pages mount the same way: wait for the milestone that makes the
   page renderable, then hand the host element from the routed template to the
   page's builder. $timeout(0) lets ngView attach the compiled template first,
   so the host is in the document when the builder looks it up. */
function dzRoutedController(hostId, milestone, mount, onMissing) {
    return ["$routeParams", "$timeout", function ($routeParams, $timeout) {
        $timeout(function () {
            /* The route can be left again while the theme is still booting;
               ngView then destroys the host, and neither the mount nor the
               give-up path may touch a page the user is no longer on. */
            function liveHost() {
                var host = document.getElementById(hostId);
                return (host && document.body.contains(host)) ? host : null;
            }
            dzWhenRouteMilestone(milestone, function () {
                var host = liveHost();
                if (host) mount(host, $routeParams);
            }, function () {
                if (liveHost()) onMissing();
            });
        }, 0);
    }];
}

function dzHubRouteController() {
    return dzRoutedController("dz-theme-hub-host", "theme", function (host, params) {
        if (typeof dzMountThemeHubIn !== "function") {
            console.warn("machinon_routes", "hub_builder_absent", "dzMountThemeHubIn missing; #/Theme left empty");
            return;
        }
        dzMountThemeHubIn(host, params.tab || null);
    }, function () {
        console.warn("machinon_routes", "theme_not_ready", "theme init never completed; #/Theme left empty");
    });
}

function dzSetupGridRouteController() {
    return dzRoutedController("dz-setup-grid-host", "settingsGrid", function (host) {
        window.dzBuildSettingsGrid(host);
    }, function () {
        /* The grid ships as the custom_settings_menu feature file (theme.json),
           and registers itself only when core's Setup menu is present. Switched
           off, or no menu to harvest, there is no grid to render: say so once
           and hand the user core's own Settings page rather than a blank route. */
        console.warn("machinon_routes", "grid_builder_absent", "custom_settings_menu did not register a grid; redirecting to #Setup");
        location.hash = "#Setup";
    });
}

/* The pre-route way into each page, used when a routed template cannot load.
   dzRoutesActive is already back to false by the time this runs, so both calls
   take their legacy branch. The grid's legacy entry is the Setup menu click
   handler (settings_page.js), so it is triggered rather than reimplemented: one
   build path, not a second copy. */
function dzOpenThemeLegacyPage(templateUrl) {
    if (templateUrl === DZ_HUB_TEMPLATE) {
        if (typeof dzOpenThemeHub === "function") dzOpenThemeHub();
        return;
    }
    if (window.jQuery) window.jQuery("#appnavbar li[has-permission='Admin']").click();
}

function dzRegisterThemeRoutes(routesModule) {
    routesModule.config(["$routeProvider", function ($routeProvider) {
        $routeProvider
            /* No permission key on purpose: the hub opens at every rights level
               and right-sizes its own content. #/SetupMenu is admin-only, which
               core's $routeChangeStart enforces for us (app.js). */
            .when("/Theme", { templateUrl: DZ_HUB_TEMPLATE, controller: dzHubRouteController() })
            .when("/Theme/:tab", { templateUrl: DZ_HUB_TEMPLATE, controller: dzHubRouteController() })
            .when("/SetupMenu", { templateUrl: DZ_GRID_TEMPLATE, permission: "Admin", controller: dzSetupGridRouteController() });
        window.dzRoutesActive = true;
    }]);

    /* Core has no $routeChangeError handler, so a template that fails to load
       (404, offline, a theme folder that lost templates/) would leave the URL on
       the theme path with the PREVIOUS page still rendered, silently, and with
       the legacy path already switched off. Catch it for the theme's own two
       templates only: warn once, turn the routes back off (they cannot render
       without their templates) and open the page the legacy way, so the user
       still gets it. */
    routesModule.run(["$rootScope", function ($rootScope) {
        $rootScope.$on("$routeChangeError", function (event, current) {
            var route = current && current.$$route;
            var templateUrl = route && route.templateUrl;
            if (templateUrl !== DZ_HUB_TEMPLATE && templateUrl !== DZ_GRID_TEMPLATE) return;
            console.warn("machinon_routes", "template_absent", "route template did not load: " + templateUrl + "; falling back to the legacy open");
            window.dzRoutesActive = false;
            dzOpenThemeLegacyPage(templateUrl);
        });
    }]);
}

/* Wrap angular.module so the theme's config block is appended the moment core
   DEFINES 'app.routes' (a definition passes a dependency array; a plain
   angular.module('x') is a getter call and must pass straight through). */
function dzWrapAngularModule(ng, realModule) {
    var wrapped = function (name, deps) {
        var m = realModule.apply(this, arguments);
        /* This runs INSIDE core's angular.module() call, so a throw here would
           abort core's own module definition. Contain it: the theme losing its
           routes is a degradation, breaking the app is not. */
        if (name === "app.routes" && deps) {
            try {
                dzRegisterThemeRoutes(m);
            } catch (e) {
                console.warn("machinon_routes", "hook_error", "route registration failed; theme pages stay on the legacy path", String(e));
            }
        }
        return m;
    };
    try {
        Object.defineProperty(ng, "module", { configurable: true, writable: true, value: wrapped });
    } catch (e) {
        console.warn("machinon_routes", "hook_error", "angular.module is not replaceable; theme pages stay on the legacy path", String(e));
    }
}

/* Contained on purpose: this can run from the window.angular setter below, i.e.
   inside Angular's own publishExternalAPI, where a throw would take the whole
   app down. Fail closed means degrade to the legacy path, never break core. */
function dzHookAngular(ng) {
    if (!ng || ng.__dzRoutesPatched) return;
    try {
        ng.__dzRoutesPatched = true;
        if (ng.module) { dzWrapAngularModule(ng, ng.module); return; }
        Object.defineProperty(ng, "module", {
            configurable: true,
            get: function () { return undefined; },
            set: function (realModule) { dzWrapAngularModule(ng, realModule); }
        });
    } catch (e) {
        console.warn("machinon_routes", "hook_error", "cannot hook angular.module; theme pages stay on the legacy path", String(e));
    }
}

/* Installing the hook is not the same as reaching $routeProvider: core could
   rename app.routes, define it before this file runs, or never load Angular at
   all, and the theme would sit in fallback mode with nothing said. One bounded
   timer turns that silence into a single structured warning. */
var DZ_ROUTE_HOOK_WAIT_MS = 15000; // Angular boots in ~1-2s; this only catches a broken hook

(function dzInstallRouteShim() {
    /* Test hook, honoured first (same convention as __dzForceNoApi): forces the
       pre-route behaviour so the fallback path stays covered by the harness. It
       warns for itself, so no hook_absent timer is armed below. */
    if (window.__dzForceNoRoutes) {
        console.warn("machinon_routes", "forced_off", "__dzForceNoRoutes set; theme routes not registered (test hook)");
        return;
    }
    try {
        if (window.angular) {
            dzHookAngular(window.angular);
        } else {
            var loaded;
            Object.defineProperty(window, "angular", {
                configurable: true,
                get: function () { return loaded; },
                set: function (ng) {
                    loaded = ng;
                    dzHookAngular(ng);
                }
            });
        }
    } catch (e) {
        // A throw here would abort the rest of custom.js top level, including the
        // getsettings fetch below that boots the whole theme.
        console.warn("machinon_routes", "hook_error", "window.angular is not interceptable; theme routes not registered", String(e));
    }

    setTimeout(function () {
        if (window.dzRoutesActive) return;
        console.warn("machinon_routes", "hook_absent",
            "no app.routes definition reached the hook within " + DZ_ROUTE_HOOK_WAIT_MS + "ms; theme pages stay on the legacy path");
    }, DZ_ROUTE_HOOK_WAIT_MS);
})();

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
        armFlyoutContainment();
        armSelectorWrapCornerRetag();
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

        $(".navbar").append('<div class="menu-toggle"><div></div></div>')
        var navBarInner = $(".navbar-inner"), navBarToggle = $(".menu-toggle");
        $(".menu-toggle").prop("title", language.mainmenu);
        navBarToggle.click(function() {
            navBarInner.toggleClass("slide");
        });
        // Exclude dropdown containers from "tap closes the flyout": each owns its
        // own open/close state and must not also be slammed shut by this blanket
        // handler. class="dropdown" catches Setup's <li> (index.html ~1293), but
        // core does not mark every dropdown container that way -- the non-admin
        // "Other" entry (li#mLogout, ~1354) carries the same Bootstrap
        // data-toggle="dropdown" toggle with no class="dropdown" at all, so the
        // class-only check let a tap on it open the submenu and slide the whole
        // flyout away in the same gesture. Exclude by the actual Bootstrap
        // marker too, on the toggle <a> itself, not just the class core happens
        // to add sometimes.
        navBarInner.find(".container li").not(".dropdown").not(".dropdown-submenu").filter(function() {
            return !$(this).children("a[data-toggle='dropdown']").length;
        }).click(function() {
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
        var dzSettingsReconciled = reconcileDomoticzSettingsInPlace();

        /* The theme is initialised: settings loaded, THEME_MODULES executed,
           feature files requested. #/Theme waits for this milestone before it
           builds the hub, so a page entered by URL renders with real settings
           instead of defaults. THIS MUST WAIT ON reconcileDomoticzSettingsInPlace
           SETTLING (bug found in ThemeSettings-migration review): that call
           resolves checkUserVariableThemeSettings(), which is what actually
           populates dzApiState.capable/perUser (settings-transport.js
           dzProbeThemeSettingsAPI/dzApiLoad, both async fetches). Firing the
           milestone synchronously right after the unawaited call (as this used
           to) let a session whose FIRST navigation is directly #/Theme (bookmark,
           deep link, F5 on the hub) build the hub against the pre-settle mode
           default (api:false, perUser:false) -- no chips, no locks, no
           promote/reset buttons, for the rest of the session, since
           dzBuildThemeHub caches the hub by DOM id and never rebuilds. Fail
           open on a reconcile failure (applyThemeDeltaInPlace could in
           principle throw): the milestone must still fire so the hub renders
           against whatever settled rather than staying blank forever. */
        dzSettingsReconciled.then(function () {
            dzRouteMilestone("theme");
        }).catch(function (e) {
            console.warn("machinon_routes", "reconcile_failed",
                "settings reconcile did not complete cleanly; building the hub against whatever settled", String(e));
            dzRouteMilestone("theme");
        });
    });
    }); /* end loadSettings().then() */
}
