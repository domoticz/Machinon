var theme = {}, themeName = "", isMobile, lang, themeFolder;
(function() {
var buf = window.__dzToastBuffer = [];
function shim(fn) {
return function() {
var entry = { fn: fn, args: [].slice.call(arguments), cancelled: false, handle: null };
buf.push(entry);
return { close: function() {
entry.cancelled = true;
if (entry.handle) entry.handle.close();
} };
};
}
window.generate_noty = shim("noty");
window.ShowNotify = shim("shownotify");
})();
(function() {
var buf = window.__dzDiagBuffer = [];
window.dzLogOn = false;
window.dzLog = function(seam, event, fields) {
if (buf.length < 50) { buf.push([seam, event, fields]); }
return false;
};
})();
isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
var supported_lang = "en fr de sv nl pl";
var THEME_MODULES = [
"src/js/diag.js",
"src/js/url-guards.js",
"src/js/toasts.js",
"src/js/toast-hooks.js",
"src/js/settings-transport.js",
"src/js/settings-store.js",
"src/js/feature-loader.js",
"src/js/theme-manifest.js",
"src/js/scheme.js",
"src/js/schemes.js",
"src/js/color-oklch.js",
"src/js/color-repair.js",
"src/js/scheme-generator.js",
"src/js/iconpack.js",
"src/js/device-filter.js",
"src/js/search.js",
"src/js/page.js",
"src/js/theme-hub-previews.js",
"src/js/theme-hub.js",
"src/js/color-wheel.js",
"src/js/theme-wizard.js",
"src/js/set-filter.js",
"src/js/problems.js",
"src/js/clipboard.js",
"src/js/device-copy.js",
"src/js/devices.js",
"src/js/card-drag-handle.js",
"src/js/floorplan-stage.js",
"src/js/menu-icons.js"
];
function loadThemeScripts(files) {
return Promise.all(files.map(function(file) {
return new Promise(function(resolve, reject) {
var s = document.createElement("script");
s.src = "styles/" + themeFolder + "/" + file;
s.async = false;
s.onload = resolve;
s.onerror = function() { reject(new Error(file + " failed to load")); };
document.head.appendChild(s);
});
}));
}
window.dzRoutesActive = false;
var DZ_HUB_TEMPLATE = "styles/default/templates/dz-theme-hub.html";
var DZ_GRID_TEMPLATE = "styles/default/templates/dz-setup-grid.html";
var DZ_PROBLEMS_TEMPLATE = "styles/default/templates/dz-problems.html";
var DZ_ROUTE_WAIT_MS = 12000;
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
function dzRoutedController(hostId, milestone, mount, onMissing) {
return ["$routeParams", "$timeout", function ($routeParams, $timeout) {
$timeout(function () {
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
function dzProblemsRouteController() {
return dzRoutedController("dz-problems", "problems", function () {
if (typeof dzProblemsRenderPage === "function") dzProblemsRenderPage();
}, function () {
console.warn("machinon_routes", "problems_not_ready", "theme init never completed; #/ProblemDevices left empty");
});
}
function dzSetupGridRouteController() {
return dzRoutedController("dz-setup-grid-host", "settingsGrid", function (host) {
window.dzBuildSettingsGrid(host);
}, function () {
console.warn("machinon_routes", "grid_builder_absent", "custom_settings_menu did not register a grid; redirecting to #/Setup");
dzThemeNavigate("#/Setup");
});
}
function dzOpenThemeLegacyPage(templateUrl) {
if (templateUrl === DZ_HUB_TEMPLATE) {
if (typeof dzOpenThemeHub === "function") dzOpenThemeHub();
return;
}
if (templateUrl === DZ_PROBLEMS_TEMPLATE) {
console.warn("machinon_routes", "problems_template_absent", "route template did not load: " + templateUrl + "; redirecting to #/Dashboard");
dzThemeNavigate("#/Dashboard");
return;
}
if (window.jQuery) window.jQuery("#appnavbar li[has-permission='Admin']").click();
}
function dzRegisterThemeRoutes(routesModule) {
if (window.__dzThrowInRouteHook) { throw new Error("__dzThrowInRouteHook (test hook)"); }
routesModule.config(["$routeProvider", function ($routeProvider) {
var registered = 0;
function when(path, def) { registered += 1; $routeProvider.when(path, def); }
when("/Theme", { templateUrl: DZ_HUB_TEMPLATE, controller: dzHubRouteController() });
when("/Theme/:tab", { templateUrl: DZ_HUB_TEMPLATE, controller: dzHubRouteController() });
when("/SetupMenu", { templateUrl: DZ_GRID_TEMPLATE, permission: "Admin", controller: dzSetupGridRouteController() });
when("/ProblemDevices", { templateUrl: DZ_PROBLEMS_TEMPLATE, controller: dzProblemsRouteController() });
window.dzRoutesActive = true;
if (typeof dzLog === "function") {
dzLog("routes", "registered", { routes: registered, active: window.dzRoutesActive });
}
if (typeof dzProblemsRefresh === "function") dzProblemsRefresh();
}]);
routesModule.run(["$rootScope", function ($rootScope) {
$rootScope.$on("$routeChangeError", function (event, current) {
var route = current && current.$$route;
var templateUrl = route && route.templateUrl;
if (templateUrl !== DZ_HUB_TEMPLATE && templateUrl !== DZ_GRID_TEMPLATE && templateUrl !== DZ_PROBLEMS_TEMPLATE) return;
console.warn("machinon_routes", "template_absent", "route template did not load: " + templateUrl + "; falling back to the legacy open");
window.dzRoutesActive = false;
if (typeof dzLog === "function") {
dzLog("routes", "refused", { routes: 0, active: false, reason: "template_absent" });
}
if (typeof dzProblemsRefresh === "function") dzProblemsRefresh();
dzOpenThemeLegacyPage(templateUrl);
});
}]);
}
var dzTraversedTo = null;
window.addEventListener("popstate", function (e) {
if (e.isTrusted) dzTraversedTo = location.href;
});
function dzBridgeHashChange($rootScope) {
if (window.dzHashNavViaPushState !== true) return;
$rootScope.$on("$locationChangeSuccess", function (event, newUrl, oldUrl) {
var native = dzTraversedTo === newUrl;
dzTraversedTo = null;
if (native || newUrl === oldUrl) return;
setTimeout(function () {
window.dispatchEvent(new HashChangeEvent("hashchange", { oldURL: oldUrl, newURL: newUrl }));
}, 0);
});
}
function dzThemeNavigate(hash) {
if (typeof dzNavigateHash === "function") dzNavigateHash(hash);
else location.hash = hash;
}
function dzWrapAngularModule(ng, realModule) {
var wrapped = function (name, deps) {
var m = realModule.apply(this, arguments);
if (name === "domoticz" && deps) {
try {
m.run(["$rootScope", dzBridgeHashChange]);
} catch (e) {
dzLog("routes", "bridge_failed", { error: String(e) });
}
}
if (name === "app.routes" && deps) {
try {
dzRegisterThemeRoutes(m);
} catch (e) {
console.warn("machinon_routes", "hook_error", "route registration failed; theme pages stay on the legacy path", String(e));
if (typeof dzLog === "function") {
dzLog("routes", "refused", { routes: 0, active: false, reason: "hook_error" });
}
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
var DZ_ROUTE_HOOK_WAIT_MS = 15000;
(function dzInstallRouteShim() {
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
console.warn("machinon_routes", "hook_error", "window.angular is not interceptable; theme routes not registered", String(e));
}
setTimeout(function () {
if (window.dzRoutesActive) return;
console.warn("machinon_routes", "hook_absent",
"no app.routes definition reached the hook within " + DZ_ROUTE_HOOK_WAIT_MS + "ms; theme pages stay on the legacy path");
}, DZ_ROUTE_HOOK_WAIT_MS);
})();
function dzBootJson(url) {
return fetch(url, { headers: { Accept: 'application/json' }, credentials: 'include' }).then(function(response) {
if (!response.ok) throw new Error(url + " answered " + response.status);
return response.json();
});
}
function dzBootText(url) {
return fetch(url, { cache: 'no-cache', credentials: 'include' }).then(function(response) {
return response.ok ? response.text() : null;
}).catch(function() { return null; });
}
function dzProbeThemeFolder() {
return Promise.all([
dzBootText('styles/default/theme.json'),
dzBootJson('json.htm?type=command&param=getthemes')
]).then(function(results) {
var active = results[0];
var names = (results[1].result || []).map(function(t) { return t.theme; }).filter(function(name) {
return name && name.length !== 7;
});
if (!active) throw new Error("styles/default/theme.json is unreadable");
return Promise.all(names.map(function(name) {
return dzBootText('styles/' + encodeURIComponent(name) + '/theme.json');
})).then(function(texts) {
var matches = [];
texts.forEach(function(text, i) { if (text === active) matches.push(names[i]); });
if (!matches.length) throw new Error("no installed theme matches the active theme.json");
if (matches.length > 1) dzLog("boot", "theme_folder_ambiguous", { matches: matches.join(",") });
return matches.indexOf("machinon") >= 0 ? "machinon" : matches[0];
});
});
}
function dzResolveThemeFolder(config) {
if (config.WebTheme) return Promise.resolve(config.WebTheme);
return dzBootJson('json.htm?type=command&param=getsettings').then(function(settings) {
if (!settings.WebTheme) throw new Error("getsettings carries no WebTheme");
return settings.WebTheme;
}).catch(function() {
return dzProbeThemeFolder();
});
}
dzBootJson('json.htm?type=command&param=getconfig').then(function(config) {
lang = (0 <= supported_lang.split(" ").indexOf(config.language)) ? config.language : 'en';
document.documentElement.lang = config.language || lang;
return dzResolveThemeFolder(config);
}).then(function(folder) {
themeFolder = folder;
Promise.all([
loadThemeScripts(["src/js/i18n.js", "lang/machinon.en.js"]).then(function () {
if (lang === "en") return;
var enTable = language;
return loadThemeScripts(["lang/machinon." + lang + ".js"]).then(function () {
language = dzDeepMerge(enTable, language);
}).catch(function () {
console.warn("machinon_i18n", "overlay_load_failed", lang);
language = enTable;
});
}),
loadThemeScripts(THEME_MODULES),
new Promise(function(resolve) { $(resolve); })
]).then(function() {
moment.locale(lang);
fetch("styles/" + themeFolder + "/js/livestamp.js").then(function(r) { return r.text(); }).then(function(src) {
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
var $scope = null;
var angularPolls = 0;
var checkAngular = setInterval(function() {
if (($scope === null) && (typeof angular !== "undefined") && (typeof angular.element(document.body).injector() !== "undefined")) {
clearInterval(checkAngular);
$scope = angular.element(document.body).injector().get('$rootScope');
initDeviceLiveUpdates($scope);
} else if (++angularPolls >= 600) {
clearInterval(checkAngular);
if (typeof dzLog === "function") { dzLog("boot", "angular_absent", { waited_ms: 60000 }); }
}
}, 100);
$(document).ready(function() {
dzArmSetupApplyDock();
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
dzWireDashboardSearch();
dzProblemsInit();
setDevicesNativeSelectorForMobile();
patchSelectMenuCollision();
$(document).ajaxSuccess(ajaxSuccessCallback);
$(document).on("dragstart drag", ".ui-draggable", function(e, ui) {
if (ui && ui.helper) {
ui.helper.width($(this).width());
}
});
applyBackground();
var navBarInner = $(".navbar-inner");
if (!navBarInner.attr("id")) navBarInner.attr("id", "dz-main-nav");
var navBarToggle = $('<button type="button" class="menu-toggle"><span></span></button>').attr({
title: dzT("header.mainmenu"),
"aria-label": dzT("header.mainmenu"),
"aria-controls": navBarInner.attr("id"),
"aria-expanded": "false"
});
$(".navbar").append(navBarToggle);
var syncNavMenuState = function() {
var open = navBarInner.hasClass("slide");
navBarToggle.attr("aria-expanded", open ? "true" : "false");
navBarInner.prop("inert", navBarToggle.is(":visible") && !open);
};
new MutationObserver(syncNavMenuState).observe(navBarInner[0], { attributes: true, attributeFilter: ["class"] });
if (window.ResizeObserver) new ResizeObserver(syncNavMenuState).observe(navBarToggle[0]);
$(window).on("resize", syncNavMenuState);
syncNavMenuState();
navBarToggle.click(function(e) {
navBarInner.toggleClass("slide");
syncNavMenuState();
if (e.detail === 0 && navBarInner.hasClass("slide")) {
navBarInner.find("a[href]:visible").first().trigger("focus");
}
});
$(document).on("keydown", function(e) {
if (e.key === "Escape" && navBarInner.hasClass("slide")) {
navBarInner.removeClass("slide");
navBarToggle.trigger("focus");
}
});
navBarInner.on("click", ".container li", function() {
var li = $(this);
if (li.is(".dropdown, .dropdown-submenu") || li.children("a[data-toggle='dropdown']").length) return;
navBarInner.removeClass("slide");
});
$("#holder").click(function() {
navBarInner.removeClass("slide");
});
$(window).scroll(function() {
navBarToggle.toggleClass("scrolled", 50 < $(this).scrollTop());
});
applyNavbarIconsText();
if (document.fonts && document.fonts.ready) {
document.fonts.ready.then(function () {
document.querySelectorAll('.ace_editor').forEach(function (el) {
if (el.env && el.env.editor) {
el.env.editor.renderer.updateFontSize();
}
});
});
}
var dzSettingsReconciled = reconcileDomoticzSettingsInPlace();
dzSettingsReconciled.then(function () {
dzRouteMilestone("theme");
}).catch(function (e) {
console.warn("machinon_routes", "reconcile_failed",
"settings reconcile did not complete cleanly; building the hub against whatever settled", String(e));
dzRouteMilestone("theme");
});
});
});
}
