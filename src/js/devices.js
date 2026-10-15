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
function getCardDevice(item) {
var el = item.closest(".item")[0];
var scope = (typeof angular !== "undefined" && el) ? angular.element(el).scope() : null;
return scope ? (scope.device || (scope.ctrl && scope.ctrl.device)) : null;
}
function isPlainOnOffSwitch(item) {
var device = getCardDevice(item);
if (!device) return false;
if (typeof device.SwitchType !== "string") return false;
if (device.Type === "Security" ||
NON_TOGGLE_SWITCH_TYPES.indexOf(device.SwitchType) !== -1) {
return false;
}
var iconCell = item.find("#bigtext").siblings("#img");
var hasLinkCursor = iconCell.hasClass("lcursor") ||
iconCell.find(".lcursor").length > 0;
return hasLinkCursor &&
item.find(".dimslider").length === 0 &&
item.find(".selectorlevels").length === 0 &&
item.find(".btn-group").length === 0;
}
function isLightSwitchContext(item, status) {
var parentId = item.parent().attr("id") || "";
var inDynamicDashboard = (item.closest(".dd-dz-inner").length > 0 || item.closest(".dd-dz-favorites").length > 0) &&
(status === "On" || status === "Off");
return ((location.hash === "#/Dashboard") && (parentId.startsWith("light") || inDynamicDashboard)) ||
(location.hash === "#/LightSwitches");
}
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
function retagSelectorWrapCorners() {
var shells = [];
$("#main-view .item .btn-group").each(function() {
if ($(this).closest(".span3").length) return;
shells.push({ el: this, $btns: $(this).children(".btn") });
});
$("#main-view td#status > span > span > .btn-mini").each(function() {
var outer = this.parentElement.parentElement;
for (var i = 0; i < shells.length; i++) {
if (shells[i].el === outer) return;
}
shells.push({ el: outer, $btns: $(outer).find(".btn-mini") });
});
shells.forEach(function(shell) {
var $btns = shell.$btns;
$btns.removeAttr("data-wrap-corner-tr").removeAttr("data-wrap-corner-bl").removeAttr("data-wrap-corner-br");
if ($btns.length < 2) return;
var rows = new Map();
$btns.each(function() {
var top = Math.round(this.offsetTop);
if (!rows.has(top)) rows.set(top, []);
rows.get(top).push(this);
});
if (rows.size < 2) return;
var tops = Array.from(rows.keys()).sort(function(a, b) { return a - b; });
var firstRow = rows.get(tops[0]).sort(function(a, b) { return a.offsetLeft - b.offsetLeft; });
var lastRow = rows.get(tops[tops.length - 1]).sort(function(a, b) { return a.offsetLeft - b.offsetLeft; });
firstRow[firstRow.length - 1].setAttribute("data-wrap-corner-tr", "");
lastRow[0].setAttribute("data-wrap-corner-bl", "");
lastRow[lastRow.length - 1].setAttribute("data-wrap-corner-br", "");
});
}
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
function dzEnhanceDeviceCard($item, stage) {
let idx = $item.find("#name").attr("data-idx");
if (typeof idx === "undefined" || idx === "") {
idx = $item.parent().attr("id");
if (typeof idx === "undefined") {
idx = $item.attr("id");
} else {
idx = idx.replace(/^\D+/g, "");
}
}
dzPassCards += 1;
if (typeof idx === "undefined" || idx === "") { dzPassUnresolvedIdx += 1; }
var $trs = $item.find("tr");
if (stage === "visible") {
$trs.attr("data-idx", idx);
$item.find("#name").removeAttr("title");
var status = readSwitchStatus($item);
setDeviceOpacity(idx, status, $trs);
if ($trs.find(".switch").length === 0) {
var isGroupCard = $item.find("#img2").length > 0 &&
($item.parents("#scenecontent").length > 0 ||
$item.parents("#dashScenes").length > 0);
if (isGroupCard && theme.features.switch_instead_of_bigtext_scenes.enabled === true) {
if (typeof setDeviceSwitch === "function") { setDeviceSwitch(idx, status); }
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
if ($trs.find(".options-cell").length === 0) {
setDeviceOptions(idx, $trs);
}
var lastupdateEl = $item.find("#lastupdate");
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
var dzPassCards = 0, dzPassUnresolvedIdx = 0;
function dzRunDevicePass(stage) {
dzPassCards = 0;
dzPassUnresolvedIdx = 0;
$("#main-view .item").each(function() {
dzEnhanceDeviceCard($(this), stage);
});
if (dzLogOn) {
dzLog("device_pass", "pass_complete", {
stage: stage,
cards: dzPassCards,
unresolved_idx: dzPassUnresolvedIdx,
route: (typeof location !== "undefined" ? location.hash : "")
});
}
if (stage === "visible") {
setAllDevicesIconsStatus();
dzSetFilterOnRender();
} else {
retagSelectorWrapCorners();
}
}
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
function setAllDevicesFeatures() {
dzRunDevicePass("visible");
dzRunDevicePass("deferred");
}
function dzCardIdx($card) {
var tr = $card.find("tr[data-idx]").attr("data-idx");
if (tr) return tr;
var core = $card.find("#name[data-idx]").attr("data-idx");
if (core && /^\d+$/.test(core)) return core;
var t = $card.find("table[id^='itemtable']").attr("id");
var m = t && t.match(/(\d+)/);
return m ? m[1] : null;
}
function setAllDevicesIconsStatus() {
$("div.item.statusProtected").each(function() {
if ($(this).find("#name > i.ion-ios-lock").length === 0) {
$(this).find("#name").prepend("<i class='ion-ios-lock' title='" + $.t("Protected") + "'></i>&nbsp;");
}
});
$("div.item.statusDisabled").each(function() {
if ($(this).find("#name > i.ion-ios-remove-circle-outline").length === 0) {
$(this).find("#name").prepend("<i class='ion-ios-remove-circle-outline warning-text' title='" + $.t("Disabled") + "'></i>&nbsp;");
}
});
dzWarnPass({
selector: "div.item.statusTimeout",
cleared: "div.item:not(.statusTimeout)",
feature: "warn_timeout",
icon: "ion-ios-wifi",
toastIcon: "ion-ios-wifi",
iconTitle: "Sensor Timeout",
keyPrefix: "timeout",
group: "device-timeout",
title: $.t("Sensor Timeout"),
groupTitle: function(c) { return dzT("toasts.sensors_timed_out", { count: c }); }
});
dzWarnPass({
selector: "div.item.statusLowBattery",
cleared: "div.item:not(.statusLowBattery)",
feature: "warn_battery",
icon: "ion-ios-battery-dead",
toastIcon: "ion-md-battery-full",
iconTitle: "Battery Low Level",
keyPrefix: "battery",
group: "device-battery",
title: $.t("Battery Level") + " " + $.t("Low"),
groupTitle: function(c) { return dzT("toasts.devices_low_on_battery", { count: c }); }
});
}
var dzWarnStoreCache = null;
function dzWarnStore() {
if (dzWarnStoreCache) return dzWarnStoreCache;
var storageKey = themeFolder + DZ_WARN_STORE_KEY_SUFFIX;
var data = null;
function load() {
if (!data) {
var raw = localStorage.getItem(storageKey);
data = raw ? JSON.parse(raw) : {};
}
return data;
}
function save() { localStorage.setItem(storageKey, JSON.stringify(data || {})); }
dzWarnStoreCache = {
get: function(key) { return load()[key]; },
set: function(key, value) { load()[key] = value; save(); },
remove: function(key) {
var d = load();
if (!Object.prototype.hasOwnProperty.call(d, key)) return;
delete d[key];
save();
},
keys: function() { return Object.keys(load()); }
};
dzWarnPrune(dzWarnStoreCache, Date.now());
return dzWarnStoreCache;
}
function dzWarnPass(cfg) {
var f = theme.features[cfg.feature];
var enabled = !!f && f.enabled === true;
var mode = theme.warn_repeat || "daily";
var now = Date.now();
var dzFlagged = 0, dzWarned = 0, dzSuppressed = 0, dzCleared = 0;
var flaggedKeys = [];
$(cfg.selector).each(function() {
var $card = $(this);
if ($card.find("#name > i." + cfg.icon).length === 0) {
$card.find("#name").prepend("<i class='" + cfg.icon + " blink warning-text' title='" +
$.t(cfg.iconTitle) + "'></i>&nbsp;");
}
dzFlagged += 1;
if (!enabled) return;
var idx = dzCardIdx($card);
var key = idx ? cfg.keyPrefix + ":" + idx
: dzWarnKey(cfg.keyPrefix, idx, $card.find("#name").text().trim());
if (key) flaggedKeys.push(key);
if (key && !dzWarnRepeatAllows(dzWarnStore(), key, mode, now)) { dzSuppressed += 1; return; }
var name = $card.find("#name").text().trim();
var result = dzToast({
type: "warning",
title: cfg.title,
body: name,
deviceName: name,
deviceIdx: idx,
key: key,
group: cfg.group,
groupTitle: cfg.groupTitle,
source: "device-warning",
icon: cfg.toastIcon
});
if (result.shown && !result.duplicate) { dzWarned += 1; }
if (key && idx && result.shown && !result.duplicate) {
dzWarnRecord(dzWarnStore(), key, mode, now);
}
});
if (!enabled) {
dzWarnPassLog(cfg, enabled, dzFlagged, 0, 0, 0, null);
return;
}
var flagged = {};
flaggedKeys.forEach(function(key) { flagged[key] = true; });
$(cfg.cleared).each(function() {
var $card = $(this);
var idx = dzCardIdx($card);
var key = idx ? cfg.keyPrefix + ":" + idx
: dzWarnKey(cfg.keyPrefix, idx, $card.find("#name").text().trim());
if (!key || flagged[key] === true) return;
if (dzToastState && dzToastState.seen && dzToastState.seen[key] === true) { dzCleared += 1; }
dzToastClearKey(dzToastState, key);
try { dzWarnStore().remove(key); } catch (e) { }
});
dzWarnPassLog(cfg, enabled, dzFlagged, dzWarned, dzSuppressed, dzCleared, flaggedKeys);
}
function dzWarnPassLog(cfg, enabled, flaggedCount, warned, suppressed, cleared, keys) {
if (!dzLogOn) return;
try {
var entry = {
condition: cfg.keyPrefix,
enabled: enabled,
flagged: flaggedCount,
route: (typeof location !== "undefined" ? location.hash : "")
};
if (enabled) {
entry.warned = warned;
entry.suppressed = suppressed;
entry.cleared = cleared;
var shape = dzDiagKeyShape(keys);
entry.keys_idx = shape.keys_idx;
entry.keys_named = shape.keys_named;
}
dzLog("warn_" + cfg.keyPrefix, "pass_complete", entry);
} catch (e) { }
}
function resolveRows(idx, $trs) {
return ($trs && $trs.length) ? $trs : $("tr[data-idx='" + idx + "']");
}
function setDeviceOptions(idx, $trs) {
var rows = resolveRows(idx, $trs);
rows.each(function() {
let subnav = $(this).find(".options");
let subnavButton = $(this).find(".options-cell");
if (subnav.length && subnavButton.length == 0) {
var itemEl = $(this).closest('.item')[0] || $(this).parents('.item')[0];
subnav[0].appendChild(dzDeviceCopyMount(idx, itemEl));
$(this).append('<td class="options-cell" title="' + $.t("More options") + '"><i class="ion-md-more"></i></td>');
$(this).on("click", "td.options-cell", function(e) {
e.preventDefault();
dzDeviceCopyCollapse($(this).siblings("td.options")[0]);
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
var currentScope = angular.element(itemEl).scope();
var currentDevice = currentScope?.device || currentScope?.ctrl?.device || currentScope?.item;
var currentlyFav = currentDevice ? currentDevice.Favorite !== 0 : false;
var clickTarget = currentlyFav
? rows.find('.options [ng-click*="akeFavorite(0)"]')
: rows.find('.options [ng-click*="akeFavorite(1)"]');
if (!clickTarget.length) { return; }
clickTarget.click();
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
function setDeviceCustomIcon(idx, status, $trs) {
var switchState = switchLabels();
var rows = resolveRows(idx, $trs);
var icons = theme.icons;
for (var i = 0; i < icons.length; i++) {
var photo = dzThemeImageName(icons[i].img);
if (icons[i].idx == idx && photo) {
rows.find("#img img").attr("src", "images/" + photo);
if (status == switchState.on || status == 'On') {
rows.find("#img img").removeClass("user").addClass("userOn");
} else {
rows.find("#img img").removeClass("userOn").addClass("user");
}
}
}
}
function setDeviceWindDirectionIcon(idx, direction, $trs) {
var rows = resolveRows(idx, $trs);
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
var DZ_XLINK_NS = "http://www.w3.org/1999/xlink";
function setFloorplanWindDirectionIcons() {
if (theme.features.wind_direction.enabled !== true) return;
var stage = document.getElementById("floorplancontent");
if (!stage) return;
stage.querySelectorAll("image").forEach(function(img) {
var href = img.getAttributeNS(DZ_XLINK_NS, "href") || img.getAttribute("href") || "";
var m = href.match(/^images\/Wind([A-Z]{1,3})\.png$/);
if (m) img.setAttributeNS(DZ_XLINK_NS, "href", "images/wind-direction/Wind" + m[1] + ".png");
});
}
var DZ_SVG_NS = "http://www.w3.org/2000/svg";
function setFloorplanLastSeen() {
if (theme.features.time_ago.enabled !== true) return;
var stage = document.getElementById("floorplancontent");
if (!stage) return;
stage.querySelectorAll("tspan#lastupdate").forEach(function(tspan) {
if (tspan.querySelector("tspan")) return;
var when = moment(tspan.textContent.trim(), "YYYY-MM-DD HH:mm:ss", true);
if (!when.isValid()) return;
var title = document.createElementNS(DZ_SVG_NS, "title");
title.textContent = when.format("L LT");
var live = document.createElementNS(DZ_SVG_NS, "tspan");
tspan.textContent = " ";
tspan.appendChild(live);
tspan.appendChild(title);
$(live).livestamp(when.format());
});
}
function setDeviceLastUpdate(idx, lastupdate, $trs) {
if (typeof lastupdate === "string") {
var dateMatch = lastupdate.match(/\d{4}[-/]\d{2}[-/]\d{2}[\sT]\d{2}:\d{2}:\d{2}/);
if (dateMatch) lastupdate = dateMatch[0];
}
if (moment(lastupdate).isAfter(moment()))
lastupdate = moment();
var rows = resolveRows(idx, $trs);
rows.each(function() {
let lastupdateEl = $(this).find("#lastupdate");
let barEl = lastupdateEl.children("dz-bar, dz-temp-bar, dz-weather-bar").detach();
if (theme.features.time_ago.enabled === true) {
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
function setDeviceOpacity(idx, status, $trs) {
var switchState = switchLabels();
if (theme.features.fade_off_items.enabled === true) {
var rows = resolveRows(idx, $trs);
if (status === switchState.off || status === 'Off' || status === switchState.closed || status === 'Closed') {
rows.parents(".item").addClass("fadeOff");
} else {
rows.parents(".item").removeClass("fadeOff");
}
}
}
function initDeviceLiveUpdates($scope) {
$scope.$on('device_update', function (event, data) {
dzReapplyDeviceFilter();
if (data.Type === "Light/Switch") {
setDeviceOpacity(data.idx, data.Status);
if (theme.features.icon_image.enabled === true) {
setTimeout(setDeviceCustomIcon, 10, data.idx, data.Status);
}
}
if (theme.features.switch_instead_of_bigtext.enabled === true &&
$("tr[data-idx='" + data.idx + "'] .switch").length > 0) {
setDeviceSwitch(data.idx, data.Status);
}
if (data.Type.startsWith("Temp") || (data.Type === "Wind")) {
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
setTimeout(setDeviceWindDirectionIcon, 10, data.idx, data.DirectionStr);
}
}
setTimeout(function() {
let lastupd = moment(data.LastUpdate, ["YYYY-MM-DD HH:mm:ss", "L LT"]).format();
setDeviceLastUpdate(data.idx, lastupd);
setAllDevicesIconsStatus();
if ($scope.config && $scope.config.ShowUpdatedEffect === true) {
var tr = $("tr[data-idx='" + data.idx + "']");
tr.addClass("update-pulse");
setTimeout(function() { tr.removeClass("update-pulse"); }, 800);
}
}, 10);
});
$scope.$on('scene_update', function (event, data) {
if (theme.features.switch_instead_of_bigtext_scenes.enabled === true) {
setDeviceSwitch(data.idx, data.Status);
}
let lastupd = moment(data.LastUpdate, ["YYYY-MM-DD HH:mm:ss", "L LT"]).format();
setDeviceLastUpdate(data.idx, lastupd);
setDeviceOpacity(data.idx, data.Status);
});
}
var domSettledCallbacks = [];
function dzOnDomSettled(callback) {
domSettledCallbacks.push(callback);
}
function dzRecordsNeedPass(records) {
function onlyText(nodes) {
for (var i = 0; i < nodes.length; i++) {
if (nodes[i].nodeType !== 3) return false;
}
return true;
}
for (var r = 0; r < records.length; r++) {
var rec = records[r];
if (rec.type !== "childList") return true;
if (!onlyText(rec.addedNodes) || !onlyText(rec.removedNodes)) return true;
}
return false;
}
function initDeviceObserver() {
var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
var SETTLE_MS = 50;
var MAX_WAIT_MS = 150;
var settleTimer = null;
var deadlineTimer = null;
var observer = new MutationObserver(function(records) {
if (!dzRecordsNeedPass(records)) return;
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
setDevicesNativeSelectorForMobile();
if ($("#main-view").find(".item, td#status > span > span > .btn-mini").length > 0) {
try {
dzRunDevicePass("visible");
dzScheduleDeferredPass();
} catch (e) {
console.warn("visible device pass threw", e);
}
}
domSettledCallbacks.forEach(function(callback, index) {
try {
callback();
} catch (e) {
console.warn("dzOnDomSettled callback " + index + " (" + (callback.name || "anonymous") + ") threw", e);
}
});
observer.takeRecords();
}
dzOnDomSettled(setFloorplanWindDirectionIcons);
dzOnDomSettled(setFloorplanLastSeen);
observer.observe(document.getElementById("holder") || document.body, {
childList: true,
subtree: true,
attributes: true,
attributeFilter: ["class"]
});
}
if (typeof dzDiagRegister === "function") {
dzDiagRegister("cards", function(opts) {
var out = {
total: $("#main-view .item").length,
flagged_timeout: $("#main-view .item.statusTimeout").length,
flagged_battery: $("#main-view .item.statusLowBattery").length,
unresolved_idx: 0
};
var named = [];
$("#main-view .item.statusTimeout, #main-view .item.statusLowBattery").each(function() {
var $card = $(this);
if (!dzCardIdx($card)) { out.unresolved_idx += 1; }
if (opts && opts.names) { named.push($card.find("#name").text().trim()); }
});
if (opts && opts.names) { out.flagged_names = named; }
return out;
});
dzDiagRegister("warnings", function() {
var seen = (typeof dzToastState !== "undefined" && dzToastState && dzToastState.seen)
? Object.keys(dzToastState.seen) : [];
var shape = dzDiagKeyShape(seen);
var out = { keys_idx: shape.keys_idx, keys_named: shape.keys_named,
repeat_mode: (typeof theme !== "undefined" && theme.warn_repeat) || "daily" };
try {
var now = Date.now(), ages = { under_1h: 0, under_1d: 0, under_7d: 0, older: 0 };
dzWarnStore().keys().forEach(function(k) {
var age = now - (dzWarnStore().get(k) || now);
if (age < 3600000) ages.under_1h += 1;
else if (age < 86400000) ages.under_1d += 1;
else if (age < 604800000) ages.under_7d += 1;
else ages.older += 1;
});
out.store_ages = ages;
} catch (e) { }
return out;
});
}
