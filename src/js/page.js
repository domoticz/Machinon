var domWaiters = {};
function whenElementRenders(key, selector, fn) {
if (document.readyState === "loading") {
document.addEventListener("DOMContentLoaded", function() {
whenElementRenders(key, selector, fn);
});
return;
}
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
whenElementRenders("search-readonly", "#search", function() {
if (location.hash == "#/Dashboard" && !isMobile || location.hash == "#/LightSwitches" || location.hash == "#/Scenes" || location.hash == "#/Temperature" || location.hash == "#/Weather" || location.hash == "#/Utility") {
$("#search").removeClass("readonly");
} else {
$("#search").addClass("readonly");
}
});
if ((location.hash == "#/Dashboard") && theme.features.dashboard_camera.enabled) {
if (typeof cameraPreview === "function")
theme.features.dashboard_camera_section && cameraPreview(theme.features.dashboard_camera_section.enabled);
}
if (location.hash == "#/CustomIcons") {
setCustomIconsPage();
}
}
function setPageTitle() {
var pagedetect = window.location.href.split("#/")[1];
var title = (typeof $.t !== "undefined" ? $.t(pagedetect) : pagedetect );
document.title = 'Domoticz - ' + title;
}
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
function dzApplyCustomPageLabel() {
var name = theme.button_name;
$("#customPage .dz-custom-page-label").text(name == null ? "" : String(name));
}
function setLogo() {
if ($("header.logo").length === 0) {
$('<header class="logo"><div class="container-logo"></div></header>').insertBefore(".navbar-inner");
}
var container = $("header.logo .container-logo");
var hide = !!(theme.features.hide_logo && theme.features.hide_logo.enabled);
container.children(".header__icon").remove();
var logoName = dzThemeImageName(theme.logo);
if (logoName) {
var img = $('<img class="header__icon">').attr("src", "images/" + logoName);
if (hide) img.hide();
container.prepend(img);
return;
}
var mount = function (markup) {
container.children(".header__icon").remove();
var svg = document.importNode(
new DOMParser().parseFromString(markup, "image/svg+xml").documentElement, true);
svg.setAttribute("class", "header__icon");
if (hide) svg.style.display = "none";
container.prepend(svg);
};
if (setLogo._svg) { mount(setLogo._svg); return; }
setLogo._pending = setLogo._pending || fetch("images/machinon/brand/logo.svg").then(function (r) { return r.text(); });
setLogo._pending.then(function (t) { setLogo._svg = t; mount(t); });
}
function applyBackground() {
if (theme.background_img && theme.background_img.length) {
var bg_url;
if (theme.background_img.startsWith("http")) {
bg_url = theme.background_img;
} else {
bg_url = "./images/" + theme.background_img;
}
$("html").addClass(theme.background_type);
$("html").css("background-image", "url(" + bg_url + ")");
$("body").attr("style", function(i, s) { return (s || "") + "background: transparent !important;"; });
}
}
function applyNavbarIconsText() {
var feat = theme.features && theme.features.navbar_icons_text;
$(".navbar").toggleClass("notext", !!feat && feat.enabled !== false);
}
function dzIsIOS(nav) {
if (!nav || typeof nav.userAgent !== "string") return false;
if (/iPhone|iPad|iPod/.test(nav.userAgent)) return true;
return /Macintosh/.test(nav.userAgent) && nav.maxTouchPoints > 1;
}
function dzViewportNoFocusZoom(content) {
if (/maximum-scale\s*=/.test(content)) {
return content.replace(/maximum-scale\s*=\s*[^,;\s]*/, "maximum-scale=1.0");
}
return content ? content + ", maximum-scale=1.0" : "maximum-scale=1.0";
}
function dzPreventFocusZoom() {
if (!dzIsIOS(navigator)) return;
var meta = document.querySelector('meta[name="viewport"]');
if (!meta) return;
meta.setAttribute("content", dzViewportNoFocusZoom(meta.getAttribute("content") || ""));
}
var corePopupClampArmed = false;
function clampCorePopups() {
var CORE_POPUP_IDS = ["rgbw_popup", "setpoint_popup", "thermostat3_popup", "rfy_popup"];
function nudgeIntoViewport(pop) {
if (pop.style.display === "none") return;
var r = pop.getBoundingClientRect();
if (!r.width) return;
var dx = Math.min(0, window.innerWidth - 10 - r.right);
var dy = Math.min(0, window.innerHeight - 10 - r.bottom);
if (dx || dy) {
pop.style.left = Math.max(10, r.left + dx + window.scrollX) + "px";
pop.style.top = Math.max(10, r.top + dy + window.scrollY) + "px";
}
}
CORE_POPUP_IDS.forEach(function (id) {
var pop = document.getElementById(id);
if (!pop) return;
new MutationObserver(function () {
nudgeIntoViewport(pop);
}).observe(pop, { attributes: true, attributeFilter: ["style"] });
});
if (corePopupClampArmed) return;
corePopupClampArmed = true;
var resizeTimer = null;
window.addEventListener("resize", function () {
if (resizeTimer) clearTimeout(resizeTimer);
resizeTimer = setTimeout(function () {
CORE_POPUP_IDS.forEach(function (id) {
var pop = document.getElementById(id);
if (pop) nudgeIntoViewport(pop);
});
}, 100);
});
}
var flyoutContainmentArmed = false;
function armFlyoutContainment() {
if (flyoutContainmentArmed) return;
flyoutContainmentArmed = true;
var pairs = [];
document.querySelectorAll(".navbar .dropdown-submenu > a").forEach(function (trigger) {
var menu = trigger.nextElementSibling;
if (!menu || !menu.classList.contains("dropdown-menu")) return;
pairs.push(menu);
trigger.addEventListener("mouseenter", function () {
containFlyout(menu);
});
});
var resizeTimer = null;
window.addEventListener("resize", function () {
if (resizeTimer) clearTimeout(resizeTimer);
resizeTimer = setTimeout(function () {
pairs.forEach(function (menu) {
if (getComputedStyle(menu).display !== "none") containFlyout(menu);
});
}, 100);
});
}
function containFlyout(menu) {
menu.style.top = "";
if (getComputedStyle(menu).position !== "absolute") return;
var r = menu.getBoundingClientRect();
if (!r.height) return;
var overflow = r.bottom - (window.innerHeight - 10);
if (overflow > 0) {
menu.style.top = -Math.min(overflow, Math.max(0, r.top - 10)) + "px";
}
}
function setCustomIconsPage() {
whenElementRenders("iconsmain", "#iconsmain #fileupload", function() {
if ($("#iconsmain label.fileupload").length) return;
$("#iconsmain #fileupload").parent().prepend('<label for="fileupload" class="fileupload btn btn-info">' + $.t("Upload") + "</label>");
$("#iconsmain > div table:first").find("td:last").append($("#iconsmain > table td:last").children());
$("#iconsmain #fileupload").on("change", function() {
$(this).next().click();
$(this).val("");
});
});
}
function ajaxSuccessCallback() {
setPageTitle();
}
function dzLayoutDescribe(el) {
try {
if (!el || !el.tagName) return "unknown";
var cls = (el.className && el.className.toString ? el.className.toString() : "").trim();
var parts = cls ? cls.split(/\s+/).slice(0, 3) : [];
return el.tagName.toLowerCase() + (parts.length ? "." + parts.join(".") : "");
} catch (e) { return "unknown"; }
}
function dzLayoutWidths(widths) {
var sorted = (widths || []).slice().sort(function(a, b) { return a - b; });
if (!sorted.length) return { cards_painted: 0, card_width: "none", width_buckets: 0, narrowest: null };
var buckets = {};
sorted.forEach(function(w) { buckets[Math.round(w / 4) * 4] = true; });
return {
cards_painted: sorted.length,
card_width: sorted[0] + "-" + sorted[sorted.length - 1] +
" (median " + sorted[Math.floor(sorted.length / 2)] + ")",
width_buckets: Object.keys(buckets).length,
narrowest: sorted[0]
};
}
function dzLayoutFacts() {
var de = document.documentElement;
var vv = window.visualViewport;
var cs = getComputedStyle(de);
var out = {};
out.dpr = window.devicePixelRatio || 1;
out.visual_scale = vv ? Math.round(vv.scale * 100) / 100 : 1;
out.chrome_px = vv ? Math.round(window.innerHeight - vv.height) : 0;
out.root_font_px = parseFloat(cs.fontSize) || 0;
out.body_font_px = parseFloat(getComputedStyle(document.body).fontSize) || 0;
try {
out.forced_colors = window.matchMedia("(forced-colors: active)").matches;
out.prefers_contrast = window.matchMedia("(prefers-contrast: more)").matches;
out.reduced_motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
} catch (e) { }
try {
out.fonts = document.fonts ? String(document.fonts.status) : "unknown";
out.icon_font = document.fonts ? document.fonts.check("16px Ionicons") : false;
} catch (e) { out.fonts = "error"; }
var cardMin = parseFloat(cs.getPropertyValue("--dz-card-min-width")) || 0;
var cardMax = parseFloat(cs.getPropertyValue("--dz-card-max-width")) || 0;
out.card_bounds = cardMin + "-" + cardMax;
var widths = [];
Array.prototype.slice.call(document.querySelectorAll("#main-view .itemBlock")).forEach(function(card) {
var w = card.getBoundingClientRect().width;
if (w > 0) widths.push(Math.round(w));
});
var summary = dzLayoutWidths(widths);
out.cards_painted = summary.cards_painted;
out.card_width = summary.card_width;
out.width_buckets = summary.width_buckets;
out.gutter_px = window.innerWidth - de.clientWidth;
var header = document.querySelector(".navbar-fixed-top");
out.header_px = header ? Math.round(header.getBoundingClientRect().height) : 0;
var foreign = 0;
try {
Array.prototype.slice.call(document.styleSheets).forEach(function(sheet) {
var href = sheet.href || "";
if (href && href.indexOf(location.origin) !== 0) foreign += 1;
});
} catch (e) { }
out.foreign_css = foreign;
out.violations = dzLayoutViolations(out, cardMin);
return out;
}
function dzLayoutViolations(facts, cardMin) {
var bad = [];
try {
var summary = { narrowest: null };
if (facts.cards_painted) {
summary.narrowest = parseInt(String(facts.card_width).split("-")[0], 10);
}
if (cardMin && summary.narrowest && summary.narrowest < cardMin - 2) {
bad.push("card_below_min: " + summary.narrowest + "px against --dz-card-min-width " + cardMin + "px");
}
var se = document.scrollingElement || document.documentElement;
if (se.scrollWidth > se.clientWidth + 1) {
var worst = null, edge = se.clientWidth;
Array.prototype.slice.call(document.querySelectorAll("#main-view *")).forEach(function(el) {
var r = el.getBoundingClientRect();
if (r.width > 0 && r.right > edge + 1) { edge = r.right; worst = el; }
});
bad.push("h_overflow: " + (se.scrollWidth - se.clientWidth) + "px, widest " +
dzLayoutDescribe(worst) + " to " + Math.round(edge) + "px");
}
Array.prototype.slice.call(document.querySelectorAll(
".dz-toast, #dz-set-chip, .ui-dialog, .dz-floorplan-popup, .dz-popup")).forEach(function(el) {
var r = el.getBoundingClientRect();
if (!r.width || getComputedStyle(el).display === "none") return;
if (r.left < -1 || r.right > window.innerWidth + 1 || r.top < -1) {
bad.push("offscreen: " + dzLayoutDescribe(el) + " at " + Math.round(r.left) + "," +
Math.round(r.top) + " " + Math.round(r.width) + "x" + Math.round(r.height));
}
});
} catch (e) { bad.push("measure_failed: " + ((e && e.message) || e)); }
return bad;
}
if (typeof dzDiagRegister === "function") {
dzDiagRegister("layout", function() { return dzLayoutFacts(); });
}
